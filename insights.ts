import type { ActionItem, ResultItem, Insight, InsightCategory } from '../types'
import { isEmptyForCalc, normalizeKey, textSimilarity, tidy } from './normalize'
import { classifyPublicoAlvo } from './macroPublico'
import { computeQualityScore } from './qualityScore'
import { randomId } from './id'

const STALE_DAYS = 30
const CONCENTRATION_THRESHOLD = 0.4 // 40%
const SIMILARITY_THRESHOLD = 0.6
const MIN_CLARITY_LENGTH = 40

const CATEGORY_ORDER: Record<InsightCategory, number> = {
  Crítico: 0,
  Atenção: 1,
  Oportunidade: 2,
  Positivo: 3,
}

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime()
  if (Number.isNaN(then)) return 0
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24))
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

function mk(category: InsightCategory, message: string, relatedActionIds: string[] = []): Insight {
  return { id: randomId('ins'), category, message, relatedActionIds }
}

/**
 * Gera a lista de insights a partir do estado atual (ações + resultados
 * ativos, isto é, não arquivados). Cada insight explica seu motivo e aponta
 * as ações relacionadas (por ID). Ordenados por severidade: Crítico >
 * Atenção > Oportunidade > Positivo.
 */
export function generateInsights(allActions: ActionItem[], allResults: ResultItem[]): Insight[] {
  const actions = allActions.filter((a) => !a.arquivada)
  const total = actions.length
  const insights: Insight[] = []
  const resultByAction = new Map(allResults.map((r) => [r.actionId, r]))

  if (total === 0) {
    return [mk('Oportunidade', 'Nenhuma ação cadastrada ainda. Cadastre o primeiro plano de ação no Gerenciador de Ações.')]
  }

  // 1) Iniciados sem Resultado Esperado -----------------------------------
  const iniciadosSemEsperado = actions.filter((a) => {
    if (a.statusAtual !== 'Iniciado') return false
    const r = resultByAction.get(a.id)
    return !r || isEmptyForCalc(r.resultadoEsperado)
  })
  if (iniciadosSemEsperado.length > 0) {
    insights.push(
      mk(
        'Crítico',
        `${iniciadosSemEsperado.length} plano(s) já Iniciado(s) ainda não possuem Resultado Esperado definido.`,
        iniciadosSemEsperado.map((a) => a.id)
      )
    )
  }

  // 2) Ações Não realizadas --------------------------------------------------
  const naoRealizadas = actions.filter((a) => a.statusAtual === 'Não realizado')
  if (naoRealizadas.length > 0) {
    insights.push(
      mk(
        'Crítico',
        `${naoRealizadas.length} ação(ões) marcada(s) como "Não realizado" precisam de replanejamento ou justificativa.`,
        naoRealizadas.map((a) => a.id)
      )
    )
  }

  // 3) Inconsistência: Não realizado mas com Resultado Obtido preenchido ----
  for (const a of actions) {
    if (a.statusAtual !== 'Não realizado') continue
    const r = resultByAction.get(a.id)
    if (r && !isEmptyForCalc(r.resultadoObtido)) {
      insights.push(
        mk(
          'Atenção',
          `O plano "${a.planoAcao || a.id}" está marcado como "Não realizado" mas já possui Resultado Obtido preenchido — revise o Status Atual.`,
          [a.id]
        )
      )
    }
  }

  // 4) Sem prazo definido ----------------------------------------------------
  const semPrazo = actions.filter((a) => isEmptyForCalc(a.prazo))
  if (semPrazo.length > 0) {
    insights.push(
      mk(
        'Atenção',
        `${pct(semPrazo.length, total)}% dos planos (${semPrazo.length} de ${total}) não possuem prazo definido.`,
        semPrazo.map((a) => a.id)
      )
    )
  }

  // 5) Sem responsável definido -----------------------------------------------
  const semResponsavel = actions.filter((a) => isEmptyForCalc(a.responsavel))
  if (semResponsavel.length > 0) {
    insights.push(
      mk(
        'Atenção',
        `${pct(semResponsavel.length, total)}% dos planos (${semResponsavel.length} de ${total}) não possuem responsável definido.`,
        semResponsavel.map((a) => a.id)
      )
    )
  } else {
    insights.push(mk('Positivo', 'Todos os planos ativos possuem responsável definido.'))
  }

  // 6) Sem produto / entregável mensurável (por plano) ------------------------
  for (const a of actions) {
    const produto = tidy(a.produto)
    if (isEmptyForCalc(produto) || produto.length < 4) {
      insights.push(
        mk(
          'Atenção',
          `O plano "${a.planoAcao || a.id}" possui ação definida, mas não possui um entregável/produto mensurável.`,
          [a.id]
        )
      )
    }
  }

  // 7) Campos excessivamente genéricos (Demanda/Gap muito curta) --------------
  for (const a of actions) {
    const gap = tidy(a.demandaGap)
    if (gap.length > 0 && gap.length < MIN_CLARITY_LENGTH) {
      insights.push(
        mk('Atenção', `O plano "${a.planoAcao || a.id}" possui uma Demanda/Gap muito genérica; detalhe melhor o problema.`, [a.id])
      )
    }
  }

  // 8) Mapeando há muito tempo sem atualização --------------------------------
  const mapeandoParado = actions.filter((a) => a.statusAtual === 'Mapeando' && daysSince(a.ultimaAtualizacao) >= STALE_DAYS)
  for (const a of mapeandoParado) {
    insights.push(
      mk('Atenção', `Plano "${a.planoAcao || a.id}" está em Mapeando sem atualização há ${daysSince(a.ultimaAtualizacao)} dias.`, [
        a.id,
      ])
    )
  }

  // 9) Ações duplicadas ou muito semelhantes ----------------------------------
  const seenPairs = new Set<string>()
  for (let i = 0; i < actions.length; i++) {
    for (let j = i + 1; j < actions.length; j++) {
      const a = actions[i]
      const b = actions[j]
      const sim = textSimilarity(`${a.planoAcao} ${a.acao}`, `${b.planoAcao} ${b.acao}`)
      if (sim >= SIMILARITY_THRESHOLD) {
        const pairKey = [a.id, b.id].sort().join('|')
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey)
          insights.push(
            mk(
              'Oportunidade',
              `Os planos "${a.planoAcao || a.id}" e "${b.planoAcao || b.id}" têm descrições muito semelhantes; avalie consolidá-los.`,
              [a.id, b.id]
            )
          )
        }
      }
    }
  }

  // 10) Concentração excessiva por Pilar ---------------------------------------
  const pilarCounts = new Map<string, { label: string; ids: string[] }>()
  for (const a of actions) {
    const key = normalizeKey(a.pilar) || '(sem pilar)'
    const entry = pilarCounts.get(key) ?? { label: tidy(a.pilar) || '(sem pilar)', ids: [] }
    entry.ids.push(a.id)
    pilarCounts.set(key, entry)
  }
  for (const { label, ids } of pilarCounts.values()) {
    const ratio = ids.length / total
    if (ratio >= CONCENTRATION_THRESHOLD && total >= 3) {
      insights.push(mk('Atenção', `Há concentração de ${pct(ids.length, total)}% das ações no Pilar "${label}".`, ids))
    }
  }

  // 11) Concentração excessiva por Macro Público -------------------------------
  const macroCounts = new Map<string, string[]>()
  for (const a of actions) {
    const macros = classifyPublicoAlvo(a.publicoAlvo, {})
    for (const m of macros) {
      const arr = macroCounts.get(m) ?? []
      arr.push(a.id)
      macroCounts.set(m, arr)
    }
  }
  const totalIncidencias = Array.from(macroCounts.values()).reduce((s, arr) => s + arr.length, 0)
  for (const [macro, ids] of macroCounts.entries()) {
    const ratio = ids.length / (totalIncidencias || 1)
    if (ratio >= CONCENTRATION_THRESHOLD && total >= 3) {
      insights.push(mk('Oportunidade', `Há concentração de ${pct(ids.length, totalIncidencias)}% das ações no Macro Público "${macro}".`, ids))
    }
  }

  // 12) Score de qualidade médio -----------------------------------------------
  const scores = actions.map((a) => computeQualityScore(a, resultByAction.get(a.id)).score)
  const avgScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
  if (avgScore >= 70) {
    insights.push(mk('Positivo', `A qualidade média dos planos está em ${avgScore}/100, acima da meta de referência (70).`))
  } else {
    insights.push(mk('Atenção', `A qualidade média dos planos está em ${avgScore}/100, abaixo da meta de referência (70).`))
  }

  // 13) Resultados já avaliados como Ótimo -------------------------------------
  const otimos = allResults.filter((r) => r.statusResultado === 'Ótimo')
  if (otimos.length > 0) {
    insights.push(
      mk(
        'Positivo',
        `${otimos.length} resultado(s) já avaliado(s) como Ótimo (${pct(otimos.length, allResults.length)}% dos resultados registrados).`,
        otimos.map((r) => r.actionId)
      )
    )
  }

  return insights.sort((a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category])
}
