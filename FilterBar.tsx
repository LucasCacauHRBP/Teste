import React, { useMemo } from 'react'
import type { ActionItem, DashboardFilters } from '../../types'
import { STATUS_ATUAL_OPTIONS } from '../../types'
import { Select, Button } from '../ui/Primitives'
import { tidy } from '../../lib/normalize'

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  const set = new Set(values.map((v) => tidy(v ?? '')).filter(Boolean))
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function FilterBar({
  actions,
  filters,
  onChange,
}: {
  actions: ActionItem[]
  filters: DashboardFilters
  onChange: (next: DashboardFilters) => void
}) {
  const lojas = useMemo(() => uniqueSorted(actions.map((a) => a.loja)), [actions])
  const publicos = useMemo(() => uniqueSorted(actions.map((a) => a.publicoAlvo)), [actions])
  const pilares = useMemo(() => uniqueSorted(actions.map((a) => a.pilar)), [actions])
  const responsaveis = useMemo(() => uniqueSorted(actions.map((a) => a.responsavel)), [actions])

  const active = Object.values(filters).some((v) => v)

  return (
    <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-choc/10 shadow-card p-4">
      <FilterField label="Loja">
        <Select value={filters.loja ?? ''} onChange={(v) => onChange({ ...filters, loja: v || null })} options={lojas} placeholder="Todas" />
      </FilterField>
      <FilterField label="Público-alvo">
        <Select
          value={filters.publicoAlvo ?? ''}
          onChange={(v) => onChange({ ...filters, publicoAlvo: v || null })}
          options={publicos}
          placeholder="Todos"
        />
      </FilterField>
      <FilterField label="Pilar">
        <Select value={filters.pilar ?? ''} onChange={(v) => onChange({ ...filters, pilar: v || null })} options={pilares} placeholder="Todos" />
      </FilterField>
      <FilterField label="Status">
        <Select
          value={filters.status ?? ''}
          onChange={(v) => onChange({ ...filters, status: (v || null) as DashboardFilters['status'] })}
          options={[...STATUS_ATUAL_OPTIONS]}
          placeholder="Todos"
        />
      </FilterField>
      <FilterField label="Responsável">
        <Select
          value={filters.responsavel ?? ''}
          onChange={(v) => onChange({ ...filters, responsavel: v || null })}
          options={responsaveis}
          placeholder="Todos"
        />
      </FilterField>
      {active && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ loja: null, publicoAlvo: null, pilar: null, status: null, responsavel: null })}>
          Limpar filtros
        </Button>
      )}
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-choc-dark/60 mb-1">{label}</span>
      {children}
    </label>
  )
}

/** Aplica os filtros de forma consistente (usado pelo Gerenciador de Ações e
 * pelo Dashboard, para garantir que os dois "vejam" exatamente o mesmo
 * conjunto de dados ao aplicar o mesmo filtro). */
export function applyFilters(actions: ActionItem[], filters: DashboardFilters): ActionItem[] {
  return actions.filter((a) => {
    if (filters.loja && tidy(a.loja) !== filters.loja) return false
    if (filters.publicoAlvo && tidy(a.publicoAlvo) !== filters.publicoAlvo) return false
    if (filters.pilar && tidy(a.pilar) !== filters.pilar) return false
    if (filters.status && a.statusAtual !== filters.status) return false
    if (filters.responsavel && tidy(a.responsavel) !== filters.responsavel) return false
    return true
  })
}
