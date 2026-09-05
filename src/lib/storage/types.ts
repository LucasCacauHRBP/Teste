import type { AppData } from '../../types'

export interface StorageAdapter {
  /** Nome amigável, usado em mensagens de status/diagnóstico. */
  readonly name: 'supabase' | 'localStorage'
  load(): Promise<AppData | null>
  save(data: AppData): Promise<void>
}
