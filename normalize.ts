// -----------------------------------------------------------------------------
// Camada de normalização — usada SOMENTE para cálculos, agrupamentos e
// comparações. O texto original digitado pelo usuário nunca é alterado nos
// dados armazenados nem no que é exibido nas tabelas.
// -----------------------------------------------------------------------------

const NA_VARIANTS = new Set(['na', 'n/a', 'n.a', 'n.a.', 'nao aplicavel', 'não aplicável', '-', '—', ''])

/** Remove acentos para comparações "fuzzy" (não usado para exibição). */
export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Trim + colapsa espaços internos duplicados + minúsculas + sem acento.
 * Uso: chave de agrupamento/comparação. Nunca exibir isso ao usuário. */
export function normalizeKey(value: string | null | undefined): string {
  if (!value) return ''
  return stripAccents(value.trim().replace(/\s+/g, ' ').toLowerCase())
}

/** Versão "bonita" (mantém capitalização original, só limpa espaços) — útil
 * para exibir uma versão canônica sem mexer no dado bruto armazenado. */
export function tidy(value: string | null | undefined): string {
  if (!value) return ''
  return value.trim().replace(/\s+/g, ' ')
}

/** true se o valor representa "vazio" para fins de cálculo, cobrindo as
 * variações de N/A observadas na base (NA, N/A, N.A., traço, etc.). */
export function isEmptyForCalc(value: string | null | undefined): boolean {
  const key = normalizeKey(value)
  return NA_VARIANTS.has(key)
}

/** Igualdade "tolerante" entre dois textos (para deduplicação / detecção de
 * semelhança de nomes de público-alvo, pilar, etc.). */
export function looseEquals(a: string, b: string): boolean {
  return normalizeKey(a) === normalizeKey(b)
}

/**
 * Similaridade textual simples (coeficiente de Jaccard sobre palavras de 3+
 * letras). Retorna um valor de 0 a 1. Usado apenas para sinalizar possíveis
 * planos duplicados/semelhantes no motor de insights — é uma heurística, não
 * uma análise semântica.
 */
export function textSimilarity(a: string, b: string): number {
  const wordsOf = (s: string) =>
    new Set(
      normalizeKey(s)
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 3)
    )
  const setA = wordsOf(a)
  const setB = wordsOf(b)
  if (setA.size === 0 || setB.size === 0) return 0
  let intersection = 0
  for (const w of setA) if (setB.has(w)) intersection++
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/** Divide um Público-alvo "composto" em tokens individuais, sem nunca
 * sobrescrever o valor original. Ex.: "Operação de Loja e Liderança" ->
 * ["Operação de Loja", "Liderança"]. Usado apenas para contagens em gráficos. */
export function splitPublicoAlvo(raw: string): string[] {
  const value = tidy(raw)
  if (!value) return []

  // separadores explícitos primeiro (vírgula, barra, ponto-e-vírgula)
  if (/[,;/]/.test(value)) {
    return value
      .split(/[,;/]/)
      .map(tidy)
      .filter(Boolean)
  }

  // " e " como conectivo entre dois públicos distintos — mas só quando ambos
  // os lados "parecem" um público-alvo razoável (evita quebrar frases como
  // "Comunicação e Estratégia" em contextos de pilar, não usado aqui, mas
  // mantemos a checagem defensiva).
  const eSplit = value.split(/\s+e\s+/i)
  if (eSplit.length === 2 && eSplit.every((part) => part.trim().length >= 3)) {
    return eSplit.map(tidy)
  }

  return [value]
}
