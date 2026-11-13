# Grafolão 2026

[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-green.svg)](./LICENSE)
[![CI](https://github.com/ufam-grafolao/grafolao-2026/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ufam-grafolao/grafolao-2026/actions/workflows/ci.yml)

Bolão da Copa do Mundo 2026 com uma camada de **análise em teoria dos grafos**: além de palpites e rankings, o sistema compara os participantes jogo a jogo, monta um grafo de "quem venceu quem" e aplica ciclos, PageRank e caminho mais longo sobre ele.

Nasceu como trabalho final de **ICC041 (UFAM)** e foi usado de verdade durante a Copa (198 participantes e 4.181 palpites nos dados exportados, ver [Dados abertos](#dados-abertos-e-privacidade)). Hoje é mantido por uma pessoa. Licença MIT.

**Estado em uma linha:** bolão, comunidades e o grafo de confrontos estão implementados e testados nas regras puras; as propostas de grafos 4 e 5 e o redesign do frontend **não** estão prontos. Detalhes abaixo.

🔗 App: [grafolao-2026-frontend.vercel.app](https://grafolao-2026-frontend.vercel.app) *(link informado pelo mantenedor; não verificado se segue no ar)*

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
