import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppDataProvider, useAppData } from './context/AppDataContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './components/layout/AppLayout'
import { ActionsPage } from './components/actions/ActionsPage'
import { ResultsPage } from './components/results/ResultsPage'
import { HCPage } from './components/hc/HCPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { DashboardPage } from './components/dashboard/DashboardPage'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-beige flex items-center justify-center">
      <div className="text-choc font-display font-bold text-lg animate-pulse">Carregando Plano de Ação Hiper…</div>
    </div>
  )
}

function Routed() {
  const { loading } = useAppData()
  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/acoes" replace />} />
        <Route path="/acoes" element={<ActionsPage />} />
        <Route path="/resultados" element={<ResultsPage />} />
        <Route path="/hc" element={<HCPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/acoes" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppDataProvider>
        <HashRouter>
          <Routed />
        </HashRouter>
      </AppDataProvider>
    </ToastProvider>
  )
}
