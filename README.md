# Grafolão 2026 🏆

> Bolão da Copa do Mundo 2026 com análise de grafos — desenvolvido como trabalho final da disciplina **ICC041 - Introdução à Teoria dos Grafos** (UFAM, 2026/01).

🔗 **[grafolao-2026-frontend.vercel.app](https://grafolao-2026-frontend.vercel.app)**

---

## Sobre o projeto

O Grafolão é um sistema de bolão completo para a Copa do Mundo 2026 que, além de permitir palpites e rankings tradicionais, aplica três propostas distintas de **análise em teoria dos grafos** sobre os dados coletados dos participantes.

O projeto nasceu como trabalho acadêmico e evoluiu para um produto real, sendo utilizado por alunos da Universidade Federal do Amazonas durante a Copa do Mundo 2026.

### Propostas de grafos implementadas

| Proposta | Descrição | Algoritmos |
|---|---|---|
| **Proposta 2** | Grafo de Confrontos entre Participantes | PageRank, Detecção de Ciclos (DFS) |
| **Proposta 4** | Caminho Mínimo para o Título | DAG Temporal, Dijkstra, Fluxo Máximo |
| **Proposta 5** | Cliques e Panelinhas | Grafo Bipartido, Bron-Kerbosch |

---

## Stack

### Frontend
- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) — componentes (preset Nova)
- [TanStack Query v5](https://tanstack.com/query) — gerenciamento de estado servidor
- [Zustand](https://zustand-demo.pmnd.rs/) — estado global de autenticação
- [React Router DOM v7](https://reactrouter.com/) — roteamento
- [Sigma.js](https://www.sigmajs.org/) + [Graphology](https://graphology.github.io/) — visualização de grafos
- [flag-icons](https://flagicons.lipis.dev/) — bandeiras das seleções

### Backend
- [Fastify v5](https://fastify.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Prisma v6](https://www.prisma.io/) — ORM com migrations
- [@fastify/oauth2](https://github.com/fastify/fastify-oauth2) — Google OAuth2
- [@fastify/jwt](https://github.com/fastify/fastify-jwt) — autenticação stateless
- [@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit) — proteção contra abuso

### Banco de dados e infraestrutura
- [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/)
- [Docker](https://www.docker.com/) + Docker Compose — ambiente de desenvolvimento local
- [Vercel](https://vercel.com/) — deploy do frontend com CI/CD automático
- [Render](https://render.com/) — deploy do backend com CI/CD automático
- [UptimeRobot](https://uptimerobot.com/) — monitoramento e keep-alive

---

## Funcionalidades

### Sistema de bolão
- ✅ Login com Google OAuth2 — sem senha, zero fricção
- ✅ 104 jogos da Copa 2026 seedados (fase de grupos + mata-mata completo)
- ✅ Palpites com validação de prazo (fecha no início de cada jogo)
- ✅ Limite de 2 edições por palpite
- ✅ Status automático — jogos ficam "Ao vivo" após o horário de início
- ✅ Horários em GMT-4 (horário de Manaus)
- ✅ Bandeiras e nomes das seleções em português

### Sistema de pontuação
- 🎯 **10 pts** — placar exato
- ✅ **5 pts** — acertou o vencedor
- 📊 **2 pts** — acertou gols de um time ou saldo de gols
- Combinações possíveis (ex: vencedor + gols = 7 pts)
- Cálculo automático ao inserir resultado

### Grupos/Comunidades
- ✅ Criar comunidades públicas ou privadas
- ✅ Limite de 3 comunidades criadas por usuário
- ✅ Entrar em comunidades públicas por busca
- ✅ Sistema de solicitação para comunidades privadas
- ✅ Ranking interno por pontos
- ✅ Cargos: Dono, Moderador, Membro
- ✅ Código e link de convite por comunidade
- ✅ Dono e moderadores podem aprovar/rejeitar solicitações e expulsar membros

### Painel admin
- ✅ Inserir resultados com placar e artilheiros
- ✅ Editar resultados já inseridos
- ✅ Visualizar jogos pendentes e encerrados
- ✅ Pontuação calculada automaticamente após inserção

### Análise de grafos *(em desenvolvimento)*
- 🔄 Grafo de Confrontos — PageRank + ciclos
- 🔄 Caminho Mínimo para o Título — DAG + Dijkstra
- 🔄 Cliques e Panelinhas — Bron-Kerbosch

---

## Arquitetura

```
grafolao-2026/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── jogos/
│   │       │   ├── palpites/
│   │       │   ├── pontuacao/
│   │       │   ├── comunidades/
│   │       │   ├── admin/
│   │       │   ├── grafo-confrontos/   ← Proposta 2
│   │       │   ├── grafo-dag/          ← Proposta 4
│   │       │   └── grafo-cliques/      ← Proposta 5
│   │       └── shared/
│   │           ├── middlewares/
│   │           └── utils/
│   └── frontend/
│       └── src/
│           ├── components/
│           │   ├── layout/
│           │   ├── jogos/
│           │   ├── comunidades/
│           │   └── ui/                 ← shadcn/ui
│           ├── hooks/
│           ├── pages/
│           ├── types/
│           └── lib/
├── data/
│   ├── copa2026.json                   ← calendário completo
│   ├── usuarios_anonimizados.csv       ← dados de reprodução (WFA 2026)
│   ├── jogos.csv
│   ├── palpites_anonimizados.csv
│   ├── confrontos_anonimizados.csv
│   └── README.md                       ← documentação dos dados de reprodução
├── docker-compose.yml
└── README.md
```

---

## Como rodar

### Estratégia de ambientes

| Ambiente | Banco | Como rodar |
|---|---|---|
| Desenvolvimento local | PostgreSQL no Docker | `docker compose up` |
| Produção | Supabase (pooler porta 6543) | Render + Vercel |

### Pré-requisitos
- [Node.js](https://nodejs.org/) v22+
- [Docker](https://www.docker.com/) e Docker Compose
- Credenciais OAuth2 no [Google Cloud Console](https://console.cloud.google.com/)

### 1. Clone o repositório

```bash
git clone https://github.com/ufam-grafolao/grafolao-2026.git
cd grafolao-2026
```

### 2. Configure as variáveis de ambiente

**`apps/backend/.env`:**
```env
DATABASE_URL="postgresql://postgres:grafolao123@db:5432/grafolao"
DIRECT_URL="postgresql://postgres:grafolao123@db:5432/grafolao"
JWT_SECRET="seu_jwt_secret_aqui"
NODE_ENV=development
GOOGLE_CLIENT_ID="seu_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu_client_secret"
GOOGLE_CALLBACK_URL="http://localhost:3333/auth/google/callback"
FRONTEND_URL="http://localhost:5173"
```

**`apps/frontend/.env`:**
```env
VITE_API_URL=http://localhost:3333
```

### 3. Sobe o ambiente

```bash
docker compose up --build
```

### 4. Aplica o schema e seed (primeira vez)

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx tsx src/db/seed.ts
```

### 5. Acessa

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3333 |
| Health check | http://localhost:3333/health |

### 6. Primeiro acesso

O **primeiro usuário** a logar via Google vira **Admin** automaticamente.

---

## API — endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/auth/google` | Inicia OAuth2 |
| `GET` | `/auth/me` | Dados do usuário logado |
| `GET` | `/auth/me/resumo` | Pontos, acertos e palpites |
| `GET` | `/jogos` | Listar jogos com filtros |
| `GET` | `/jogos/hoje` | Jogos do dia (GMT-4) |
| `POST` | `/palpites` | Salvar/editar palpite |
| `GET` | `/palpites/meus` | Meus palpites |
| `GET` | `/comunidades` | Minhas comunidades |
| `POST` | `/comunidades` | Criar comunidade |
| `GET` | `/comunidades/buscar` | Buscar por nome ou código |
| `GET` | `/comunidades/:id/ranking` | Ranking da comunidade |
| `POST` | `/admin/jogos/:id/resultado` | Inserir resultado (admin) |

---

## Banco de dados

**16 tabelas:** `usuarios`, `times`, `jogos`, `resultados`, `palpites`, `palpites_especiais`, `confrontos`, `pagerank_snapshots`, `ciclos_detectados`, `estados_rodada`, `acertos_compartilhados`, `clique_snapshots`, `comunidades`, `membros_comunidade`, `convites_comunidade`, `solicitacoes_comunidade`

---

## Dados de Reprodução (WFA 2026)

Os dados utilizados nos experimentos do artigo submetido ao **Workshop de Ferramentas e Aplicações (WFA 2026 / WebMedia)** estão disponíveis em [`data/`](./data), com documentação completa das colunas e do procedimento de reprodução em [`data/README.md`](./data/README.md).

Os dados foram extraídos da instância de produção ao final da fase avaliada da Copa do Mundo 2026 e **anonimizados**: todo identificador de usuário foi substituído por um pseudônimo estável (`user1`, `user2`, ...), sem nome, e-mail ou qualquer outro dado pessoal. Os arquivos disponíveis são:

- `usuarios_anonimizados.csv` — pseudônimo de cada participante e data de criação da conta
- `jogos.csv` — calendário completo da competição (times, fase, data, placar oficial)
- `palpites_anonimizados.csv` — cada palpite registrado (usuário pseudonimizado, jogo, placar previsto, pontuação)
- `confrontos_anonimizados.csv` — arestas do grafo de confrontos já agregadas (vencedor, perdedor, peso)

Esses dados permitem reproduzir a modelagem do grafo de confrontos e os três algoritmos aplicados sobre ele (detecção de ciclos, PageRank, caminho mais longo), reconstruindo os resultados apresentados no artigo.

---

## Autor e Colaboradores

| Nome | GitHub | Proposta |
|---|---|---|
| Samuel Davi (Autor) | [@Samuel-Davi](https://github.com/Samuel-Davi) | Proposta 2 — Grafo de Confrontos |
| Victor Hugo | [@Victor-Hugo](https://github.com/vhodm) | Proposta 4 — Caminho Mínimo |
| Paulo Victor | [@Paulo-Victor](https://github.com/plaaeo) | Proposta 5 — Cliques e Panelinhas |

---

## Licença

[MIT](./LICENSE)