import * as XLSX from 'xlsx'
import type { ActionItem, AppData, HCRow, ResultItem } from '../types'
import { formatActionId } from './id'
import { tidy } from './normalize'

const ACTION_HEADERS = [
  'ID da Ação',
  'Loja',
  'Público-alvo',
  'Demanda / Gap',
  'Pilar',
  'Ação Pilar',
  'Plano de Ação',
  'Ação',
  'Produto',
  'Status Atual',
  'Periodicidade',
  'Responsável',
  'Prazo',
  'Prioridade',
  'Data de Criação',
  'Última Atualização',
]

const RESULT_HEADERS = ['ID da Ação', 'Público-alvo', 'Plano de Ação', 'Resultado Esperado', 'Resultado Obtido', 'Status do Resultado']

const HC_HEADERS = ['Posição', 'HC Atual', 'HC Orçado', 'Diferença', 'Status']

function hcStatus(atual: number, orcado: number): string {
  const diff = atual - orcado
  if (diff === 0) return 'Dentro do Orçado'
  return diff < 0 ? 'Abaixo do Orçado' : 'Acima do Orçado'
}

// ---------------------------------------------------------------------------
// Exportação
// ---------------------------------------------------------------------------

export function buildWorkbook(data: AppData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()

  const actionRows = data.actions.map((a) => [
    a.id,
    a.loja,
    a.publicoAlvo,
    a.demandaGap,
    a.pilar,
    a.acaoPilar,
    a.planoAcao,
    a.acao,
    a.produto,
    a.statusAtual,
    a.periodicidade,
    a.responsavel,
    a.prazo,
    a.prioridade,
    a.dataCriacao,
    a.ultimaAtualizacao,
  ])
  const wsActions = XLSX.utils.aoa_to_sheet([ACTION_HEADERS, ...actionRows])
  XLSX.utils.book_append_sheet(wb, wsActions, 'Gerenciador de Ações')

  const resultRows = data.results.map((r) => [r.actionId, r.publicoAlvo, r.planoAcao, r.resultadoEsperado, r.resultadoObtido, r.statusResultado])
  const wsResults = XLSX.utils.aoa_to_sheet([RESULT_HEADERS, ...resultRows])
  XLSX.utils.book_append_sheet(wb, wsResults, 'Resultados')

  const hcRows = data.hc.map((h) => [h.posicao, h.hcAtual, h.hcOrcado, h.hcAtual - h.hcOrcado, hcStatus(h.hcAtual, h.hcOrcado)])
  const wsHc = XLSX.utils.aoa_to_sheet([HC_HEADERS, ...hcRows])
  XLSX.utils.book_append_sheet(wb, wsHc, 'Quadro HC')

  return wb
}

export function exportToExcel(data: AppData, filename = 'plano-acao-hiper.xlsx'): void {
  const wb = buildWorkbook(data)
  XLSX.writeFile(wb, filename)
}

export function exportBackupJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

// ---------------------------------------------------------------------------
// Importação
// ---------------------------------------------------------------------------

/** Normaliza um cabeçalho de coluna para comparação tolerante (minúsculas,
 * sem acento, sem espaços extras) — não usado para exibição. */
function headerKey(h: string): string {
  return h
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function findCol(headerRow: string[], ...candidates: string[]): number {
  const keys = headerRow.map(headerKey)
  for (const c of candidates) {
    const idx = keys.indexOf(headerKey(c))
    if (idx >= 0) return idx
  }
  return -1
}

export interface ImportResult {
  actions: ActionItem[]
  warnings: string[]
}

/**
 * Importa um arquivo .xlsx (o modelo original "Plano de Ação Hiper" ou um
 * arquivo re-exportado por esta própria aplicação) e devolve a lista de Ações
 * reconstruída. IDs presentes e não vazios são preservados; linhas sem ID
 * (ex.: a planilha original do Excel) recebem um novo ID sequencial a partir
 * de `startSeq`, nunca derivado do nome do plano.
 */
export function parseActionsWorkbook(buffer: ArrayBuffer, startSeq: number): ImportResult {
  const wb = XLSX.read(buffer, { type: 'array' })
  const warnings: string[] = []

  const sheetName = wb.SheetNames.find((n) => headerKey(n).includes('gerenciador')) ?? wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' })

  // Encontra a linha de cabeçalho procurando por "Público-alvo" em alguma das
  // primeiras linhas (a planilha original tem um título na linha 1).
  let headerRowIdx = -1
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const asStrings = (rows[i] ?? []).map((c) => String(c ?? ''))
    if (findCol(asStrings, 'Público-alvo') >= 0) {
      headerRowIdx = i
      break
    }
  }
  if (headerRowIdx === -1) {
    return { actions: [], warnings: ['Não foi possível localizar a linha de cabeçalho (coluna "Público-alvo") na planilha.'] }
  }

  const header = (rows[headerRowIdx] ?? []).map((c) => String(c ?? ''))
  const col = {
    id: findCol(header, 'ID da Ação', 'ID'),
    loja: findCol(header, 'Loja'),
    publico: findCol(header, 'Público-alvo'),
    gap: findCol(header, 'Demanda / Gap', 'Demanda/Gap', 'Demanda'),
    pilar: findCol(header, 'Pilar'),
    acaoPilar: findCol(header, 'Ação Pilar'),
    plano: findCol(header, 'Plano de Ação'),
    acao: findCol(header, 'Ação'),
    produto: findCol(header, 'Produto'),
    status: findCol(header, 'Status Atual'),
    periodicidade: findCol(header, 'Periodicidade'),
    responsavel: findCol(header, 'Responsável'),
    prazo: findCol(header, 'Prazo'),
    prioridade: findCol(header, 'Prioridade'),
    criacao: findCol(header, 'Data de Criação'),
    atualizacao: findCol(header, 'Última Atualização'),
  }

  if (col.publico === -1 || col.plano === -1) {
    warnings.push('Colunas obrigatórias (Público-alvo / Plano de Ação) não encontradas — verifique o arquivo.')
  }

  const cell = (row: unknown[], idx: number): string => (idx >= 0 ? tidy(String(row[idx] ?? '')) : '')

  const nowIso = new Date().toISOString()
  const actions: ActionItem[] = []
  let seq = startSeq
  const usedIds = new Set<string>()

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] ?? []
    const publico = cell(row, col.publico)
    const plano = cell(row, col.plano)
    if (!publico && !plano) continue // linha em branco / separador

    let id = cell(row, col.id)
    if (!id || usedIds.has(id)) {
      id = formatActionId(seq)
      seq += 1
    }
    usedIds.add(id)

    const statusRaw = cell(row, col.status)
    const status = (['Iniciado', 'Mapeando', 'Não realizado'] as const).includes(statusRaw as 'Iniciado' | 'Mapeando' | 'Não realizado')
      ? (statusRaw as ActionItem['statusAtual'])
      : 'Mapeando'
    if (statusRaw && status !== statusRaw) {
      warnings.push(`Linha ${i + 1}: Status Atual "${statusRaw}" não reconhecido, importado como "Mapeando".`)
    }

    const prioridadeRaw = cell(row, col.prioridade)
    const prioridade = (['Alta', 'Média', 'Baixa'] as const).includes(prioridadeRaw as 'Alta' | 'Média' | 'Baixa')
      ? (prioridadeRaw as ActionItem['prioridade'])
      : 'Média'

    actions.push({
      id,
      loja: cell(row, col.loja),
      publicoAlvo: publico,
      demandaGap: cell(row, col.gap),
      pilar: cell(row, col.pilar),
      acaoPilar: cell(row, col.acaoPilar),
      planoAcao: plano,
      acao: cell(row, col.acao),
      produto: cell(row, col.produto),
      statusAtual: status,
      periodicidade: cell(row, col.periodicidade),
      responsavel: cell(row, col.responsavel),
      prazo: cell(row, col.prazo),
      prioridade,
      dataCriacao: cell(row, col.criacao) || nowIso,
      ultimaAtualizacao: cell(row, col.atualizacao) || nowIso,
      arquivada: false,
    })
  }

  return { actions, warnings }
}

/** Gera os Resultados correspondentes a uma lista de Ações recém-importada,
 * preservando resultados já existentes (por ID) quando fornecidos. */
export function syncResultsWithActions(actions: ActionItem[], existingResults: ResultItem[]): ResultItem[] {
  const existingByAction = new Map(existingResults.map((r) => [r.actionId, r]))
  return actions.map((a) => {
    const existing = existingByAction.get(a.id)
    return {
      actionId: a.id,
      publicoAlvo: a.publicoAlvo,
      planoAcao: a.planoAcao,
      resultadoEsperado: existing?.resultadoEsperado ?? '',
      resultadoObtido: existing?.resultadoObtido ?? '',
      statusResultado: existing?.statusResultado ?? '',
    }
  })
}

export function parseHcFromWorkbook(buffer: ArrayBuffer): HCRow[] | null {
  try {
    const wb = XLSX.read(buffer, { type: 'array' })
    const sheetName = wb.SheetNames.find((n) => headerKey(n).includes('quadro hc'))
    if (!sheetName) return null
    const ws = wb.Sheets[sheetName]
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' })

    // Reaproveita a lógica de detecção de seções da planilha original:
    // procura os títulos "Quadro Ativo Atual" e "HC Orçado" e lê os pares
    // Posição/Quantidade logo abaixo de cada um, até a linha "Total".
    const atual = new Map<string, number>()
    const orcado = new Map<string, number>()
    let mode: 'none' | 'atual' | 'orcado' = 'none'
    for (const row of rows) {
      const first = tidy(String(row[0] ?? ''))
      const key = headerKey(first)
      if (key.includes('quadro ativo atual')) {
        mode = 'atual'
        continue
      }
      if (key.includes('hc orcado')) {
        mode = 'orcado'
        continue
      }
      if (key === 'posicao' || key === 'total' || !first) continue
      const qty = Number(row[1])
      if (Number.isNaN(qty)) continue
      if (mode === 'atual') atual.set(first, qty)
      if (mode === 'orcado') orcado.set(first, qty)
    }

    const positions = new Set([...atual.keys(), ...orcado.keys()])
    if (positions.size === 0) return null
    return Array.from(positions).map((posicao) => ({
      posicao,
      hcAtual: atual.get(posicao) ?? 0,
      hcOrcado: orcado.get(posicao) ?? 0,
    }))
  } catch (err) {
    console.warn('[excelImportExport] falha ao ler Quadro HC do arquivo importado:', err)
    return null
  }
}
