import type { AppData } from '../../types'
import type { StorageAdapter } from './types'
import { getSupabaseClient } from '../supabaseClient'

/**
 * Persistência simples "documento único" no Supabase: uma tabela com uma
 * linha por instalação (id fixo = 'default'), guardando todo o AppData como
 * JSONB. Isso evita depender de um esquema relacional específico e mantém a
 * aplicação simples de configurar — veja o README para o SQL de criação da
 * tabela e das políticas de Row Level Security.
 */
const TABLE = 'plano_acao_hiper_state'
const ROW_ID = 'default'

export class SupabaseAdapter implements StorageAdapter {
  readonly name = 'supabase' as const

  async load(): Promise<AppData | null> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from(TABLE).select('data').eq('id', ROW_ID).maybeSingle()

    if (error) throw error
    if (!data) return null
    return data.data as AppData
  }

  async save(data: AppData): Promise<void> {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from(TABLE).upsert({
      id: ROW_ID,
      data,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
  }
}
