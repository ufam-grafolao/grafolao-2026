# CLAUDE.md: Grafolão 2026

Instruções para o agente. Leia inteiro antes de qualquer tarefa. Idioma de trabalho: português do Brasil.

## O projeto

Bolão da Copa do Mundo 2026 com análise em teoria dos grafos. Começou como trabalho de ICC041 (UFAM) e teve uso real: 198 participantes e mais de 4.000 palpites. Licença MIT. Mantenedor atual: Samuel (sozinho; os colaboradores anteriores saíram do projeto).

Monorepo:
- `apps/backend`: Fastify v5, TypeScript, Prisma v6, `@fastify/jwt`, `@fastify/oauth2` (Google), `@fastify/rate-limit`. Deploy no Render a partir da `main`.
- `apps/frontend`: React 19, TypeScript, Vite, Tailwind v4, shadcn/ui, TanStack Query v5, Zustand, React Router v7, Sigma.js + Graphology. Deploy na Vercel: `main` = produção; outras branches (incluindo `dev`) geram preview.
- Banco: PostgreSQL no Supabase (pooler 6543 em produção); Docker Compose em desenvolvimento.
- Dados da Copa: football-data.org (o campo `apiFootballId` é só nome legado).

Regras de negócio: palpites fecham no início do jogo, máximo de 2 edições. Pontuação de grupos 10/5/2 (combináveis); mata-mata tem tabela própria em `palpites.service.ts`. Comunidades públicas/privadas com dono, moderador e membro. O primeiro usuário a logar vira Admin.

## Estado verificado (diagnóstico de 05/11/2026, leitura de código, sem execução)

- **Grafos implementados:** só `grafo-confrontos` (Proposta 2), com rotas `/grafos/confrontos`, `/ciclos`, `/caminho-mais-longo`, `/evolucao`. Código lido, ainda não executado em teste.
- **Bug conhecido:** `grafo-confrontos.service.ts` (~linha 411) ordena `rodada` como texto ("Matchday 10" antes de "Matchday 2"). A ordem correta vem de `min(dataHora)` dos jogos da rodada.
- **Não existem:** módulos `grafo-dag` e `grafo-cliques` (o README os cita, mas não há código). As telas "Aventura da Zebra" (`/grafos/mst`) e "Redes de Similaridades" (`/grafos/redes`) são placeholders "em breve".
- **Models sem uso:** `EstadoRodada`, `AcertoCompartilhado`, `CliqueSnapshot` existem no schema e na migration `init_recuperado`, mas nenhum código os usa.
- **Testes e CI:** não há testes, runner nem `.github/workflows`. Os checks que aparecem nos PRs vêm das integrações de deploy, não de CI próprio.
- **Dados públicos:** `data/` (CSVs anonimizados) está na `main` (PR #33). `data/_privado/` está no `.gitignore` da `main`.

## Fluxo de Git

- Fluxo oficial: `feat/*` ou `fix/*` ou `chore/*` → PR para `dev` → PR de `dev` para `main`.
- Sempre confirme a branch atual antes de agir. Nunca commite direto em `main` ou `dev`.
- **Comandos destrutivos** (force push, reset em branch compartilhada, exclusão de branch remota, reescrita de histórico): você NÃO executa. Escreva os comandos num relatório, com explicação de cada um, verificação e como desfazer. O Samuel executa.
- Commits pequenos, mensagens no padrão Conventional Commits em português (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- Push e abertura de PR só com autorização explícita na conversa.

## Privacidade (inegociável)

- Participantes não consentiram com publicação de nome ou e-mail. Exportações e publicações usam pseudônimos `user1…N`.
- `data/_privado/` nunca vai para o Git. Confira o `.gitignore` antes de qualquer commit que toque em `data/`.
- Nunca imprima nomes ou e-mails reais em logs, testes, fixtures, relatórios ou saída de terminal. Em auditorias, reporte apenas contagens, caminhos e hashes de commit.
- Fixtures de teste usam só dados sintéticos com pseudônimos.

## Honestidade

- Só afirme o que verificou. Separe sempre: "verificado executando", "lido no código, não executado" e "não verificado".
- Nunca invente números. Métricas do grafo e de retenção têm fonte e data de coleta; cite ambas.
- Quando o caminho mais longo não completa no orçamento, diga `completou=false` explicitamente.
- Funcionalidade só é "implementada" depois de rodar em produção.

## Testes (padrão do projeto)

Os testes também são material de portfólio: devem ser profissionais e fáceis de entender.
- Vitest no backend. Testes unitários sobre funções puras; extraia a lógica do Prisma quando necessário, sem mudar comportamento.
- Nomes em português descrevendo o comportamento (`it('dá 10 pontos quando o placar é exato')`).
- Estrutura Arrange / Act / Assert, com um comentário curto explicando o porquê do caso quando não for óbvio.
- Grafos pequenos com resultado calculado à mão, documentado no próprio teste.
- Um teste por comportamento; cubra casos de borda (grafo vazio, empate, limite de edições, início do jogo).

## Relatórios

Todo diagnóstico, plano ou resultado de tarefa vai para um arquivo Markdown em `docs/relatorios/`, nomeado `AAAA-MM-DD-NN-assunto.md`. No chat, só um resumo curto e o caminho do arquivo. Cada relatório termina com "Verificado", "Não verificado" e "Decisões pendentes do Samuel".

## Roteiro (nov/2026)

1. Backup e auditoria de privacidade do histórico.
2. `chore/setup`: arquivos soltos (CLAUDE.md, script de exportação) e Vitest. README será atualizado depois, antes do merge.
3. Limpeza de branches: arquivar o trabalho de cliques de `dev` em `arquivo/cliques-paulo`, resetar `dev` para `main`, apagar branches já mergeadas.
4. Testes das regras críticas + correção da ordenação de rodadas + CI no GitHub Actions.
5. Redesign do frontend (skill `frontend-design`, mantendo verde/amarelo da Copa). E2E com Playwright depois do redesign.
6. Proposta 4 (Caminho Mínimo para o Título): modelagem pendente de decisão com a professora (opções A, B, C nos relatórios).
7. Proposta 5 (Cliques e Panelinhas): decidido começar por cliques na projeção; limiar por percentil (provisório). Jogos "óbvios", `ACERTO_BONUS` e destino de `AcertoCompartilhado` ainda em aberto.
8. Análise estatística (modelo nulo, Spearman/Kendall com bootstrap, comunidades, Kaplan-Meier, estabilidade temporal). Usar apenas os CSVs de `data/`.
9. Novo artigo.

## Decisões que não são suas

Escopo, modelagem das propostas, o que cortar, o que vai para o artigo e qualquer coisa envolvendo a professora: apresente opções com prós e contras e pergunte.