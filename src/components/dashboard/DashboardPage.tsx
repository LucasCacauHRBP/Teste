import React, { useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { EMPTY_FILTERS } from '../../types'
import type { DashboardFilters } from '../../types'
import { FilterBar, applyFilters } from '../common/FilterBar'
import { KpiCard } from './KpiCard'
import { StatusDonutChart } from './StatusDonutChart'
import { PublicoStaircaseChart } from './PublicoStaircaseChart'
import { InsightsPanel, QualityScoreTable } from './InsightsPanel'
import { generateInsights } from '../../lib/insights'

export function DashboardPage() {
  const { data } = useAppData()
  const [filters, setFilters] = useState<DashboardFilters>(EMPTY_FILTERS)

  const activeActions = useMemo(() => (data ? data.actions.filter((a) => !a.arquivada) : []), [data])
  const filteredActions = useMemo(() => applyFilters(activeActions, filters), [activeActions, filters])
  const filteredActionIds = useMemo(() => new Set(filteredActions.map((a) => a.id)), [filteredActions])
  const filteredResults = useMemo(() => (data ? data.results.filter((r) => filteredActionIds.has(r.actionId)) : []), [data, filteredActionIds])

  const kpis = useMemo(() => {
    const total = filteredActions.length
    const iniciadas = filteredActions.filter((a) => a.statusAtual === 'Iniciado').length
    const mapeando = filteredActions.filter((a) => a.statusAtual === 'Mapeando').length
    const naoRealizadas = filteredActions.filter((a) => a.statusAtual === 'Não realizado').length
    const indiceAvanco = total > 0 ? Math.round(((iniciadas * 1 + mapeando * 0.5) / total) * 100) : 0
    const otimos = filteredResults.filter((r) => r.statusResultado === 'Ótimo').length
    const bons = filteredResults.filter((r) => r.statusResultado === 'Bom').length
    const ruins = filteredResults.filter((r) => r.statusResultado === 'Ruim').length
    return { total, iniciadas, mapeando, naoRealizadas, indiceAvanco, otimos, bons, ruins }
  }, [filteredActions, filteredResults])

  const insights = useMemo(() => generateInsights(filteredActions, filteredResults), [filteredActions, filteredResults])

  if (!data) return null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-choc">Dashboard Executivo</h1>
        <p className="text-sm text-choc-dark/60">Indicadores calculados em tempo real a partir do Gerenciador de Ações e Resultados.</p>
      </div>

      <FilterBar actions={activeActions} filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total de Planos de Ação" value={kpis.total} />
        <KpiCard label="Ações Iniciadas" value={kpis.iniciadas} colorClass="text-good" />
        <KpiCard label="Ações em Mapeamento" value={kpis.mapeando} colorClass="text-caramel" />
        <KpiCard label="Ações Não Realizadas" value={kpis.naoRealizadas} colorClass="text-alert" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1">
        <KpiCard
          label="Índice Geral de Avanço dos Planos"
          value={`${kpis.indiceAvanco}%`}
          sublabel="Iniciado = 100% · Mapeando = 50% · Não realizado = 0%"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Resultados Ótimos" value={kpis.otimos} colorClass="text-good" />
        <KpiCard label="Resultados Bons" value={kpis.bons} colorClass="text-caramel" />
        <KpiCard label="Resultados Ruins" value={kpis.ruins} colorClass="text-alert" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusDonutChart actions={filteredActions} />
        <PublicoStaircaseChart actions={filteredActions} macroPublicoOverrides={data.base.macroPublicoOverrides} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InsightsPanel insights={insights} actions={filteredActions} />
        <QualityScoreTable actions={filteredActions} results={filteredResults} />
      </div>
    </div>
  )
}
