import React, { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ActionItem, BaseConfig } from '../../types'
import { Card } from '../ui/Primitives'
import { splitPublicoAlvo, tidy, normalizeKey } from '../../lib/normalize'
import { classifyPublicoAlvo } from '../../lib/macroPublico'

type Mode = 'original' | 'macro'

interface Bucket {
  label: string
  count: number
  actionIds: string[]
}

function buildBuckets(actions: ActionItem[], mode: Mode, overrides: BaseConfig['macroPublicoOverrides']): Bucket[] {
  const map = new Map<string, Bucket>()
  for (const a of actions) {
    const labels = mode === 'original' ? splitPublicoAlvo(a.publicoAlvo).map(tidy) : classifyPublicoAlvo(a.publicoAlvo, overrides)
    for (const label of labels) {
      const key = normalizeKey(label)
      const bucket = map.get(key) ?? { label, count: 0, actionIds: [] }
      bucket.count += 1
      bucket.actionIds.push(a.id)
      map.set(key, bucket)
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

const PALETTE = ['#3E2723', '#6D4C41', '#C68B3C', '#8A5A2B', '#A6392F', '#3F7D45', '#7A6A5D']

export function PublicoStaircaseChart({ actions, macroPublicoOverrides }: { actions: ActionItem[]; macroPublicoOverrides: BaseConfig['macroPublicoOverrides'] }) {
  const [mode, setMode] = useState<Mode>('macro')

  const buckets = useMemo(() => buildBuckets(actions, mode, macroPublicoOverrides), [actions, mode, macroPublicoOverrides])
  const totalIncidencias = buckets.reduce((s, b) => s + b.count, 0)
  const multiPublico = actions.some((a) => splitPublicoAlvo(a.publicoAlvo).length > 1)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-choc-dark/70">Ações por {mode === 'macro' ? 'Macro Público' : 'Público-alvo'}</h2>
        <div className="inline-flex rounded-lg border border-choc/20 overflow-hidden text-xs">
          <button
            className={`px-3 py-1.5 ${mode === 'original' ? 'bg-choc text-white' : 'bg-white text-choc'}`}
            onClick={() => setMode('original')}
          >
            Público-alvo original
          </button>
          <button className={`px-3 py-1.5 ${mode === 'macro' ? 'bg-choc text-white' : 'bg-white text-choc'}`} onClick={() => setMode('macro')}>
            Macro Público
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(220, buckets.length * 38)}>
        <BarChart data={buckets} layout="vertical" margin={{ left: 24, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5d9c8" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => [`${value} ação(ões) — ${totalIncidencias > 0 ? Math.round((value / totalIncidencias) * 100) : 0}%`, 'Quantidade']}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {buckets.map((b, i) => (
              <Cell key={b.label} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {multiPublico && (
        <p className="text-[11px] text-choc-dark/50 mt-2">
          Algumas ações têm mais de um público-alvo associado e são contadas em mais de uma categoria — os percentuais consideram o total de
          incidências ({totalIncidencias}), não o total de ações.
        </p>
      )}
    </Card>
  )
}
