# Grafolão 2026 🏆

Sistema de bolão da Copa do Mundo 2026 com análise de grafos, desenvolvido como trabalho final da disciplina **ICC041 - Introdução à Teoria dos Grafos** (UFAM, 2026/01).

## Sobre o projeto

O Grafolão permite que participantes façam palpites nos jogos da Copa do Mundo 2026 e aplica três propostas distintas de análise em teoria dos grafos sobre os dados coletados, gerando rankings alternativos e visualizações interativas.

### Propostas implementadas

| Proposta | Descrição | Algoritmos |
|---|---|---|
| **Proposta 2** | Grafo de Confrontos entre Participantes | PageRank, Detecção de Ciclos (DFS) |
| **Proposta 4** | Caminho Mínimo para o Título | DAG Temporal, Dijkstra, Fluxo Máximo |
| **Proposta 5** | Cliques e Panelinhas | Grafo Bipartido, Bron-Kerbosch |

---

## Stack

### Frontend
- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) — componentes (preset Nova)
- [Sigma.js](https://www.sigmajs.org/) + [Graphology](https://graphology.github.io/) — visualização de grafos
- [Zustand](https://zustand-demo.pmnd.rs/) — gerenciamento de estado
- [React Router DOM](https://reactrouter.com/) — roteamento

### Backend
- [Fastify v5](https://fastify.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Prisma v6](https://www.prisma.io/) — ORM
- [@fastify/oauth2](https://github.com/fastify/fastify-oauth2) — autenticação Google
- [@fastify/jwt](https://github.com/fastify/fastify-jwt) — sessão via JWT

### Banco de dados
- [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/)

### Infraestrutura
- [Docker](https://www.docker.com/) + Docker Compose
- [Vercel](https://vercel.com/) — deploy do frontend
- [Render](https://render.com/) — deploy do backend

---

## O que já está implementado

### ✅ Infraestrutura
- Monorepo com npm workspaces (`apps/backend`, `apps/frontend`, `packages/types`)
- Docker Compose com healthcheck — frontend sobe apenas após backend estar saudável
- Schema Prisma completo com todas as tabelas dos três módulos de grafos
- Seed com 48 times e 104 jogos da Copa 2026 (fase de grupos + mata-mata completo)

### ✅ Autenticação
- Login com Google OAuth2
- JWT gerado pelo backend após autenticação
- Primeiro usuário a logar vira **Admin** automaticamente
- Rotas protegidas por role (Admin / Participante)

### ✅ Frontend
- Layout base com sidebar recolhível
- Toggle de tema claro/escuro
- Tela de login com botão "Entrar com Google"
- Página de callback OAuth2
- Dashboard inicial com cards de pontos, ranking e palpites
- Rotas protegidas com redirecionamento automático

### 🚧 Em desenvolvimento
- Listagem de jogos do dia com formulário de palpite
- Ranking por pontos
- Painel admin (inserir resultados, liberar fases)
- Módulos de análise de grafos (Propostas 2, 4 e 5)
- Visualização interativa com Sigma.js

---

## Estrutura do repositório

```
grafolao-2026/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── jogos/
│   │       │   ├── palpites/
│   │       │   ├── pontuacao/
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
│           │   └── ui/                 ← shadcn/ui
│           ├── hooks/
│           ├── pages/
│           └── services/
├── data/
│   └── copa2026.json                   ← calendário completo
├── packages/
│   └── types/
└── docker-compose.yml
```

---

## Como rodar

### Pré-requisitos
- [Node.js](https://nodejs.org/) v22+
- [Docker](https://www.docker.com/) e Docker Compose
- Conta no [Supabase](https://supabase.com/) (gratuito)
- Credenciais OAuth2 no [Google Cloud Console](https://console.cloud.google.com/)

### 1. Clone o repositório

```bash
git clone https://github.com/ufam-grafolao/grafolao-2026.git
cd grafolao-2026
```

### 2. Configure as variáveis de ambiente

**Backend — Docker (`apps/backend/.env`):**
```env
DATABASE_URL="postgresql://postgres:grafolao123@db:5432/grafolao"
JWT_SECRET="grafolao_secret_2026"
PORT=3333
HOST=0.0.0.0
NODE_ENV=development
GOOGLE_CLIENT_ID="seu_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu_client_secret"
GOOGLE_CALLBACK_URL="http://localhost:3333/auth/google/callback"
FRONTEND_URL="http://localhost:5173"
```

**Frontend (`apps/frontend/.env`):**
```env
VITE_API_URL=http://localhost:3333
```

### 3. Rodar com Docker (recomendado para devs)
 
```bash
docker compose up --build
```
 
Na primeira vez, aplica o schema e o seed:
 
```bash
docker compose exec backend npx prisma db push
docker compose exec backend npx tsx src/db/seed.ts
```
 
| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3333 |
| Health check | http://localhost:3333/health |
| PostgreSQL | localhost:5432 |

### 4. Primeiro acesso

1. Acesse `http://localhost:5173`
2. Clique em **Entrar com Google**
3. O primeiro usuário a logar recebe automaticamente o papel de **Admin**
4. Os demais usuários são criados como **Participantes**

---

## Endpoints da API

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/health` | Health check | — |
| `GET` | `/auth/google` | Inicia fluxo OAuth2 | — |
| `GET` | `/auth/google/callback` | Callback do Google | — |
| `GET` | `/auth/me` | Dados do usuário autenticado | ✅ |
| `POST` | `/auth/logout` | Logout | ✅ |

> Mais endpoints serão adicionados conforme o desenvolvimento avança.

---

## Autores

- [Samuel Davi](https://github.com/Samuel-Davi)
- [Victor Hugo](https://github.com/vhodm)
- [Paulo Victor](https://github.com/plaaeo)
