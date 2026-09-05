import { normalizeKey, splitPublicoAlvo, tidy } from './normalize'
import type { BaseConfig } from '../types'

/**
 * Classificação dinâmica de "Macro Público", para fins executivos (gráficos e
 * indicadores agregados). Isso NUNCA substitui o Público-alvo original — ele
 * continua sendo salvo e exibido exatamente como digitado em `ActionItem`.
 *
 * A classificação é feita por palavras-chave (não por uma lista fixa de
 * valores possíveis), então novos públicos ainda não vistos continuam sendo
 * classificados de forma razoável em vez de ficarem sempre em "Outros".
 * Overrides manuais (BaseConfig.macroPublicoOverrides) sempre têm prioridade.
 */
export const MACRO_PUBLICO_CATEGORIES = ['Gerência Regional', 'Gerência / Gestão', 'Liderança', 'Operação', 'Outros'] as const

export type MacroPublico = (typeof MACRO_PUBLICO_CATEGORIES)[number]

function classifyToken(token: string): MacroPublico {
  const key = normalizeKey(token)

  if (key.includes('regional')) return 'Gerência Regional'

  if (key.includes('lider') || key.includes('lideranca')) return 'Liderança'

  if (key.includes('operacao') || key === 'cafeteria' || key.includes('vendimento') || key.includes('loja')) {
    // "loja" sozinho tende a aparecer em "Operação de Loja"/"Líder de Loja";
    // já tratamos "lider" acima, então o que sobrar com "loja"/"operacao"
    // aqui é operação de fato.
    return 'Operação'
  }

  if (key.includes('gerenc') || key.includes('gerente')) return 'Gerência / Gestão'

  return 'Outros'
}

/**
 * Classifica um Público-alvo (possivelmente composto) em uma ou mais
 * Macro Público. Retorna sempre pelo menos 1 item.
 */
export function classifyPublicoAlvo(rawPublicoAlvo: string, overrides: BaseConfig['macroPublicoOverrides']): MacroPublico[] {
  const tokens = splitPublicoAlvo(rawPublicoAlvo)
  if (tokens.length === 0) return ['Outros']

  return tokens.map((token) => {
    const overrideKey = normalizeKey(token)
    const overridden = overrides[overrideKey]
    if (overridden && (MACRO_PUBLICO_CATEGORIES as readonly string[]).includes(overridden)) {
      return overridden as MacroPublico
    }
    return classifyToken(token)
  })
}

/** Lista os tokens individuais + a macro categoria resultante — usado na tela
 * de Configurações para mostrar de forma transparente como cada público está
 * sendo classificado, e permitir ajuste manual. */
export function explainClassification(rawPublicoAlvo: string, overrides: BaseConfig['macroPublicoOverrides']) {
  const tokens = splitPublicoAlvo(rawPublicoAlvo)
  return tokens.map((token) => ({
    token: tidy(token),
    key: normalizeKey(token),
    macro: overrides[normalizeKey(token)] ?? classifyToken(token),
    isOverridden: Boolean(overrides[normalizeKey(token)]),
  }))
}
