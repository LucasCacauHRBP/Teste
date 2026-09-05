// ---------------------------------------------------------------------------
// Domínio: Plano de Ação Hiper
// ---------------------------------------------------------------------------

export type StatusAtual = 'Iniciado' | 'Mapeando' | 'Não realizado'

export const STATUS_ATUAL_OPTIONS: StatusAtual[] = ['Iniciado', 'Mapeando', 'Não realizado']

export type StatusResultado = 'Ótimo' | 'Bom' | 'Ruim' | ''

export const STATUS_RESULTADO_OPTIONS: Exclude<StatusResultado, ''>[] = ['Ótimo', 'Bom', 'Ruim']

export type Prioridade = 'Alta' | 'Média' | 'Baixa'

export const PRIORIDADE_OPTIONS: Prioridade[] = ['Alta', 'Média', 'Baixa']

/**
 * Uma Ação (linha do "Gerenciador de Ações").
 *
 * IMPORTANTE: `id` é a única chave de relacionamento confiável entre Ações e
 * Resultados. Nomes de planos podem se repetir ou ser semelhantes — nunca use
 * `planoAcao` ou `publicoAlvo` como chave.
 */
export interface ActionItem {
  id: string
  loja: string
  /** Texto original do público-alvo, como digitado (nunca sobrescrito). Pode
   * conter mais de um público (ex.: "Operação de Loja e Liderança"). */
  publicoAlvo: string
  demandaGap: string
  pilar: string
  acaoPilar: string
  planoAcao: string
  acao: string
  produto: string
  statusAtual: StatusAtual
  periodicidade: string
  responsavel: string
  /** Data no formato ISO (yyyy-mm-dd) ou vazio se não definido. */
  prazo: string
  prioridade: Prioridade
  /** ISO datetime — preenchido automaticamente na criação. */
  dataCriacao: string
  /** ISO datetime — atualizado automaticamente a cada edição. */
  ultimaAtualizacao: string
  /** Registros arquivados saem das visões padrão mas não são apagados. */
  arquivada: boolean
}

/** Campos que o usuário pode editar diretamente em um formulário. */
export type ActionInput = Omit<ActionItem, 'id' | 'dataCriacao' | 'ultimaAtualizacao' | 'arquivada'>

/**
 * Uma linha de Resultado. Existe exatamente uma por Ação (não-arquivada ou
 * arquivada, o histórico é preservado), sincronizada automaticamente pelo
 * `actionId`. `publicoAlvo` e `planoAcao` são "espelhos" somente-leitura da
 * Ação correspondente e são recalculados a cada alteração da Ação de origem;
 * eles nunca devem ser digitados diretamente pelo usuário.
 */
export interface ResultItem {
  actionId: string
  publicoAlvo: string
  planoAcao: string
  resultadoEsperado: string
  resultadoObtido: string
  statusResultado: StatusResultado
}

export interface HCRow {
  posicao: string
  hcAtual: number
  hcOrcado: number
}

export type HCStatus = 'Dentro do Orçado' | 'Abaixo do Orçado' | 'Acima do Orçado'

/** Listas de apoio editáveis na área "Base / Configurações". */
export interface BaseConfig {
  lojas: string[]
  pilares: string[]
  responsaveis: string[]
  /** Mapeamento manual opcional de um Público-alvo (bruto, normalizado) para
   * um Macro Público. Entradas não mapeadas caem no classificador automático
   * (ver src/lib/macroPublico.ts). Não é destrutivo: o público original é
   * sempre preservado em `ActionItem.publicoAlvo`. */
  macroPublicoOverrides: Record<string, string>
}

export type QualityComponentKey =
  | 'clarezaGap'
  | 'clarezaAcao'
  | 'produto'
  | 'responsavel'
  | 'prazo'
  | 'periodicidade'
  | 'resultadoEsperado'
  | 'evidenciaObtida'

export interface QualityComponentResult {
  key: QualityComponentKey
  label: string
  passed: boolean
  weight: number
  detail: string
}

export interface QualityScore {
  actionId: string
  score: number // 0-100
  components: QualityComponentResult[]
}

export type InsightCategory = 'Crítico' | 'Atenção' | 'Oportunidade' | 'Positivo'

export interface Insight {
  id: string
  category: InsightCategory
  message: string
  relatedActionIds: string[]
}

/** Estado completo persistido (localStorage ou Supabase). */
export interface AppData {
  actions: ActionItem[]
  results: ResultItem[]
  hc: HCRow[]
  base: BaseConfig
  /** Contador monotônico usado para gerar IDs — nunca reaproveita números,
   * mesmo após exclusões, para evitar colisão de IDs. */
  nextActionSeq: number
}

export interface DashboardFilters {
  loja: string | null
  publicoAlvo: string | null
  pilar: string | null
  status: StatusAtual | null
  responsavel: string | null
}

export const EMPTY_FILTERS: DashboardFilters = {
  loja: null,
  publicoAlvo: null,
  pilar: null,
  status: null,
  responsavel: null,
}
