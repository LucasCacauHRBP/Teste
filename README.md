# Plano de Ação Hiper

Sistema de gestão de planos de ação, resultados e indicadores da Unidade Hiper (Cacau Show) — construído a partir da planilha **"Plano de Ação Hiper.xlsx"**, mas evoluído para um pequeno sistema de gestão: cadastro de ações com ID próprio, resultados sincronizados automaticamente, dashboard executivo dinâmico, filtros, e um motor de Insights e Score de Qualidade que analisa a base por regras (sem depender de nenhuma IA externa).

> Construído com **React + TypeScript + Vite**, gráficos com **Recharts**, persistência em **Supabase** (opcional) com fallback automático para **localStorage**, e pronto para publicar no **GitHub Pages** via GitHub Actions.

---

## Índice

1. [Estrutura do projeto](#estrutura-do-projeto)
2. [Como executar localmente](#como-executar-localmente)
3. [Como publicar no GitHub Pages](#como-publicar-no-github-pages)
4. [Como configurar o Supabase (modo principal)](#como-configurar-o-supabase-modo-principal)
5. [Como funciona o fallback localStorage](#como-funciona-o-fallback-localstorage)
6. [Modelo de dados e regras de negócio](#modelo-de-dados-e-regras-de-negócio)
7. [Motor de Insights e Score de Qualidade](#motor-de-insights-e-score-de-qualidade)
8. [Como importar uma nova versão do Excel](#como-importar-uma-nova-versão-do-excel)
9. [Como fazer backup dos dados](#como-fazer-backup-dos-dados)
10. [Limitações conhecidas / próximos passos](#limitações-conhecidas--próximos-passos)

---

## Estrutura do projeto

```
plano-acao-hiper/
├── .github/workflows/deploy.yml   # build + deploy automático no GitHub Pages
├── .env.example                   # modelo das variáveis do Supabase
├── src/
│   ├── types.ts                   # todos os tipos de domínio (Ação, Resultado, HC…)
│   ├── data/seed.ts                # dados extraídos do Excel original (carga inicial)
│   ├── lib/
│   │   ├── normalize.ts            # normalização de texto (só para cálculo, nunca exibição)
│   │   ├── id.ts                   # geração de ID de ação (nunca baseado em nome)
│   │   ├── macroPublico.ts         # classificador dinâmico de Macro Público
│   │   ├── qualityScore.ts         # Score de Qualidade (0-100), transparente
│   │   ├── insights.ts             # motor de Insights baseado em regras
│   │   ├── excelImportExport.ts    # importar/exportar .xlsx
│   │   ├── csv.ts                  # exportar .csv
│   │   ├── repository.ts           # escolhe Supabase ou localStorage + fallback
│   │   └── storage/                # adaptadores de persistência
│   ├── context/
│   │   ├── AppDataContext.tsx      # estado global + CRUD + auto-save
│   │   └── ToastContext.tsx        # feedback visual ("Alteração salva com sucesso.")
│   └── components/
│       ├── layout/                 # cabeçalho + navegação
│       ├── ui/                     # botões, modais, selects, badges…
│       ├── common/FilterBar.tsx    # filtros reaproveitados por Ações e Dashboard
│       ├── actions/                # Gerenciador de Ações
│       ├── results/                # Resultados
│       ├── hc/                     # Quadro HC
│       ├── settings/               # Base / Configurações
│       └── dashboard/              # Dashboard Executivo (KPIs, gráficos, insights)
```

## Como executar localmente

Pré-requisitos: [Node.js](https://nodejs.org) 18 ou mais recente.

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`. A aplicação já sobe com os 14 planos de ação extraídos do Excel original (guardados em `src/data/seed.ts`) — na primeira execução em um navegador novo, esses dados são gravados no `localStorage`.

Outros comandos úteis:

```bash
npm run build     # gera a versão de produção em dist/
npm run preview   # serve a build de produção localmente, para conferir antes de publicar
npm run lint      # roda apenas a checagem de tipos do TypeScript
```

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub e envie este projeto para a branch `main`.
2. No repositório, vá em **Settings → Pages** e em "Build and deployment" selecione **Source: GitHub Actions**.
3. (Opcional) Configure o Supabase — veja a seção seguinte — em **Settings → Secrets and variables → Actions**, criando os secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Sem eles, a aplicação publicada funciona normalmente com `localStorage`.
4. Faça um `git push` para `main`. O workflow em `.github/workflows/deploy.yml` builda e publica automaticamente.
5. A URL final aparece em **Settings → Pages** (formato `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`).

Detalhe técnico importante: o projeto usa `base: './'` no `vite.config.ts` e `HashRouter` (URLs como `/#/acoes`) em vez de `BrowserRouter`. Isso é proposital — GitHub Pages não tem como redirecionar rotas do lado do servidor, então um `BrowserRouter` comum quebraria (erro 404) sempre que alguém desse F5 numa página como `/resultados`. Com `HashRouter` isso nunca acontece, e você não precisa configurar nenhum "base path" manualmente, não importa o nome do repositório.

## Como configurar o Supabase (modo principal)

O Supabase é **opcional**. Sem ele, tudo funciona via `localStorage` (por navegador/dispositivo). Com ele, as alterações ficam visíveis em qualquer dispositivo.

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. No **SQL Editor** do projeto, rode:

   ```sql
   create table if not exists plano_acao_hiper_state (
     id text primary key,
     data jsonb not null,
     updated_at timestamptz not null default now()
   );

   alter table plano_acao_hiper_state enable row level security;

   -- Política simples para uso interno (qualquer pessoa com a anon key lê/escreve
   -- a linha "default"). Ajuste conforme sua necessidade de segurança/autenticação.
   create policy "allow all on default row"
     on plano_acao_hiper_state
     for all
     using (id = 'default')
     with check (id = 'default');
   ```

3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
4. Copie `.env.example` para `.env.local` e preencha:

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key
   ```

5. Rode `npm run dev` novamente. O indicador no canto superior direito da aplicação deve mostrar **"Supabase"** em vez de "Local (offline)".
6. Para o site publicado no GitHub Pages usar o Supabase também, configure os dois valores como **Secrets** do repositório (passo 3 da seção anterior) — eles são injetados no build pelo workflow.

**Nunca** faça commit do arquivo `.env.local` (ele já está no `.gitignore`). A anon key do Supabase é pública por natureza (protegida por Row Level Security), mas ainda assim não deve ser versionada como boa prática.

## Como funciona o fallback localStorage

- Se as variáveis do Supabase não estiverem definidas, a aplicação nunca tenta chamar o Supabase — usa `localStorage` diretamente.
- Se estiverem definidas mas a chamada falhar (projeto pausado, sem internet, tabela não criada, etc.), a aplicação **cai automaticamente para `localStorage`** e avisa discretamente no cabeçalho ("Supabase indisponível — usando local"). Nada trava.
- Toda alteração é sempre salva no `localStorage` também (mesmo com Supabase ativo), como cópia de segurança local instantânea.

## Modelo de dados e regras de negócio

### Gerenciador de Ações

Cada linha é uma **Ação**, identificada por um `id` no formato `ACT-0001`, `ACT-0002`, ... — gerado por um contador que nunca reaproveita números, mesmo depois de exclusões. **O ID nunca é derivado do nome do plano**, exatamente para lidar com os vários planos de nomes iguais/parecidos que já existem na base real.

Campos mantidos da planilha original: Loja, Público-alvo, Demanda/Gap, Pilar, Ação Pilar, Plano de Ação, Ação, Produto, Status Atual, Periodicidade.

Campos novos, adicionados para tornar o sistema mais robusto: Responsável, Prazo, Prioridade, Data de Criação e Última Atualização (as duas últimas são 100% controladas pelo sistema — não são editáveis no formulário).

Operações disponíveis na tela: criar, editar, duplicar, arquivar (reversível) e excluir (com confirmação, permanente — também remove o Resultado associado). Status Atual pode ser alterado diretamente na tabela, sem abrir o formulário.

### Público-alvo e Macro Público

O Público-alvo é **sempre preservado exatamente como digitado** — nada é sobrescrito. Para fins de gráfico/indicador executivo, existe uma camada de classificação dinâmica (`src/lib/macroPublico.ts`) que agrupa em `Gerência Regional`, `Gerência / Gestão`, `Liderança`, `Operação` ou `Outros`, **por palavra-chave** (não por uma lista fixa de valores esperados) — então públicos novos que ainda não existiam na base são classificados de forma razoável em vez de caírem sempre em "Outros".

Públicos compostos (ex.: "Operação de Loja e Liderança") são automaticamente divididos em mais de um token para fins de contagem — nesse caso, a ação é contada em mais de uma categoria no gráfico, e isso fica explicado tanto no tooltip quanto em uma nota abaixo do gráfico.

Você pode ajustar manualmente a classificação de qualquer valor observado na aba **Base / Configurações → Macro Público**, sem nunca alterar o texto original do Público-alvo.

### Resultados

A página Resultados é **derivada** do Gerenciador de Ações: existe sempre uma linha de Resultado por Ação (ativa ou arquivada), criada/atualizada automaticamente. As colunas Público-alvo e Plano de Ação **não são editáveis** — são sempre um espelho de leitura da Ação correspondente, localizada pelo `actionId` (nunca pelo texto do nome). Se você renomear um Plano de Ação ou mudar seu Público-alvo, a linha de Resultado correspondente atualiza sozinha, sem perder o que já estava preenchido em Resultado Esperado / Obtido / Status.

### Quadro HC

Mantém a mesma lógica da planilha: HC Atual, HC Orçado, Diferença (`HC Atual − HC Orçado`, calculada automaticamente) e Status (`Dentro do Orçado` / `Abaixo do Orçado` / `Acima do Orçado`). Os valores atuais refletem a última versão do Excel enviada (incluindo a posição "Bombeiro Civil").

## Motor de Insights e Score de Qualidade

**Nenhuma chamada a IA/API externa é usada** — tudo roda no navegador, com regras determinísticas, para funcionar de graça no GitHub Pages.

### Score de Qualidade (0–100)

Cada plano é avaliado em 8 componentes de peso igual (12,5 pontos cada), sempre visíveis e explicados na interface (aba Dashboard → Score de Qualidade por Plano, clique num plano para expandir):

1. Clareza do Gap (Demanda/Gap com detalhe suficiente, não genérica)
2. Clareza da Ação
3. Produto / Entregável definido
4. Responsável definido
5. Prazo definido
6. Periodicidade definida
7. Resultado Esperado preenchido
8. Evidência / Resultado Obtido preenchido

### Insights e Sugestões

O motor (`src/lib/insights.ts`) analisa a base ativa (ignorando ações arquivadas) e gera mensagens categorizadas como **Crítico**, **Atenção**, **Oportunidade** ou **Positivo**, sempre explicando o motivo e apontando os planos relacionados. Entre as verificações: planos iniciados sem Resultado Esperado, ações não realizadas, inconsistência entre Status Atual e Resultado, ausência de prazo/responsável/entregável, descrições genéricas, planos em Mapeando sem atualização recente (30+ dias), planos com descrição muito semelhante entre si (possível duplicidade), concentração excessiva num único Pilar ou Macro Público, e destaques positivos (ex.: score médio acima da meta, resultados já avaliados como Ótimo).

Antes de agrupar/comparar textos, o sistema normaliza espaços extras, variações de `NA`/`N/A`/`N.A.` e diferenças de maiúsculas/minúsculas — mas **isso é feito apenas para cálculo**; o texto original exibido ao usuário nunca é alterado silenciosamente.

## Como importar uma nova versão do Excel

Vá em **Base / Configurações → Importar / Exportar → Importar Excel**. O sistema reconhece a aba "Gerenciador de Ações" (ou a primeira aba, se não encontrar esse nome) e a linha de cabeçalho pela coluna "Público-alvo". Depois de conferir a prévia, ao confirmar:

- Linhas com uma coluna "ID da Ação" preenchida mantêm esse ID (útil ao reimportar um arquivo já exportado por esta aplicação).
- Linhas sem ID (como a planilha original) recebem um novo ID sequencial.
- Resultados são regerados para bater exatamente com as ações importadas — resultados já preenchidos para IDs que continuam existindo são preservados; nada é inventado para os novos.
- Depois da importação inicial, a aplicação **não depende mais do arquivo Excel** para funcionar — os dados já estão salvos (Supabase e/ou localStorage).

## Como fazer backup dos dados

Em **Base / Configurações → Importar / Exportar**:

- **Exportar Backup JSON** — salva o estado completo (Ações, Resultados, Quadro HC, listas de apoio). É a forma mais segura de backup/restauração; use **Importar Backup JSON** para restaurar.
- **Exportar Excel (.xlsx)** — gera um arquivo com as abas Gerenciador de Ações, Resultados e Quadro HC, no mesmo espírito da planilha original.
- **Exportar CSV** — exporta o Gerenciador de Ações em CSV simples, útil para abrir em qualquer ferramenta.

## Limitações conhecidas / próximos passos

- A persistência via Supabase usa uma única linha "documento" (JSON) por simplicidade de configuração — adequado para o volume de dados de um único time/loja. Para múltiplos usuários editando ao mesmo tempo em tempo real, seria necessário evoluir para tabelas relacionais + Supabase Realtime.
- Não há autenticação de usuário — qualquer pessoa com o link (e, se configurado, a anon key do Supabase) pode editar os dados. Para um cenário com controle de acesso, adicione Supabase Auth e regras de RLS por usuário.
- O motor de similaridade de planos (para apontar possíveis duplicidades) usa uma heurística simples de sobreposição de palavras — é um alerta para revisão humana, não uma conclusão definitiva.
