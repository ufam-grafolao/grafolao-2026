# Grafolão 2026

[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-green.svg)](./LICENSE)
[![CI](https://github.com/ufam-grafolao/grafolao-2026/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ufam-grafolao/grafolao-2026/actions/workflows/ci.yml)

Bolão da Copa do Mundo 2026 com uma camada de **análise em teoria dos grafos**: além de palpites e rankings, o sistema compara os participantes jogo a jogo, monta um grafo de "quem venceu quem" e aplica ciclos, PageRank e caminho mais longo sobre ele.

Nasceu como trabalho final de **ICC041 (UFAM)** e foi usado de verdade durante a Copa (198 participantes e 4.181 palpites nos dados exportados, ver [Dados abertos](#dados-abertos-e-privacidade)). Hoje é mantido por uma pessoa. Licença MIT.

**Estado em uma linha:** bolão, comunidades e o grafo de confrontos estão implementados e testados nas regras puras; as propostas de grafos 4 e 5 e o redesign do frontend **não** estão prontos. Detalhes abaixo.

🔗 App: [grafolao-2026-frontend.vercel.app](https://grafolao-2026-frontend.vercel.app)

---

## Status

| Estado | O que |
|---|---|
| ✅ **Implementado** | Login com Google; palpites com prazo e limite de edições; palpites especiais; ranking geral; comunidades; painel admin; notificações Web Push; **grafo de confrontos** (Proposta 2): ciclos, PageRank, caminho mais longo e evolução por rodada |
| 🔄 **Em desenvolvimento** | Redesign do frontend: por enquanto só auditoria e direção visual, **sem código no repositório** |
| 🗺️ **Planejado** (não implementado) | **Proposta 4**, Caminho Mínimo para o Título; **Proposta 5**, Cliques e Panelinhas; telas "Aventura da Zebra" e "Redes de Similaridades". No app existem apenas telas "em breve" |

Qualidade: 75 testes automatizados no backend (só regras puras), CI no GitHub Actions. **Não há** testes de frontend, testes E2E nem testes dos services e controllers (que falam com o banco). Ver [Testes e CI](#testes-e-ci).

---

## Funcionalidades

- **Login com Google (OAuth2)**, sem senha. O primeiro usuário a logar vira Admin.
- **Palpites** em jogos individuais ou em lote. Fecham no início do jogo e podem ser editados no máximo 2 vezes. No mata-mata, quem palpita empate escolhe também o vencedor dos pênaltis.
- **Palpites especiais**: Campeão (35 pts), MVP (35), Artilheiro (30), Vice (25) e 3º lugar (18).
- **Chaveamento** do mata-mata: o vencedor de cada jogo avança automaticamente na árvore quando o admin registra o resultado.
- **Ranking geral** paginado, por pontos ou por acertos completos.
- **Comunidades** públicas ou privadas, com dono, moderador e membro; convite por código, solicitação de entrada, ranking interno (o dono pode contar pontos só a partir de uma fase) e aba com os palpites dos membros nos jogos encerrados. Cada usuário cria no máximo 3 comunidades.
- **Notificações Web Push** (VAPID) agendadas pelo backend: 1 h, 30 min e 15 min antes de cada jogo.
- **Painel admin**: resultados (inclusive pênaltis), resultados dos palpites especiais, estatísticas de engajamento e assinantes de push.

### Pontuação

**Fase de grupos**

| Situação | Pontos |
|---|---|
| Placar exato | **10** (total; o bônus não se soma) |
| Resultado certo (vencedor ou empate) + gols de um dos times **ou** saldo certo | **7** (5 + 2) |
| Resultado certo, sem bônus | **5** |
| Resultado errado | **0** |

O bônus de +2 só existe junto com o resultado certo e vale uma única vez, mesmo que gols e saldo coincidam. Exemplo: palpitar 1 x 1 e o jogo terminar 2 x 2 vale 7, porque o saldo (0 = 0) coincide.

**Mata-mata** (avaliado de cima para baixo; "pênaltis" = jogo empatado decidido na disputa)

| Situação | Pontos |
|---|---|
| Placar exato, jogo foi a pênaltis e acertou o vencedor dos pênaltis | **20** |
| Placar exato nos demais casos | **15** |
| Jogo foi a pênaltis, palpitou empate (outro placar) e acertou o vencedor dos pênaltis | **15** |
| Jogo foi a pênaltis, palpitou empate (outro placar) e errou o vencedor dos pênaltis | **10** |
| Jogo foi a pênaltis e o palpite foi de vitória | **0** |
| Sem pênaltis, vencedor certo + gols de um time ou saldo certo | **10** |
| Sem pênaltis, vencedor certo, sem bônus | **7** |
| Sem pênaltis, vencedor errado ou palpitou empate | **0** |

Fonte: [`palpites.regras.ts`](./apps/backend/src/modules/palpites/palpites.regras.ts), com a tabela detalhada (incluindo o status gravado em cada caso) em [`apps/backend/tests/README.md`](./apps/backend/tests/README.md). Cada linha tem teste.

**Prazo:** o banco guarda o horário local de Manaus (UTC-4) como se fosse UTC, e o código soma 4 horas para obter o instante real do início. Essa explicação foi inferida do código; não há documentação própria dela.

---

## Análise em grafos (Proposta 2: grafo de confrontos)

### Modelagem

- **Vértices:** participantes.
- **Confronto:** em cada jogo encerrado, os participantes que palpitaram são comparados dois a dois. Quem fez **mais pontos** naquele jogo vence o confronto; **empate de pontos não gera relação**.
- **Aresta:** para cada par, soma-se o saldo de vitórias (vitórias de A sobre B menos vitórias de B sobre A). Só existe aresta **se o saldo for > 0**, direcionada do vencedor líquido para o perdedor, com o saldo como peso.
- **Núcleo ativo:** o parâmetro `minPalpites=10` restringe o grafo a quem fez pelo menos 10 palpites.

### Algoritmos

Implementados em [`grafo-confrontos.algoritmos.ts`](./apps/backend/src/modules/grafo-confrontos/grafo-confrontos.algoritmos.ts) (funções puras, testadas com grafos pequenos de resultado calculado à mão):

| Algoritmo | Como funciona |
|---|---|
| **Ciclos** | DFS com coloração (branco/cinza/preto). Cada aresta de retorno fecha um ciclo; guarda ciclos de tamanho ≥ 3, sem duplicatas (mesmo conjunto de vértices). É a detecção por arestas de retorno da DFS, **não** uma enumeração de todos os ciclos simples |
| **PageRank** | Iterativo, d = 0,85, tolerância 1e-6, no máximo 100 iterações. O voto é **invertido**: quem perde cede importância a quem vence. Os pesos das arestas não entram no cálculo (o que conta é o grau de saída) |
| **Caminho mais longo** | Busca exaustiva "anytime" com orçamento de 120 s. Devolve o melhor caminho encontrado, `completou` (se a busca terminou dentro do orçamento) e `tempoMs` |

### Endpoints

`GET /grafos/confrontos` (grafo e PageRank; aceita `rodada` e `minPalpites`), `/grafos/confrontos/ciclos`, `/grafos/confrontos/caminho-mais-longo` e `/grafos/confrontos/evolucao` (PageRank acumulado rodada a rodada, com as rodadas em ordem cronológica). Todos exigem login. No frontend: `/grafos/confrontos`, com visualização em Sigma.js.

### Números

Fonte: coleta pós-torneio feita pela API de produção em **2026-08-14**, informada pelo mantenedor. A base estava viva e os valores variaram entre coletas.

| Métrica | Completo | Filtrado (≥ 10 palpites) |
|---|---|---|
| \|V\| | 197 | 72 |
| \|E\| | 3.235 | 1.612 |
| Densidade | 8,38% | 31,53% |
| Ciclos | 1.228 | 841 |
| Caminho mais longo | 85 | 62 |

- **O caminho mais longo teve `completou=false` nos dois casos:** os valores são o melhor caminho parcial encontrado em 120 s, **não** o ótimo.
- Conferido hoje contra os CSVs de [`data/`](./data) (verificado executando um script de contagem): \|E\| = 3.235 e 1.612, 72 participantes com ≥ 10 palpites e as densidades (arestas ÷ n(n−1)) batem. Esses são os únicos números conferidos.
- **Ciclos e caminho mais longo não foram reproduzidos** a partir dos CSVs. A reprodução completa ainda não foi feita.
- Os CSVs trazem 198 usuários, dos quais 154 têm ao menos um palpite; o \|V\| = 197 da coleta de produção não foi reconciliado com esses números.

### Limitações conhecidas

- **PageRank com invicto:** o algoritmo não redistribui a massa de quem nunca perdeu, então a soma dos valores fica abaixo de 1 quando há invicto. Há teste que registra esse comportamento; **não foi corrigido** e o efeito na ordem do ranking não foi analisado.
- Os pesos das arestas não participam do PageRank (ver acima).
- Sem modelo nulo, não se pode afirmar que a estrutura observada (ciclos, caminhos) difere do acaso.
- Os services que montam o grafo a partir do banco não têm teste automatizado.

---

## Arquitetura e stack

Monorepo npm workspaces (`apps/*`, `packages/*`):

```
Navegador ── React (Vercel) ──HTTP/JWT──▶ Fastify (Render) ──Prisma──▶ PostgreSQL (Supabase)
                                              │
                                              ├─ Google OAuth2 (login)
                                              └─ Web Push (VAPID) + scheduler interno
```

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, TanStack Query v5, Zustand, React Router v7, Sigma.js + Graphology (ForceAtlas2), flag-icons |
| **Backend** | Fastify v5, TypeScript, Prisma v6, `@fastify/jwt`, `@fastify/oauth2` (Google), `@fastify/rate-limit`, `@fastify/cookie`, web-push |
| **Dados** | PostgreSQL; Supabase em produção (pooler na porta 6543) e Docker Compose em desenvolvimento |
| **Qualidade** | Vitest (backend), GitHub Actions, ESLint (frontend) |
| **Monitoramento** | Sentry no frontend (`@sentry/react`); o backend não tem Sentry |

**Deploy:** frontend na Vercel e backend no Render, a partir da `main`; as demais branches geram preview na Vercel. Só a configuração da Vercel (`apps/frontend/vercel.json`, reescrita de SPA) está no repositório; o restante é **informado pelo mantenedor** e não verificável aqui.

**Dados da Copa:** o calendário vem de arquivos JSON em `apps/backend/data/`, carregados pelo seed (104 jogos). Os resultados são inseridos pelo admin no painel.

---

## Como rodar localmente

Pré-requisitos: Node.js 22+ (os Dockerfiles usam `node:22-alpine`), Docker com Compose e credenciais OAuth do Google Cloud.

```bash
git clone https://github.com/ufam-grafolao/grafolao-2026.git
cd grafolao-2026
cp apps/backend/.env.example apps/backend/.env     # preencha as variáveis
cp apps/frontend/.env.example apps/frontend/.env   # preencha VITE_API_URL
docker compose up --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run db:seed
```

Em desenvolvimento, `DATABASE_URL` e `DIRECT_URL` apontam para o serviço `db` do Compose (ver usuário, senha e banco em [`docker-compose.yml`](./docker-compose.yml)). O `.env.example` do backend lista também `JWT_SECRET`, `GOOGLE_*`, `FRONTEND_URL`, `PORT`, `HOST`, as chaves `VAPID_*` e `PRAZO_PALPITES_ESPECIAIS`. No frontend, `VITE_API_URL` aponta para o backend e `VITE_SENTRY_DSN` é opcional.

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3333 (health check em `/health`) |

Status de verificação destes comandos: **`docker compose` e `prisma migrate deploy` não foram executados** nesta revisão (exigem credenciais e banco). Foram **executados** com sucesso: `npm run db:generate`, `npm run build --workspace=apps/backend`, `npm run build --workspace=apps/frontend` e `npm run test:coverage --workspace=apps/backend`.

---

## Testes e CI

```bash
cd apps/backend
npm test                # 75 testes, 9 arquivos (verificado executando)
npm run test:coverage   # testes + cobertura
```

- **O que é coberto:** as regras puras, extraídas dos services para funções sem banco: pontuação de grupos e mata-mata, prazo e limite de edições, arestas do grafo, PageRank, ciclos, caminho mais longo (inclusive `completou=false`) e ordenação cronológica das rodadas. Os testes usam apenas dados sintéticos (`user1`, `user2`, ...). Guia completo em [`apps/backend/tests/README.md`](./apps/backend/tests/README.md).
- **Cobertura medida** apenas nos arquivos de regras puras que os testes carregam: 98,88% das instruções e 100% das linhas (execução de 2026-11-13). Não é cobertura do backend inteiro.
- **O que não é coberto:** services e controllers (acesso ao Prisma e HTTP), frontend (sem testes) e fluxos E2E.
- **CI** ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)), em PRs para `dev` e `main` e em pushes para `dev`: `Backend: build e testes`, `Frontend: build` e `Lint (não bloqueante)`. Segundo o mantenedor, a `main` está protegida e exige o CI (configuração do GitHub, não verificável pelo código).
- **Lint do frontend:** 24 erros e 3 avisos herdados (reconferido em 2026-11-13). Por isso o job de lint não bloqueia; a meta é zerá-los e passar a exigir o job.

---

## Dados abertos e privacidade

A pasta [`data/`](./data) traz a exportação anonimizada usada nas análises (gerada por [`exportar-dados-anonimizados.ts`](./apps/backend/src/script/exportar-dados-anonimizados.ts)). Contagens atuais dos arquivos (verificadas executando):

| Arquivo | Linhas de dados |
|---|---|
| `usuarios_anonimizados.csv` | 198 |
| `palpites_anonimizados.csv` | 4.181 |
| `jogos.csv` | 104 |
| `confrontos_anonimizados.csv` | 14.188 |

Esses números vêm do export. `confrontos_anonimizados.csv` tem um confronto por linha (um par de participantes em um jogo, `peso` = 1), **não** as arestas já agregadas: a agregação por saldo (3.235 arestas) é feita sobre ele.

**Pseudonimização:** nomes, e-mails e identificadores foram trocados por `user1…N`. A tabela que liga o pseudônimo à pessoa real **nunca é versionada** (`data/_privado/` está no `.gitignore`). Os participantes não consentiram com a publicação de dados pessoais; por isso a exportação só contém pseudônimos.

**Risco residual de reidentificação, dito de forma factual:**

- `usuarios_anonimizados.csv` traz a data e hora de cadastro de cada conta, com precisão de milissegundos.
- A numeração dos pseudônimos segue a ordem de cadastro (`user1` é o cadastro mais antigo e `user198` o mais recente).
- Quem souber quando uma pessoa se cadastrou, ou a posição dela na ordem de entrada, pode ligá-la ao pseudônimo. Os palpites e a pontuação de cada pseudônimo também são públicos.

Se você se reconhece nos dados e quer a remoção, abra uma Issue.

---

## Estrutura de pastas

```
grafolao-2026/
├── apps/
│   ├── backend/
│   │   ├── prisma/                 schema e migrations
│   │   ├── data/                   calendário e seleções (JSON usados no seed)
│   │   ├── tests/                  testes Vitest (README próprio)
│   │   └── src/
│   │       ├── db/                 cliente Prisma e seed
│   │       ├── modules/            admin, auth, comunidade, grafo-confrontos, jogadores,
│   │       │                       jogos, palpites, palpites-especiais, push, ranking, times
│   │       ├── script/             exportação anonimizada e recálculo de confrontos
│   │       ├── shared/             middleware de auth e utilitários
│   │       ├── scheduler.ts        lembretes push
│   │       └── server.ts
│   └── frontend/
│       └── src/                    components/, hooks/, pages/, lib/, types/
├── packages/types/                 tipos compartilhados
├── data/                           CSVs anonimizados e README dos dados
├── .github/workflows/ci.yml
├── docker-compose.yml
└── LICENSE
```

O banco tem 19 modelos no Prisma. Três deles (`EstadoRodada`, `AcertoCompartilhado`, `CliqueSnapshot`) existem no schema e na migration, mas **nenhum código os usa**; são reservas para as propostas ainda não implementadas. Não existem módulos `grafo-dag` nem `grafo-cliques`.

---

## Roadmap

1. Testes dos services contra um banco e reprodução completa dos números do grafo a partir de `data/`.
2. Correção e análise do PageRank com invicto.
3. Redesign do frontend e, depois, testes E2E.
4. Zerar os erros de lint e exigir o job de lint no CI.
5. Proposta 4 (Caminho Mínimo para o Título): modelagem ainda em decisão.
6. Proposta 5 (Cliques e Panelinhas): começar por cliques na projeção; um trabalho antigo e incompleto está arquivado em uma branch de arquivo e não faz parte do código atual.
7. Análise estatística dos dados com modelo nulo.

Contato: abra uma [Issue](https://github.com/ufam-grafolao/grafolao-2026/issues).

## Licença

[MIT](./LICENSE)
