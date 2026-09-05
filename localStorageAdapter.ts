import type { AppData } from '../../types'
import type { StorageAdapter } from './types'

const KEY = 'planoAcaoHiper:v1'

export class LocalStorageAdapter implements StorageAdapter {
  readonly name = 'localStorage' as const

  async load(): Promise<AppData | null> {
    try {
      const raw = window.localStorage.getItem(KEY)
      if (!raw) return null
      return JSON.parse(raw) as AppData
    } catch (err) {
      console.warn('[localStorageAdapter] falha ao carregar dados, ignorando:', err)
      return null
    }
  }

  async save(data: AppData): Promise<void> {
    window.localStorage.setItem(KEY, JSON.stringify(data))
  }
}
