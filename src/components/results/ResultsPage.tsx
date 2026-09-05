import React, { useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import { Card, EmptyState, Select, TextArea, TextInput } from '../ui/Primitives'
import { STATUS_RESULTADO_OPTIONS } from '../../types'
import { tidy } from '../../lib/normalize'

export function ResultsPage() {
  const { data, updateResult } = useAppData()
  const { show } = useToast()
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const actionsById = useMemo(() => new Map((data?.actions ?? []).map((a) => [a.id, a])), [data?.actions])

  const rows = useMemo(() => {
    if (!data) return []
    let list = data.results.filter((r) => {
      const action = actionsById.get(r.actionId)
      const archived = action?.arquivada ?? false
      return archived === showArchived
    })
    if (search.trim()) {
      const q = tidy(search).toLowerCase()
      list = list.filter((r) => [r.publicoAlvo, r.planoAcao, r.resultadoEsperado, r.resultadoObtido].join(' ').toLowerCase().includes(q))
    }
    return list
  }, [data, actionsById, search, showArchived])

  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-choc">Resultados</h1>
          <p className="text-sm text-choc-dark/60">
            Uma linha por ação cadastrada no Gerenciador de Ações — Público-alvo e Plano de Ação são preenchidos automaticamente pelo ID da ação.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TextInput placeholder="Pesquisar…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <button className="text-sm text-choc underline underline-offset-2" onClick={() => setShowArchived((s) => !s)}>
          {showArchived ? 'Ver resultados de ações ativas' : 'Ver resultados de ações arquivadas'}
        </button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-choc/10 text-left text-xs uppercase tracking-wide text-choc-dark/50">
              <th className="px-3 py-2 w-40">Público-alvo</th>
              <th className="px-3 py-2 w-56">Plano de Ação</th>
              <th className="px-3 py-2 w-64">Resultado Esperado</th>
              <th className="px-3 py-2 w-64">Resultado Obtido</th>
              <th className="px-3 py-2 w-40">Status do Resultado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.actionId} className="border-b border-choc/5 align-top">
                <td className="px-3 py-2 text-choc-dark/70">{r.publicoAlvo}</td>
                <td className="px-3 py-2 font-medium">{r.planoAcao}</td>
                <td className="px-3 py-2">
                  <TextArea
                    rows={2}
                    value={r.resultadoEsperado}
                    onChange={(e) => updateResult(r.actionId, { resultadoEsperado: e.target.value })}
                    onBlur={() => show('Resultado atualizado.')}
                    placeholder="A preencher"
                  />
                </td>
                <td className="px-3 py-2">
                  <TextArea
                    rows={2}
                    value={r.resultadoObtido}
                    onChange={(e) => updateResult(r.actionId, { resultadoObtido: e.target.value })}
                    onBlur={() => show('Resultado atualizado.')}
                    placeholder="A preencher"
                  />
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={r.statusResultado}
                    onChange={(v) => {
                      updateResult(r.actionId, { statusResultado: v as (typeof STATUS_RESULTADO_OPTIONS)[number] | '' })
                      show('Resultado atualizado.')
                    }}
                    options={[...STATUS_RESULTADO_OPTIONS]}
                    allowEmpty
                    placeholder="—"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState message="Nenhum resultado encontrado." />}
      </Card>
    </div>
  )
}
