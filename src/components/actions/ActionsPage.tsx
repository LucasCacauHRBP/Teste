import React, { useMemo, useState } from 'react'
import type { ActionInput, ActionItem, DashboardFilters, StatusAtual } from '../../types'
import { EMPTY_FILTERS, STATUS_ATUAL_OPTIONS } from '../../types'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import { Button, Card, ConfirmDialog, Select, StatusBadge, TextInput, EmptyState } from '../ui/Primitives'
import { FilterBar, applyFilters } from '../common/FilterBar'
import { ActionFormModal } from './ActionFormModal'
import { computeQualityScore, scoreBand } from '../../lib/qualityScore'
import { tidy } from '../../lib/normalize'

type SortKey = 'id' | 'loja' | 'publicoAlvo' | 'pilar' | 'planoAcao' | 'statusAtual' | 'prioridade' | 'prazo' | 'score'
type SortDir = 'asc' | 'desc'

export function ActionsPage() {
  const { data, addAction, updateAction, setActionStatus, duplicateAction, setActionArchived, deleteAction } = useAppData()
  const { show } = useToast()

  const [filters, setFilters] = useState<DashboardFilters>(EMPTY_FILTERS)
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ActionItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ActionItem | null>(null)
  const [confirmArchive, setConfirmArchive] = useState<ActionItem | null>(null)

  const resultsByAction = useMemo(() => new Map((data?.results ?? []).map((r) => [r.actionId, r])), [data?.results])

  const visible = useMemo(() => {
    if (!data) return []
    let list = data.actions.filter((a) => a.arquivada === showArchived)
    list = applyFilters(list, filters)
    if (search.trim()) {
      const q = tidy(search).toLowerCase()
      list = list.filter((a) =>
        [a.id, a.loja, a.publicoAlvo, a.demandaGap, a.pilar, a.acaoPilar, a.planoAcao, a.acao, a.produto, a.responsavel]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    }
    const dir = sortDir === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''
      if (sortKey === 'score') {
        va = computeQualityScore(a, resultsByAction.get(a.id)).score
        vb = computeQualityScore(b, resultsByAction.get(b.id)).score
      } else {
        va = a[sortKey] ?? ''
        vb = b[sortKey] ?? ''
      }
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb), 'pt-BR') * dir
    })
    return list
  }, [data, filters, search, showArchived, sortKey, sortDir, resultsByAction])

  if (!data) return null

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(a: ActionItem) {
    setEditing(a)
    setModalOpen(true)
  }

  function handleSubmit(input: ActionInput) {
    if (editing) {
      updateAction(editing.id, input)
      show('Alteração salva com sucesso.')
    } else {
      addAction(input)
      show('Plano criado.')
    }
    setModalOpen(false)
  }

  const lojaOptions = data.base.lojas
  const pilarOptions = data.base.pilares
  const responsavelOptions = data.base.responsaveis

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-choc">Gerenciador de Ações</h1>
          <p className="text-sm text-choc-dark/60">{visible.length} ação(ões) {showArchived ? 'arquivada(s)' : 'ativa(s)'} exibida(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowArchived((s) => !s)}>
            {showArchived ? 'Ver ações ativas' : 'Ver arquivadas'}
          </Button>
          <Button onClick={openCreate}>+ Nova Ação</Button>
        </div>
      </div>

      <FilterBar actions={data.actions.filter((a) => a.arquivada === showArchived)} filters={filters} onChange={setFilters} />

      <TextInput placeholder="Pesquisar por texto em qualquer campo…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="border-b border-choc/10 text-left text-xs uppercase tracking-wide text-choc-dark/50">
              <Th label="ID" sortKey="id" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <Th label="Loja" sortKey="loja" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <Th label="Público-alvo" sortKey="publicoAlvo" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <Th label="Pilar" sortKey="pilar" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <Th label="Plano de Ação" sortKey="planoAcao" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <Th label="Status" sortKey="statusAtual" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <Th label="Prioridade" sortKey="prioridade" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <Th label="Prazo" sortKey="prazo" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <Th label="Score" sortKey="score" current={sortKey} dir={sortDir} onClick={toggleSort} />
              <th className="px-3 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => {
              const score = computeQualityScore(a, resultsByAction.get(a.id))
              const band = scoreBand(score.score)
              return (
                <tr key={a.id} className="border-b border-choc/5 hover:bg-beige/60 align-top">
                  <td className="px-3 py-2 font-mono text-xs text-choc-dark/60">{a.id}</td>
                  <td className="px-3 py-2">{a.loja || '—'}</td>
                  <td className="px-3 py-2 max-w-[160px]">{a.publicoAlvo}</td>
                  <td className="px-3 py-2 max-w-[140px]">{a.pilar || '—'}</td>
                  <td className="px-3 py-2 max-w-[220px] font-medium text-choc-dark">{a.planoAcao}</td>
                  <td className="px-3 py-2">
                    <Select
                      value={a.statusAtual}
                      onChange={(v) => {
                        setActionStatus(a.id, v as StatusAtual)
                        show('Status atualizado.')
                      }}
                      options={[...STATUS_ATUAL_OPTIONS]}
                      className="!py-1"
                    />
                  </td>
                  <td className="px-3 py-2">{a.prioridade}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{a.prazo ? new Date(a.prazo).toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`font-bold ${band.colorClass}`}>{score.score}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const created = duplicateAction(a.id)
                          if (created) show('Plano duplicado.')
                        }}
                      >
                        Duplicar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmArchive(a)}>
                        {a.arquivada ? 'Reativar' : 'Arquivar'}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setConfirmDelete(a)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && <EmptyState message="Nenhuma ação encontrada com os filtros/pesquisa atuais." />}
      </Card>

      <ActionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        lojaOptions={lojaOptions}
        pilarOptions={pilarOptions}
        responsavelOptions={responsavelOptions}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Excluir ação"
        message={`Tem certeza que deseja excluir permanentemente "${confirmDelete?.planoAcao}"? Esta ação também removerá o resultado associado e não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteAction(confirmDelete.id)
            show('Ação excluída.', 'info')
          }
          setConfirmDelete(null)
        }}
      />

      <ConfirmDialog
        open={!!confirmArchive}
        title={confirmArchive?.arquivada ? 'Reativar ação' : 'Arquivar ação'}
        message={
          confirmArchive?.arquivada
            ? `Reativar "${confirmArchive?.planoAcao}"? Ela voltará a aparecer nas listas e no Dashboard.`
            : `Arquivar "${confirmArchive?.planoAcao}"? Ela deixará de aparecer nas listas e no Dashboard, mas não será apagada.`
        }
        confirmLabel={confirmArchive?.arquivada ? 'Reativar' : 'Arquivar'}
        onCancel={() => setConfirmArchive(null)}
        onConfirm={() => {
          if (confirmArchive) {
            setActionArchived(confirmArchive.id, !confirmArchive.arquivada)
            show(confirmArchive.arquivada ? 'Ação reativada.' : 'Ação arquivada.')
          }
          setConfirmArchive(null)
        }}
      />
    </div>
  )
}

function Th({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onClick: (k: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <th className="px-3 py-2 cursor-pointer select-none" onClick={() => onClick(sortKey)}>
      {label} {active && (dir === 'asc' ? '▲' : '▼')}
    </th>
  )
}
