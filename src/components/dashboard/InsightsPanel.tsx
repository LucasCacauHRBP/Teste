import React, { useMemo, useState } from 'react'
import type { ActionItem, Insight, InsightCategory, ResultItem } from '../../types'
import { Card, Badge } from '../ui/Primitives'
import { computeQualityScore, scoreBand } from '../../lib/qualityScore'

const CATEGORY_TONE: Record<InsightCategory, 'bad' | 'warn' | 'good' | 'neutral'> = {
  Crítico: 'bad',
  Atenção: 'warn',
  Oportunidade: 'neutral',
  Positivo: 'good',
}

export function InsightsPanel({ insights, actions }: { insights: Insight[]; actions: ActionItem[] }) {
  const actionsById = useMemo(() => new Map(actions.map((a) => [a.id, a])), [actions])
  const [filter, setFilter] = useState<InsightCategory | 'Todos'>('Todos')

  const visible = filter === 'Todos' ? insights : insights.filter((i) => i.category === filter)
  const counts = useMemo(() => {
    const c: Record<InsightCategory, number> = { Crítico: 0, Atenção: 0, Oportunidade: 0, Positivo: 0 }
    for (const i of insights) c[i.category]++
    return c
  }, [insights])

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h2 className="text-sm font-semibold text-choc-dark/70">Insights e Sugestões</h2>
        <div className="flex flex-wrap gap-1.5">
          {(['Todos', 'Crítico', 'Atenção', 'Oportunidade', 'Positivo'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filter === cat ? 'bg-choc text-white border-choc' : 'bg-white text-choc-dark/70 border-choc/20 hover:bg-beige'
              }`}
            >
              {cat} {cat !== 'Todos' && `(${counts[cat]})`}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {visible.map((insight) => (
          <li key={insight.id} className="border border-choc/10 rounded-lg p-3 flex items-start gap-3">
            <Badge tone={CATEGORY_TONE[insight.category]}>{insight.category}</Badge>
            <div className="min-w-0">
              <p className="text-sm text-choc-dark">{insight.message}</p>
              {insight.relatedActionIds.length > 0 && (
                <p className="text-[11px] text-choc-dark/40 mt-1">
                  Planos: {insight.relatedActionIds.map((id) => actionsById.get(id)?.planoAcao ?? id).join(', ')}
                </p>
              )}
            </div>
          </li>
        ))}
        {visible.length === 0 && <li className="text-sm text-choc-dark/40 py-6 text-center">Nenhum insight nesta categoria.</li>}
      </ul>
    </Card>
  )
}

export function QualityScoreTable({ actions, results }: { actions: ActionItem[]; results: ResultItem[] }) {
  const resultByAction = useMemo(() => new Map(results.map((r) => [r.actionId, r])), [results])
  const rows = useMemo(
    () =>
      actions
        .map((a) => ({ action: a, score: computeQualityScore(a, resultByAction.get(a.id)) }))
        .sort((a, b) => a.score.score - b.score.score),
    [actions, resultByAction]
  )

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-choc-dark/70 mb-3">Score de Qualidade por Plano</h2>
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {rows.map(({ action, score }) => {
          const band = scoreBand(score.score)
          return (
            <details key={action.id} className="border border-choc/10 rounded-lg p-3">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-sm font-medium text-choc-dark truncate pr-2">{action.planoAcao}</span>
                <span className={`font-bold ${band.colorClass}`}>{score.score}</span>
              </summary>
              <ul className="mt-2 space-y-1">
                {score.components.map((c) => (
                  <li key={c.key} className="flex items-center gap-2 text-xs">
                    <span className={c.passed ? 'text-good' : 'text-alert'}>{c.passed ? '✓' : '✗'}</span>
                    <span className="text-choc-dark/70">{c.label}:</span>
                    <span className="text-choc-dark/50">{c.detail}</span>
                  </li>
                ))}
              </ul>
            </details>
          )
        })}
      </div>
    </Card>
  )
}
