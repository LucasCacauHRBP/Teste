import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import { Card, StatusBadge, TextInput } from '../ui/Primitives'
import type { HCRow, HCStatus } from '../../types'

export function hcStatus(atual: number, orcado: number): HCStatus {
  const diff = atual - orcado
  if (diff === 0) return 'Dentro do Orçado'
  return diff < 0 ? 'Abaixo do Orçado' : 'Acima do Orçado'
}

export function HCPage() {
  const { data, setHC } = useAppData()
  const { show } = useToast()

  const totals = useMemo(() => {
    if (!data) return { atual: 0, orcado: 0 }
    return data.hc.reduce(
      (acc, r) => ({ atual: acc.atual + r.hcAtual, orcado: acc.orcado + r.hcOrcado }),
      { atual: 0, orcado: 0 }
    )
  }, [data])

  if (!data) return null

  function updateRow(index: number, patch: Partial<HCRow>) {
    const rows = data!.hc.map((r, i) => (i === index ? { ...r, ...patch } : r))
    setHC(rows)
  }

  const chartData = data.hc.map((r) => ({ posicao: r.posicao, 'HC Atual': r.hcAtual, 'HC Orçado': r.hcOrcado }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold text-choc">Quadro HC</h1>
        <p className="text-sm text-choc-dark/60">Comparativo de headcount atual x orçado, por posição.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-choc/10 text-left text-xs uppercase tracking-wide text-choc-dark/50">
                <th className="px-3 py-2">Posição</th>
                <th className="px-3 py-2 w-28">HC Atual</th>
                <th className="px-3 py-2 w-28">HC Orçado</th>
                <th className="px-3 py-2 w-24">Diferença</th>
                <th className="px-3 py-2 w-40">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.hc.map((row, i) => {
                const diff = row.hcAtual - row.hcOrcado
                const status = hcStatus(row.hcAtual, row.hcOrcado)
                return (
                  <tr key={row.posicao} className="border-b border-choc/5">
                    <td className="px-3 py-2 font-medium">{row.posicao}</td>
                    <td className="px-3 py-2">
                      <TextInput
                        type="number"
                        min={0}
                        value={row.hcAtual}
                        onChange={(e) => updateRow(i, { hcAtual: Number(e.target.value) || 0 })}
                        onBlur={() => show('Alteração salva com sucesso.')}
                        className="!py-1 w-20"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <TextInput
                        type="number"
                        min={0}
                        value={row.hcOrcado}
                        onChange={(e) => updateRow(i, { hcOrcado: Number(e.target.value) || 0 })}
                        onBlur={() => show('Alteração salva com sucesso.')}
                        className="!py-1 w-20"
                      />
                    </td>
                    <td className={`px-3 py-2 font-semibold ${diff < 0 ? 'text-alert' : diff > 0 ? 'text-caramel' : 'text-good'}`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                )
              })}
              <tr className="font-bold bg-beige/60">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2">{totals.atual}</td>
                <td className="px-3 py-2">{totals.orcado}</td>
                <td className={`px-3 py-2 ${totals.atual - totals.orcado < 0 ? 'text-alert' : 'text-good'}`}>
                  {totals.atual - totals.orcado > 0 ? `+${totals.atual - totals.orcado}` : totals.atual - totals.orcado}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={hcStatus(totals.atual, totals.orcado)} />
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-choc-dark/70 mb-2">HC Atual x HC Orçado por posição</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5d9c8" />
              <XAxis dataKey="posicao" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="HC Atual" fill="#6D4C41" radius={[4, 4, 0, 0]} />
              <Bar dataKey="HC Orçado" fill="#C68B3C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
