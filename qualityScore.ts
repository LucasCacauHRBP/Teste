import type { ActionItem, ResultItem, QualityComponentResult, QualityScore, QualityComponentKey } from '../types'
import { isEmptyForCalc, tidy } from './normalize'

/**
 * Score de Qualidade (0-100) — motor baseado em regras, 100% transparente:
 * cada plano é avaliado em 8 componentes de peso igual (12,5 pontos cada).
 * Nenhuma IA/API externa é usada; os critérios abaixo são os únicos fatores
 * considerados, e cada um deles é exposto na interface com seu resultado.
 *
 * Os limiares de "clareza" (tamanho mínimo de texto) são heurísticas simples
 * e propositalmente conservadoras — o objetivo é sinalizar campos vazios ou
 * claramente genéricos, não fazer uma avaliação semântica do conteúdo.
 */

const WEIGHT = 100 / 8
const MIN_CLARITY_LENGTH = 40
const GENERIC_TERMS = ['a definir', 'tbd', 'ajustar', 'revisar depois', 'sem informação']

function isGeneric(text: string): boolean {
  const t = text.toLowerCase()
  return GENERIC_TERMS.some((g) => t.includes(g))
}

function evalClarity(key: QualityComponentKey, label: string, text: string): QualityComponentResult {
  const clean = tidy(text)
  const passed = clean.length >= MIN_CLARITY_LENGTH && !isGeneric(clean)
  let detail: string
  if (!clean) detail = 'Campo vazio.'
  else if (isGeneric(clean)) detail = 'Texto genérico ou marcado como pendente.'
  else if (clean.length < MIN_CLARITY_LENGTH) detail = `Descrição curta (${clean.length} caracteres) — detalhe melhor.`
  else detail = 'Descrição com detalhe suficiente.'
  return { key, label, passed, weight: WEIGHT, detail }
}

function evalPresence(key: QualityComponentKey, label: string, text: string, minLength = 2): QualityComponentResult {
  const clean = tidy(text)
  const passed = clean.length >= minLength && !isEmptyForCalc(clean) && !isGeneric(clean)
  const detail = passed ? 'Definido.' : 'Não definido.'
  return { key, label, passed, weight: WEIGHT, detail }
}

export function computeQualityScore(action: ActionItem, result: ResultItem | undefined): QualityScore {
  const components: QualityComponentResult[] = [
    evalClarity('clarezaGap', 'Clareza do Gap', action.demandaGap),
    evalClarity('clarezaAcao', 'Clareza da Ação', action.acao),
    evalPresence('produto', 'Produto / Entregável', action.produto, 4),
    evalPresence('responsavel', 'Responsável definido', action.responsavel, 2),
    evalPresence('prazo', 'Prazo definido', action.prazo, 4),
    evalPresence('periodicidade', 'Periodicidade definida', action.periodicidade, 2),
    evalPresence('resultadoEsperado', 'Resultado Esperado', result?.resultadoEsperado ?? '', 4),
    evalPresence('evidenciaObtida', 'Evidência / Resultado Obtido', result?.resultadoObtido ?? '', 4),
  ]

  const score = Math.round(components.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0))

  return { actionId: action.id, score, components }
}

export function scoreBand(score: number): { label: string; colorClass: string } {
  if (score >= 80) return { label: 'Ótimo', colorClass: 'text-good' }
  if (score >= 60) return { label: 'Bom', colorClass: 'text-caramel' }
  if (score >= 40) return { label: 'Atenção', colorClass: 'text-caramel' }
  return { label: 'Crítico', colorClass: 'text-alert' }
}
