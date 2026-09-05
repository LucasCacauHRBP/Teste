import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'

const NAV_ITEMS = [
  { to: '/acoes', label: 'Gerenciador de Ações' },
  { to: '/resultados', label: 'Resultados' },
  { to: '/hc', label: 'Quadro HC' },
  { to: '/configuracoes', label: 'Base / Configurações' },
  { to: '/dashboard', label: 'Dashboard Executivo' },
]

export function AppLayout() {
  const { backend, fellBackToLocalStorage, saving, lastSavedAt } = useAppData()

  return (
    <div className="min-h-screen bg-beige font-body text-choc-dark flex flex-col">
      <header className="bg-choc text-white sticky top-0 z-30 shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-caramel flex items-center justify-center font-display font-bold text-choc shrink-0">
                P
              </div>
              <div className="min-w-0">
                <h1 className="font-display font-bold leading-tight truncate">Plano de Ação Hiper</h1>
                <p className="text-[11px] text-white/60 leading-tight truncate">Gestão de planos, resultados e indicadores</p>
              </div>
            </div>
            <StatusPill backend={backend} fellBack={fellBackToLocalStorage} saving={saving} lastSavedAt={lastSavedAt} />
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-2 -mb-px scrollbar-thin">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                    isActive ? 'border-caramel text-white bg-white/10' : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-choc-dark/40 py-4">Plano de Ação Hiper — dados salvos automaticamente</footer>
    </div>
  )
}

function StatusPill({
  backend,
  fellBack,
  saving,
  lastSavedAt,
}: {
  backend: 'supabase' | 'localStorage'
  fellBack: boolean
  saving: boolean
  lastSavedAt: number | null
}) {
  const label = backend === 'supabase' ? 'Supabase' : 'Local (offline)'
  return (
    <div className="hidden sm:flex flex-col items-end text-right">
      <span className="text-[11px] font-semibold text-caramel">{saving ? 'Salvando…' : label}</span>
      {fellBack && <span className="text-[10px] text-white/50">Supabase indisponível — usando local</span>}
      {!saving && lastSavedAt && <span className="text-[10px] text-white/40">Salvo às {new Date(lastSavedAt).toLocaleTimeString('pt-BR')}</span>}
    </div>
  )
}
