import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ActionInput, ActionItem, AppData, BaseConfig, HCRow, ResultItem, StatusAtual } from '../types'
import { loadAppData, saveAppData, type BackendName } from '../lib/repository'
import { formatActionId } from '../lib/id'
import { syncResultsWithActions } from '../lib/excelImportExport'

interface AppDataContextValue {
  data: AppData | null
  loading: boolean
  backend: BackendName
  fellBackToLocalStorage: boolean
  saving: boolean
  lastSavedAt: number | null

  addAction: (input: ActionInput) => ActionItem
  updateAction: (id: string, patch: Partial<ActionInput>) => void
  setActionStatus: (id: string, status: StatusAtual) => void
  duplicateAction: (id: string) => ActionItem | null
  setActionArchived: (id: string, archived: boolean) => void
  deleteAction: (id: string) => void

  updateResult: (actionId: string, patch: Partial<Pick<ResultItem, 'resultadoEsperado' | 'resultadoObtido' | 'statusResultado'>>) => void

  setHC: (rows: HCRow[]) => void

  updateBaseConfig: (patch: Partial<BaseConfig>) => void

  /** Substitui o Gerenciador de Ações por uma lista importada (ex.: nova
   * versão do Excel), regenerando Resultados e preservando o que já existia
   * para IDs que se repetem. */
  importActions: (actions: ActionItem[], hc?: HCRow[] | null) => void

  /** Restaura o estado inteiro a partir de um backup JSON exportado
   * anteriormente por esta aplicação. */
  restoreFromBackup: (backup: AppData) => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

const SAVE_DEBOUNCE_MS = 600

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [backend, setBackend] = useState<BackendName>('localStorage')
  const [fellBack, setFellBack] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  const saveTimer = useRef<number | null>(null)
  const skipNextSave = useRef(true)

  useEffect(() => {
    let cancelled = false
    loadAppData().then((result) => {
      if (cancelled) return
      setData(result.data)
      setBackend(result.backend)
      setFellBack(result.fellBackToLocalStorage)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // auto-save (debounced) sempre que `data` mudar, exceto na carga inicial.
  useEffect(() => {
    if (loading || !data) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = window.setTimeout(async () => {
      const result = await saveAppData(data)
      setBackend(result.backend)
      setSaving(false)
      setLastSavedAt(Date.now())
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const touch = (a: ActionItem): ActionItem => ({ ...a, ultimaAtualizacao: new Date().toISOString() })

  const addAction = useCallback((input: ActionInput): ActionItem => {
    const now = new Date().toISOString()
    let created!: ActionItem
    setData((prev) => {
      if (!prev) return prev
      const id = formatActionId(prev.nextActionSeq)
      created = { ...input, id, dataCriacao: now, ultimaAtualizacao: now, arquivada: false }
      const newResult: ResultItem = {
        actionId: id,
        publicoAlvo: created.publicoAlvo,
        planoAcao: created.planoAcao,
        resultadoEsperado: '',
        resultadoObtido: '',
        statusResultado: '',
      }
      return {
        ...prev,
        actions: [...prev.actions, created],
        results: [...prev.results, newResult],
        nextActionSeq: prev.nextActionSeq + 1,
      }
    })
    return created
  }, [])

  const updateAction = useCallback((id: string, patch: Partial<ActionInput>) => {
    setData((prev) => {
      if (!prev) return prev
      const actions = prev.actions.map((a) => (a.id === id ? touch({ ...a, ...patch }) : a))
      const updated = actions.find((a) => a.id === id)
      // mantém Resultados.publicoAlvo / planoAcao sincronizados (somente-leitura,
      // derivados da Ação) sem perder o que já foi preenchido em C/D/E.
      const results = prev.results.map((r) =>
        r.actionId === id && updated ? { ...r, publicoAlvo: updated.publicoAlvo, planoAcao: updated.planoAcao } : r
      )
      return { ...prev, actions, results }
    })
  }, [])

  const setActionStatus = useCallback(
    (id: string, status: StatusAtual) => {
      updateAction(id, { statusAtual: status } as Partial<ActionInput>)
    },
    [updateAction]
  )

  const duplicateAction = useCallback((id: string): ActionItem | null => {
    let created: ActionItem | null = null
    setData((prev) => {
      if (!prev) return prev
      const original = prev.actions.find((a) => a.id === id)
      if (!original) return prev
      const now = new Date().toISOString()
      const newId = formatActionId(prev.nextActionSeq)
      created = {
        ...original,
        id: newId,
        planoAcao: `${original.planoAcao} (cópia)`,
        dataCriacao: now,
        ultimaAtualizacao: now,
        arquivada: false,
      }
      const newResult: ResultItem = {
        actionId: newId,
        publicoAlvo: created.publicoAlvo,
        planoAcao: created.planoAcao,
        resultadoEsperado: '',
        resultadoObtido: '',
        statusResultado: '',
      }
      return {
        ...prev,
        actions: [...prev.actions, created],
        results: [...prev.results, newResult],
        nextActionSeq: prev.nextActionSeq + 1,
      }
    })
    return created
  }, [])

  const setActionArchived = useCallback((id: string, archived: boolean) => {
    setData((prev) => {
      if (!prev) return prev
      return { ...prev, actions: prev.actions.map((a) => (a.id === id ? touch({ ...a, arquivada: archived }) : a)) }
    })
  }, [])

  const deleteAction = useCallback((id: string) => {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        actions: prev.actions.filter((a) => a.id !== id),
        results: prev.results.filter((r) => r.actionId !== id),
      }
    })
  }, [])

  const updateResult = useCallback(
    (actionId: string, patch: Partial<Pick<ResultItem, 'resultadoEsperado' | 'resultadoObtido' | 'statusResultado'>>) => {
      setData((prev) => {
        if (!prev) return prev
        return { ...prev, results: prev.results.map((r) => (r.actionId === actionId ? { ...r, ...patch } : r)) }
      })
    },
    []
  )

  const setHC = useCallback((rows: HCRow[]) => {
    setData((prev) => (prev ? { ...prev, hc: rows } : prev))
  }, [])

  const updateBaseConfig = useCallback((patch: Partial<BaseConfig>) => {
    setData((prev) => (prev ? { ...prev, base: { ...prev.base, ...patch } } : prev))
  }, [])

  const importActions = useCallback((actions: ActionItem[], hc?: HCRow[] | null) => {
    setData((prev) => {
      if (!prev) return prev
      const results = syncResultsWithActions(actions, prev.results)
      const maxSeq = actions.reduce((max, a) => {
        const m = /^ACT-(\d+)$/.exec(a.id)
        return m ? Math.max(max, Number(m[1])) : max
      }, 0)
      return {
        ...prev,
        actions,
        results,
        hc: hc && hc.length > 0 ? hc : prev.hc,
        nextActionSeq: Math.max(prev.nextActionSeq, maxSeq + 1),
      }
    })
  }, [])

  const restoreFromBackup = useCallback((backup: AppData) => {
    setData(backup)
  }, [])

  const value: AppDataContextValue = {
    data,
    loading,
    backend,
    fellBackToLocalStorage: fellBack,
    saving,
    lastSavedAt,
    addAction,
    updateAction,
    setActionStatus,
    duplicateAction,
    setActionArchived,
    deleteAction,
    updateResult,
    setHC,
    updateBaseConfig,
    importActions,
    restoreFromBackup,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData deve ser usado dentro de <AppDataProvider>')
  return ctx
}
