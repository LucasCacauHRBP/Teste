import React, { useMemo, useRef, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, Select, TextInput, ConfirmDialog } from '../ui/Primitives'
import { explainClassification, MACRO_PUBLICO_CATEGORIES } from '../../lib/macroPublico'
import { normalizeKey, tidy } from '../../lib/normalize'
import { exportBackupJson, exportToExcel, parseActionsWorkbook } from '../../lib/excelImportExport'
import { downloadTextFile, rowsToCsv } from '../../lib/csv'
import type { AppData } from '../../types'

function EditableList({
  title,
  items,
  onChange,
}: {
  title: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-choc mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {items.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 bg-beige border border-choc/15 rounded-full px-3 py-1 text-xs">
            {item}
            <button
              className="text-choc-dark/40 hover:text-alert"
              onClick={() => onChange(items.filter((i) => i !== item))}
              aria-label={`Remover ${item}`}
            >
              ×
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-choc-dark/40">Nenhum item cadastrado.</span>}
      </div>
      <div className="flex gap-2">
        <TextInput value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Adicionar novo item…" />
        <Button
          size="sm"
          onClick={() => {
            const v = tidy(draft)
            if (v && !items.some((i) => normalizeKey(i) === normalizeKey(v))) onChange([...items, v])
            setDraft('')
          }}
        >
          Adicionar
        </Button>
      </div>
    </Card>
  )
}

export function SettingsPage() {
  const { data, updateBaseConfig, importActions, restoreFromBackup } = useAppData()
  const { show } = useToast()
  const excelInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<{ actions: ReturnType<typeof parseActionsWorkbook>['actions']; warnings: string[] } | null>(
    null
  )
  const [pendingBackup, setPendingBackup] = useState<AppData | null>(null)

  const uniquePublicos = useMemo(() => {
    if (!data) return []
    const set = new Set(data.actions.map((a) => tidy(a.publicoAlvo)).filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [data])

  if (!data) return null

  function setOverride(tokenKey: string, macro: string | null) {
    const next = { ...data!.base.macroPublicoOverrides }
    if (macro) next[tokenKey] = macro
    else delete next[tokenKey]
    updateBaseConfig({ macroPublicoOverrides: next })
  }

  async function handleExcelFile(file: File) {
    const buffer = await file.arrayBuffer()
    const result = parseActionsWorkbook(buffer, data!.nextActionSeq)
    if (result.actions.length === 0) {
      show('Não foi possível importar: verifique se o arquivo segue o modelo esperado.', 'error')
      return
    }
    setPendingImport(result)
  }

  function confirmImport() {
    if (!pendingImport) return
    importActions(pendingImport.actions, null)
    show(`${pendingImport.actions.length} ação(ões) importada(s) com sucesso.`)
    if (pendingImport.warnings.length) {
      show(`${pendingImport.warnings.length} aviso(s) durante a importação — veja o console para detalhes.`, 'info')
      pendingImport.warnings.forEach((w) => console.warn('[importação]', w))
    }
    setPendingImport(null)
  }

  async function handleBackupFile(file: File) {
    const text = await file.text()
    try {
      const parsed = JSON.parse(text) as AppData
      if (!parsed.actions || !parsed.results || !parsed.hc || !parsed.base) {
        show('Arquivo de backup inválido (estrutura inesperada).', 'error')
        return
      }
      setPendingBackup(parsed)
    } catch {
      show('Não foi possível ler o arquivo de backup (JSON inválido).', 'error')
    }
  }

  function exportActionsCsv() {
    const headers = ['ID da Ação', 'Loja', 'Público-alvo', 'Pilar', 'Plano de Ação', 'Ação', 'Produto', 'Status Atual', 'Responsável', 'Prazo', 'Prioridade']
    const rows = data.actions.map((a) => [a.id, a.loja, a.publicoAlvo, a.pilar, a.planoAcao, a.acao, a.produto, a.statusAtual, a.responsavel, a.prazo, a.prioridade])
    downloadTextFile('gerenciador-de-acoes.csv', rowsToCsv(headers, rows), 'text/csv;charset=utf-8')
    show('CSV exportado.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-choc">Base / Configurações</h1>
        <p className="text-sm text-choc-dark/60">Listas de apoio, classificação de Macro Público e importação/exportação de dados.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EditableList title="Lojas" items={data.base.lojas} onChange={(items) => updateBaseConfig({ lojas: items })} />
        <EditableList title="Pilares" items={data.base.pilares} onChange={(items) => updateBaseConfig({ pilares: items })} />
        <EditableList title="Responsáveis" items={data.base.responsaveis} onChange={(items) => updateBaseConfig({ responsaveis: items })} />
      </div>

      <Card className="p-4">
        <h3 className="font-semibold text-choc mb-1">Macro Público</h3>
        <p className="text-xs text-choc-dark/60 mb-3">
          Classificação executiva automática, usada nos gráficos do Dashboard. O Público-alvo original nunca é alterado — você pode ajustar
          manualmente a classificação de cada valor observado abaixo.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-choc/10 text-left text-xs uppercase tracking-wide text-choc-dark/50">
              <th className="px-3 py-2">Público-alvo (original)</th>
              <th className="px-3 py-2">Classificação atual</th>
              <th className="px-3 py-2">Ajustar</th>
            </tr>
          </thead>
          <tbody>
            {uniquePublicos.flatMap((raw) =>
              explainClassification(raw, data.base.macroPublicoOverrides).map((c) => (
                <tr key={`${raw}::${c.key}`} className="border-b border-choc/5">
                  <td className="px-3 py-2">
                    {raw}
                    {c.token !== raw && <span className="text-choc-dark/40"> → token "{c.token}"</span>}
                  </td>
                  <td className="px-3 py-2">
                    {c.macro} {c.isOverridden && <span className="text-[10px] text-caramel">(manual)</span>}
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={c.isOverridden ? c.macro : ''}
                      onChange={(v) => setOverride(c.key, v || null)}
                      options={[...MACRO_PUBLICO_CATEGORIES]}
                      placeholder="Automático"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-choc">Importar / Exportar</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-choc-dark/60 uppercase mb-2">Excel</h4>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => excelInputRef.current?.click()}>
                Importar Excel (.xlsx)
              </Button>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleExcelFile(file)
                  e.target.value = ''
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  exportToExcel(data)
                  show('Excel exportado.')
                }}
              >
                Exportar Excel (.xlsx)
              </Button>
            </div>
            <p className="text-[11px] text-choc-dark/50 mt-2">
              O Excel importado se torna a nova base do Gerenciador de Ações; Resultados são regenerados preservando o que já foi
              preenchido para os mesmos IDs.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-choc-dark/60 uppercase mb-2">Backup / CSV</h4>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={exportActionsCsv}>
                Exportar CSV
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  downloadTextFile('backup-plano-acao-hiper.json', exportBackupJson(data), 'application/json')
                  show('Backup exportado.')
                }}
              >
                Exportar Backup JSON
              </Button>
              <Button size="sm" onClick={() => jsonInputRef.current?.click()}>
                Importar Backup JSON
              </Button>
              <input
                ref={jsonInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleBackupFile(file)
                  e.target.value = ''
                }}
              />
            </div>
            <p className="text-[11px] text-choc-dark/50 mt-2">
              O backup JSON contém todo o estado (Ações, Resultados, HC, listas) e é a forma mais segura de restaurar os dados.
            </p>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={!!pendingImport}
        title="Confirmar importação"
        message={`Isso substituirá o Gerenciador de Ações atual por ${pendingImport?.actions.length ?? 0} ação(ões) do arquivo importado. Os Resultados já preenchidos para IDs correspondentes serão preservados. Deseja continuar?`}
        confirmLabel="Importar"
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={!!pendingBackup}
        title="Restaurar backup"
        message="Isso substituirá TODOS os dados atuais (Ações, Resultados, HC e listas) pelo conteúdo do backup. Esta ação não pode ser desfeita. Deseja continuar?"
        confirmLabel="Restaurar"
        danger
        onConfirm={() => {
          if (pendingBackup) {
            restoreFromBackup(pendingBackup)
            show('Backup restaurado com sucesso.')
          }
          setPendingBackup(null)
        }}
        onCancel={() => setPendingBackup(null)}
      />
    </div>
  )
}
