import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ActionItem } from '../../types'
import { Card } from '../ui/Primitives'

const COLORS: Record<string, string> = {
  Iniciado: '#3F7D45',
  Mapeando: '#C68B3C',
  'Não realizado': '#A6392F',
}

export function StatusDonutChart({ actions }: { actions: ActionItem[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = { Iniciado: 0, Mapeando: 0, 'Não realizado': 0 }
    for (const a of actions) counts[a.statusAtual] = (counts[a.statusAtual] ?? 0) + 1
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [actions])

  const total = actions.length

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-choc-dark/70 mb-2">Status de Evolução</h2>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] ?? '#999'} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [`${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
