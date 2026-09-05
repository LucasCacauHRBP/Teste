import React, { createContext, useCallback, useContext, useRef, useState } from 'react'

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++counter.current
    setToasts((prev) => [...prev, { id, kind, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[92vw]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={
              'rounded-lg px-4 py-3 shadow-card text-sm font-medium text-white animate-[fadein_0.15s_ease-out] ' +
              (t.kind === 'success' ? 'bg-good' : t.kind === 'error' ? 'bg-alert' : 'bg-choc')
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>')
  return ctx
}
