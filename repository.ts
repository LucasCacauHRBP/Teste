import type { AppData } from '../types'
import { isSupabaseConfigured } from './supabaseClient'
import { SupabaseAdapter } from './storage/supabaseAdapter'
import { LocalStorageAdapter } from './storage/localStorageAdapter'
import { buildSeedAppData } from '../data/seed'

const localAdapter = new LocalStorageAdapter()
const supabaseAdapter = isSupabaseConfigured ? new SupabaseAdapter() : null

export type BackendName = 'supabase' | 'localStorage'

export interface LoadResult {
  data: AppData
  backend: BackendName
  /** true quando o Supabase estava configurado mas falhou, e a aplicação caiu
   * para o localStorage automaticamente. Útil para avisar o usuário. */
  fellBackToLocalStorage: boolean
}

/**
 * Carrega os dados da aplicação. Ordem de tentativa:
 * 1. Supabase, se configurado (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY).
 * 2. localStorage (sempre disponível).
 * 3. Dados semente (seed.ts), na primeiríssima execução em um navegador novo.
 */
export async function loadAppData(): Promise<LoadResult> {
  if (supabaseAdapter) {
    try {
      const data = await supabaseAdapter.load()
      if (data) return { data, backend: 'supabase', fellBackToLocalStorage: false }
      // Supabase configurado mas tabela vazia: semeia com os dados iniciais.
      const seed = buildSeedAppData()
      await supabaseAdapter.save(seed)
      return { data: seed, backend: 'supabase', fellBackToLocalStorage: false }
    } catch (err) {
      console.warn('[repository] Supabase indisponível, usando localStorage como fallback:', err)
    }
  }

  const local = await localAdapter.load()
  if (local) return { data: local, backend: 'localStorage', fellBackToLocalStorage: Boolean(supabaseAdapter) }

  const seed = buildSeedAppData()
  await localAdapter.save(seed)
  return { data: seed, backend: 'localStorage', fellBackToLocalStorage: Boolean(supabaseAdapter) }
}

/**
 * Salva os dados. Sempre grava no localStorage (cópia de segurança local
 * imediata) e, se o Supabase estiver configurado, também tenta salvar lá —
 * silenciosamente cai para "somente local" se a chamada falhar.
 */
export async function saveAppData(data: AppData): Promise<{ backend: BackendName; error?: unknown }> {
  await localAdapter.save(data)

  if (supabaseAdapter) {
    try {
      await supabaseAdapter.save(data)
      return { backend: 'supabase' }
    } catch (err) {
      console.warn('[repository] Falha ao salvar no Supabase, dado mantido apenas localmente por enquanto:', err)
      return { backend: 'localStorage', error: err }
    }
  }

  return { backend: 'localStorage' }
}

export function currentBackendLabel(): BackendName {
  return supabaseAdapter ? 'supabase' : 'localStorage'
}
