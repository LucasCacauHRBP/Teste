import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** true quando as duas variáveis de ambiente necessárias estão configuradas.
 * A aplicação usa isso para decidir entre o modo Supabase e o modo
 * localStorage — ver src/lib/repository.ts. */
export const isSupabaseConfigured = Boolean(url && anonKey)

let client: SupabaseClient | null = null

/** Cria (uma única vez) e retorna o client do Supabase. Só deve ser chamado
 * quando `isSupabaseConfigured` for true. */
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    if (!url || !anonKey) {
      throw new Error('Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
    }
    client = createClient(url, anonKey)
  }
  return client
}
