import type { ActionItem, ResultItem, HCRow, BaseConfig, AppData } from '../types'

// ---------------------------------------------------------------------------
// Dados extraídos de "Plano de Ação Hiper.xlsx" (aba "Gerenciador de Ações",
// 14 ações cadastradas) no momento da criação desta aplicação.
//
// Campos que não existiam na planilha (Responsável, Prazo) ficam vazios de
// propósito — não foram inventados. `dataCriacao` / `ultimaAtualizacao` usam
// a data de importação como valor inicial; a partir daí o sistema passa a
// controlá-los automaticamente a cada edição.
// ---------------------------------------------------------------------------

const IMPORT_TIMESTAMP = '2026-09-05T00:00:00.000Z'

function seedAction(
  seq: number,
  fields: Omit<ActionItem, 'id' | 'dataCriacao' | 'ultimaAtualizacao' | 'arquivada' | 'responsavel' | 'prazo' | 'prioridade'>
): ActionItem {
  return {
    id: `ACT-${String(seq).padStart(4, '0')}`,
    ...fields,
    responsavel: '',
    prazo: '',
    prioridade: 'Média',
    dataCriacao: IMPORT_TIMESTAMP,
    ultimaAtualizacao: IMPORT_TIMESTAMP,
    arquivada: false,
  }
}

export const SEED_ACTIONS: ActionItem[] = [
  seedAction(1, {
    loja: 'Hiper',
    publicoAlvo: 'Gerência Regional',
    demandaGap:
      'Gap em gestão de pessoas, promessas não cumpridas e falta de clareza nos direcionamentos e nas ações corporativas.',
    pilar: 'Gestão',
    acaoPilar: 'Mentoria & Trilha de Liderança',
    planoAcao: 'Mentoria & Trilha de Liderança — Gerência Regional',
    acao: 'Implementar acompanhamento comportamental e performance de atuação.',
    produto: 'Weekly quinzenal e mentoria de campo',
    statusAtual: 'Iniciado',
    periodicidade: 'Quinzenal',
  }),
  seedAction(2, {
    loja: 'Hiper',
    publicoAlvo: 'Gerência Regional',
    demandaGap:
      'Gap em gestão de pessoas, promessas não cumpridas e falta de clareza nos direcionamentos e nas ações corporativas.',
    pilar: 'Gestão',
    acaoPilar: 'Mentoria & Trilha de Liderança',
    planoAcao: 'Mentoria & Trilha de Liderança — Gerência Regional',
    acao:
      'Implementar a Trilha Sou Líder e realizar mentoria conduzida pelo BP para suprir gaps comportamentais percebidos na rotina e evidenciados pelos Gerentes de Mega e Gerentes de Loja. Fortalecer o rito de alinhamento estratégico com as Gerências Mega de Ambuitá e Catarina.',
    produto: 'Trilha Sou Líder — treinamentos presenciais mensais.',
    statusAtual: 'Iniciado',
    periodicidade: 'Mensal',
  }),
  seedAction(3, {
    loja: 'Hiper',
    publicoAlvo: 'Gerência Vendimento',
    demandaGap: 'Gerente com experiência consolidada, necessário padronizar/criar processos da loja.',
    pilar: 'Operação',
    acaoPilar: 'Operação',
    planoAcao: 'Capacitação de Operação (POP)',
    acao:
      'Consolidar os materiais que já existem internos, com as necessidades da operação e criar novos processos que tracionem soluções para loja.',
    produto: 'POP Hiper',
    statusAtual: 'Iniciado',
    periodicidade: 'NA',
  }),
  seedAction(4, {
    loja: 'Hiper',
    publicoAlvo: 'Gerência Cafeteria',
    demandaGap: 'Gerente novo na Cacau na carreira, em processo de se consolidar na carreira e conquistar a operação.',
    pilar: 'Gestão',
    acaoPilar: 'Mentoria & Trilha de Liderança',
    planoAcao: 'Mentoria',
    acao:
      'Acelerar sua consolidação na cadeira, através das evidências dos resultados obtidos pela área, trazendo um comparativo antes e depois. Trazer mensalmente boas práticas/treinamentos de processos e produtos.',
    produto: 'Bom dia Cafeteria',
    statusAtual: 'Mapeando',
    periodicidade: 'Mensal',
  }),
  seedAction(5, {
    loja: 'Hiper',
    publicoAlvo: 'Gerência Mega',
    demandaGap: 'Gerentes novos na Cacau Show ainda estão em processo de aculturamento e desenvolvimento no contexto da operação.',
    pilar: 'Gestão',
    acaoPilar: 'Mentoria & Trilha de Liderança',
    planoAcao: 'Mentoria & Trilha de Liderança — Gerência Mega',
    acao: 'Acelerar o desenvolvimento dos Gerentes Mega e fortalecer o alinhamento estratégico com os Líderes de Loja.',
    produto: 'Weekly Quinzenal',
    statusAtual: 'Iniciado',
    periodicidade: 'Quinzenal',
  }),
  seedAction(6, {
    loja: 'Hiper',
    publicoAlvo: 'Líderes de Loja',
    demandaGap:
      'Liderança de loja polarizada, com percepção de falta de comunicação por parte dos gerentes e baixa troca de informações e apoio entre as áreas.',
    pilar: 'Gestão',
    acaoPilar: 'Desenvolvimento da Liderança',
    planoAcao: 'Desenvolvimento da Liderança — Líderes de Loja',
    acao: 'Acelerar o desenvolvimento dos Líderes de Loja e fortalecer o alinhamento estratégico com a operação.',
    produto:
      'Trilha de capacitação Conexão Líder, contemplando Imersão em Cultura & Universo Cacau, Comunicação de Alta Performance, Protagonismo e Accountability.',
    statusAtual: 'Mapeando',
    periodicidade: 'Mensal',
  }),
  seedAction(7, {
    loja: 'Hiper',
    publicoAlvo: 'Operação de Loja',
    demandaGap: 'A operação atua de forma superficial, com estratégias predominantemente reativas e baixa estruturação de planejamento estratégico.',
    pilar: 'Gestão / Operação',
    acaoPilar: 'Rotina de Gestão e Comunicação',
    planoAcao: 'Rotina de Gestão e Comunicação — Operação de Loja',
    acao:
      'Padronizar ritos operacionais para cascateamento de informações, incluindo reuniões matinais e vespertinas, além da apresentação estruturada dos resultados.',
    produto:
      'Conexão Loja: reunião diária conduzida por um gerente da loja para apresentar dados, indicadores, resultados, prioridades e estratégia diária da loja.',
    statusAtual: 'Iniciado',
    periodicidade: 'Quinzenal',
  }),
  seedAction(8, {
    loja: 'Hiper',
    publicoAlvo: 'Operação de Loja',
    demandaGap: 'A operação atua de forma superficial, com estratégias predominantemente reativas e baixa estruturação de planejamento estratégico.',
    pilar: 'Gestão / Operação',
    acaoPilar: 'Rotina de Gestão e Comunicação',
    planoAcao: 'Rotina de Gestão e Comunicação — Operação de Loja',
    acao:
      'Fechamento trimestral de resultados e direcionamento estratégico, com participação de Tulio e/ou Evandro e/ou Marcello como convidado, conforme necessidade. Padronizar ritos operacionais para cascateamento de informações, incluindo reuniões matinais e vespertinas, além da apresentação estruturada dos resultados.',
    produto: 'Fechamento Trimestral',
    statusAtual: 'Mapeando',
    periodicidade: 'Trimestral',
  }),
  seedAction(9, {
    loja: 'Catarina',
    publicoAlvo: 'Operação de Loja e Liderança',
    demandaGap: 'Baixa adesão cultural e comportamental de recém contratados.',
    pilar: 'Cultura',
    acaoPilar: 'Integração',
    planoAcao: 'Padronização de processo da integração',
    acao: 'Dar forma ao processo de integração, trabalhando a previsibilidade de admissões, adesão e engajamento.',
    produto: 'Integração presencial',
    statusAtual: 'Iniciado',
    periodicidade: 'Semanal',
  }),
  seedAction(10, {
    loja: 'Geral',
    publicoAlvo: 'Gerentes',
    demandaGap: 'Acelerar aculturamento.',
    pilar: 'Cultura & Performance',
    acaoPilar: 'Acompanhamento',
    planoAcao: 'Rito de acompanhamento, sendo mentor da cultura e processos GGP.',
    acao:
      'Acompanhamento quinzenal, no modelo Weekly, com foco em integração entre sua equipe, gestor, performance e cultura. Sendo ponto focal de GGP.',
    produto: 'Weekly',
    statusAtual: 'Mapeando',
    periodicidade: 'Trimestral',
  }),
  seedAction(11, {
    loja: 'Hiper',
    publicoAlvo: 'Cafeteria',
    demandaGap: 'Distanciamento processual entre ADM (Compras) e loja.',
    pilar: 'Processos',
    acaoPilar: 'Ronda',
    planoAcao: 'Rito de acompanhamento com o Gerente de Cafeteria, com o foco de diminuir custos de compra e reparo desnecessários.',
    acao:
      'Acompanhamento presencial quinzenal de Compras na Cafeteria e Estoque da Cafeteria, buscando melhorar o processo de solicitação de compras, transferências, manutenção, trocas e substituições.',
    produto: 'Ronda Cafeteria',
    statusAtual: 'Iniciado',
    periodicidade: 'Quinzenal',
  }),
  seedAction(12, {
    loja: 'Geral',
    publicoAlvo: 'Operação de Loja',
    demandaGap: 'Falta de padrão operacional',
    pilar: 'Processos',
    acaoPilar: 'Padronização da operação',
    planoAcao: 'Capacitação de Operação',
    acao:
      'Treinamento de Comercialização e POP Operacional (Trilha de cursos Universidade Cacau Cliente/Investigador/Valor, caixa, abastecimento e layout).',
    produto: 'Capacitação',
    statusAtual: 'Mapeando',
    periodicidade: 'Mensal',
  }),
  seedAction(13, {
    loja: 'Catarina',
    publicoAlvo: 'Gerente',
    demandaGap: 'Ausência de conhecimento da rotina processual da loja.',
    pilar: 'Processos',
    acaoPilar: 'Rotina de Gestão e Conhecimento Operacional',
    planoAcao: 'Capacitação de Operação',
    acao: 'Integração institucional + mentoria Hiper.',
    produto: 'Integração presencial & mentoria',
    statusAtual: 'Mapeando',
    periodicidade: 'Mensal',
  }),
  seedAction(14, {
    loja: 'Catarina',
    publicoAlvo: 'Operação de Loja',
    demandaGap: 'Baixo engajamento no atendimento, degustação e vendas.',
    pilar: 'Atendimento',
    acaoPilar: 'Engajar vendas',
    planoAcao: 'Traçar ações que motivem ao atendimento e vendas',
    acao: 'Ações de parceria comercial local no Outlet.',
    produto: 'Gratificação/Bonificação/Premiação',
    statusAtual: 'Mapeando',
    periodicidade: 'N/A',
  }),
]

/**
 * Resultados iniciais: uma linha para CADA ação cadastrada (não apenas as que
 * já existiam na aba "Resultados" da planilha, que estava incompleta — ver
 * seção 16 do briefing). Campos de resultado começam vazios.
 */
export const SEED_RESULTS: ResultItem[] = SEED_ACTIONS.map((a) => ({
  actionId: a.id,
  publicoAlvo: a.publicoAlvo,
  planoAcao: a.planoAcao,
  resultadoEsperado: '',
  resultadoObtido: '',
  statusResultado: '',
}))

export const SEED_HC: HCRow[] = [
  { posicao: 'Operador de Loja', hcAtual: 81, hcOrcado: 103 },
  { posicao: 'Líder de Loja', hcAtual: 7, hcOrcado: 12 },
  { posicao: 'Fiscal de Prevenção e Perdas', hcAtual: 3, hcOrcado: 5 },
  { posicao: 'Gerente de Mega Store', hcAtual: 2, hcOrcado: 2 },
  { posicao: 'Operador Venda Direta', hcAtual: 2, hcOrcado: 4 },
  { posicao: 'Bombeiro Civil', hcAtual: 3, hcOrcado: 3 },
  { posicao: 'Gerente de Estoque', hcAtual: 0, hcOrcado: 1 },
]

export const SEED_BASE: BaseConfig = {
  lojas: ['Hiper', 'Catarina', 'Geral'],
  pilares: ['Gestão', 'Operação', 'Gestão / Operação', 'Cultura', 'Cultura & Performance', 'Processos', 'Atendimento'],
  responsaveis: [],
  macroPublicoOverrides: {},
}

export function buildSeedAppData(): AppData {
  return {
    actions: SEED_ACTIONS,
    results: SEED_RESULTS,
    hc: SEED_HC,
    base: SEED_BASE,
    nextActionSeq: SEED_ACTIONS.length + 1,
  }
}
