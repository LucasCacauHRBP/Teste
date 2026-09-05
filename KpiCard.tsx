import React from 'react'
import { Card } from '../ui/Primitives'

export function KpiCard({
  label,
  value,
  colorClass = 'text-choc',
  sublabel,
}: {
  label: string
  value: string | number
  colorClass?: string
  sublabel?: string
}) {
  return (
    <Card className="p-4 flex flex-col items-center text-center justify-center min-h-[110px]">
      <span className={`text-3xl font-display font-bold ${colorClass}`}>{value}</span>
      <span className="text-[11px] font-semibold text-choc-dark/60 uppercase tracking-wide mt-1">{label}</span>
      {sublabel && <span className="text-[11px] text-choc-dark/40 mt-0.5">{sublabel}</span>}
    </Card>
  )
}
