/**
 * Gera o próximo ID de ação a partir de um contador monotônico armazenado em
 * AppData.nextActionSeq. Nunca depende do nome do plano de ação e nunca
 * reaproveita um número já usado, mesmo que ações antigas sejam excluídas —
 * isso evita colisão de IDs entre um plano antigo removido e um novo criado
 * depois com o mesmo número de sequência.
 */
export function formatActionId(seq: number): string {
  return `ACT-${String(seq).padStart(4, '0')}`
}

/** ID simples para outras entidades que precisem de um identificador único
 * no cliente (ex.: chaves de insight). Não é usado para Ações. */
export function randomId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}
