# Panelinhas (Proposta 5) nos CSVs anonimizados

Fonte: `data/*.csv` (exportação de produção de 2026-08-14). Gerado por `analise/panelinhas.ts` em 2026-11-23.
Jogos encerrados: 104. Palpites nesses jogos: 4181. Orçamento por execução: 60 s. Tempos medidos nesta máquina, uma execução.
Acerto = ACERTO_PLACAR, ACERTO_VENCEDOR ou ACERTO_BONUS (pontos > 0), salvo onde indicado.

## 1. Distribuição dos pesos positivos (campeonato inteiro)

| Recorte | Pares com peso ≥ 1 | Mín | p50 | p75 | p90 | p95 | p99 | Máx |
|---|---|---|---|---|---|---|---|---|
| Completo | 4.645 | 1 | 3 | 14 | 27 | 31 | 39 | 52 |
| Núcleo ≥10 | 2.405 | 1 | 13 | 24 | 31 | 35 | 42 | 52 |

## 2. Efeito do percentil (campeonato inteiro)

| Recorte | p | Limiar (jogos) | \|E\| | Vértices com aresta | Clique máxima | Panelas (≥3) | Média top-5 | Tempo (ms) | Completou |
|---|---|---|---|---|---|---|---|---|---|
| Completo | 75 | 14 | 1.180 | 54 | 42 | 15 | 37,4 | 47 | true |
| Completo | 90 | 27 | 477 | 43 | 19 | 38 | 19,0 | 18 | true |
| Completo | 95 | 31 | 262 | 39 | 13 | 33 | 13,0 | 5 | true |
| Completo | 99 | 39 | 47 | 16 | 8 | 6 | 5,2 | 1 | true |
| Núcleo ≥10 | 75 | 24 | 636 | 44 | 25 | 36 | 24,4 | 9 | true |
| Núcleo ≥10 | 90 | 31 | 262 | 39 | 13 | 33 | 13,0 | 3 | true |
| Núcleo ≥10 | 95 | 35 | 121 | 28 | 10 | 19 | 8,4 | 1 | true |
| Núcleo ≥10 | 99 | 42 | 26 | 11 | 6 | 3 | 5,3 | 1 | true |

## 3. Sensibilidade à definição de acerto e ao filtro de jogos óbvios (p = 90, campeonato inteiro)

| Recorte | Variante | Limiar | \|E\| | Clique máxima | Panelas (≥3) | Tempo (ms) | Completou |
|---|---|---|---|---|---|---|---|
| Completo | padrão (com bônus, sem filtro) | 27 | 477 | 19 | 38 | 8 | true |
| Completo | sem ACERTO_BONUS | 27 | 475 | 19 | 38 | 7 | true |
| Completo | exclui jogos acertados por > 80% | 10 | 278 | 11 | 58 | 5 | true |
| Completo | exclui jogos acertados por > 60% | 5 | 218 | 10 | 62 | 4 | true |
| Núcleo ≥10 | padrão (com bônus, sem filtro) | 31 | 262 | 13 | 33 | 3 | true |
| Núcleo ≥10 | sem ACERTO_BONUS | 31 | 262 | 13 | 33 | 2 | true |
| Núcleo ≥10 | exclui jogos acertados por > 80% | 11 | 225 | 10 | 43 | 2 | true |
| Núcleo ≥10 | exclui jogos acertados por > 60% | 5 | 172 | 9 | 46 | 1 | true |

## 4. Série por rodada acumulada (p = 90, limiar recalculado a cada rodada)

| Rodada | Jogos acumulados | Recorte | Limiar | \|E\| | Clique máxima | Média top-5 | Panelas (≥3) | Tempo (ms) | Completou |
|---|---|---|---|---|---|---|---|---|---|
| Matchday 1 | 2 | Completo | 1 | 1 | 2 | 0,0 | 0 | 1 | true |
| Matchday 1 | 2 | Núcleo ≥10 | 1 | 1 | 2 | 0,0 | 0 | 1 | true |
| Matchday 2 | 4 | Completo | 1 | 4 | 3 | 3,0 | 1 | 2 | true |
| Matchday 2 | 4 | Núcleo ≥10 | 1 | 4 | 3 | 3,0 | 1 | 0 | true |
| Matchday 3 | 8 | Completo | 1 | 368 | 27 | 12,3 | 3 | 3 | true |
| Matchday 3 | 8 | Núcleo ≥10 | 1 | 123 | 16 | 9,5 | 2 | 1 | true |
| Matchday 4 | 12 | Completo | 2 | 105 | 11 | 9,2 | 6 | 2 | true |
| Matchday 4 | 12 | Núcleo ≥10 | 3 | 39 | 8 | 5,3 | 4 | 1 | true |
| Matchday 5 | 16 | Completo | 2 | 112 | 11 | 9,2 | 8 | 2 | true |
| Matchday 5 | 16 | Núcleo ≥10 | 3 | 40 | 8 | 4,8 | 5 | 0 | true |
| Matchday 6 | 20 | Completo | 4 | 153 | 12 | 10,6 | 12 | 3 | true |
| Matchday 6 | 20 | Núcleo ≥10 | 4 | 153 | 12 | 10,6 | 12 | 2 | true |
| Matchday 7 | 24 | Completo | 5 | 144 | 11 | 10,6 | 18 | 2 | true |
| Matchday 7 | 24 | Núcleo ≥10 | 5 | 144 | 11 | 10,6 | 18 | 2 | true |
| Matchday 8 | 28 | Completo | 5 | 224 | 14 | 13,6 | 23 | 3 | true |
| Matchday 8 | 28 | Núcleo ≥10 | 6 | 133 | 10 | 9,8 | 21 | 1 | true |
| Matchday 9 | 32 | Completo | 6 | 332 | 18 | 17,4 | 26 | 5 | true |
| Matchday 9 | 32 | Núcleo ≥10 | 7 | 227 | 15 | 14,4 | 24 | 2 | true |
| Matchday 10 | 36 | Completo | 7 | 371 | 18 | 16,8 | 29 | 5 | true |
| Matchday 10 | 36 | Núcleo ≥10 | 8 | 253 | 15 | 13,8 | 24 | 3 | true |
| Matchday 11 | 40 | Completo | 7 | 485 | 20 | 19,2 | 43 | 7 | true |
| Matchday 11 | 40 | Núcleo ≥10 | 9 | 238 | 15 | 14,2 | 24 | 2 | true |
| Matchday 12 | 44 | Completo | 10 | 379 | 17 | 17,0 | 36 | 6 | true |
| Matchday 12 | 44 | Núcleo ≥10 | 11 | 270 | 15 | 14,6 | 24 | 3 | true |
| Matchday 13 | 48 | Completo | 11 | 472 | 23 | 21,0 | 21 | 6 | true |
| Matchday 13 | 48 | Núcleo ≥10 | 13 | 277 | 15 | 15,0 | 27 | 3 | true |
| Matchday 14 | 54 | Completo | 14 | 437 | 18 | 18,0 | 39 | 6 | true |
| Matchday 14 | 54 | Núcleo ≥10 | 16 | 252 | 14 | 13,4 | 25 | 2 | true |
| Matchday 15 | 60 | Completo | 15 | 481 | 19 | 19,0 | 36 | 8 | true |
| Matchday 15 | 60 | Núcleo ≥10 | 17 | 280 | 15 | 14,4 | 25 | 3 | true |
| Matchday 16 | 66 | Completo | 18 | 433 | 20 | 19,0 | 30 | 6 | true |
| Matchday 16 | 66 | Núcleo ≥10 | 20 | 262 | 15 | 14,4 | 28 | 2 | true |
| Matchday 17 | 72 | Completo | 20 | 452 | 20 | 19,8 | 29 | 6 | true |
| Matchday 17 | 72 | Núcleo ≥10 | 22 | 300 | 15 | 15,0 | 30 | 3 | true |
| Round of 32 | 88 | Completo | 25 | 488 | 20 | 20,0 | 31 | 7 | true |
| Round of 32 | 88 | Núcleo ≥10 | 29 | 251 | 13 | 12,4 | 28 | 2 | true |
| Round of 16 | 96 | Completo | 26 | 510 | 20 | 19,8 | 41 | 8 | true |
| Round of 16 | 96 | Núcleo ≥10 | 30 | 277 | 14 | 13,8 | 27 | 3 | true |
| Quarter-final | 100 | Completo | 27 | 476 | 19 | 19,0 | 38 | 8 | true |
| Quarter-final | 100 | Núcleo ≥10 | 31 | 256 | 13 | 12,6 | 32 | 2 | true |
| Semi-final | 102 | Completo | 27 | 477 | 19 | 19,0 | 38 | 8 | true |
| Semi-final | 102 | Núcleo ≥10 | 31 | 257 | 13 | 12,6 | 32 | 2 | true |
| Match for third place | 103 | Completo | 27 | 477 | 19 | 19,0 | 38 | 8 | true |
| Match for third place | 103 | Núcleo ≥10 | 31 | 257 | 13 | 12,6 | 32 | 2 | true |
| Final | 104 | Completo | 27 | 477 | 19 | 19,0 | 38 | 8 | true |
| Final | 104 | Núcleo ≥10 | 31 | 262 | 13 | 13,0 | 33 | 3 | true |

## 4. Série por rodada acumulada (p = 95, limiar recalculado a cada rodada)

| Rodada | Jogos acumulados | Recorte | Limiar | \|E\| | Clique máxima | Média top-5 | Panelas (≥3) | Tempo (ms) | Completou |
|---|---|---|---|---|---|---|---|---|---|
| Matchday 1 | 2 | Completo | 1 | 1 | 2 | 0,0 | 0 | 2 | true |
| Matchday 1 | 2 | Núcleo ≥10 | 1 | 1 | 2 | 0,0 | 0 | 0 | true |
| Matchday 2 | 4 | Completo | 1 | 4 | 3 | 3,0 | 1 | 2 | true |
| Matchday 2 | 4 | Núcleo ≥10 | 1 | 4 | 3 | 3,0 | 1 | 1 | true |
| Matchday 3 | 8 | Completo | 1 | 368 | 27 | 12,3 | 3 | 4 | true |
| Matchday 3 | 8 | Núcleo ≥10 | 1 | 123 | 16 | 9,5 | 2 | 1 | true |
| Matchday 4 | 12 | Completo | 3 | 45 | 8 | 5,2 | 5 | 1 | true |
| Matchday 4 | 12 | Núcleo ≥10 | 3 | 39 | 8 | 5,3 | 4 | 0 | true |
| Matchday 5 | 16 | Completo | 3 | 46 | 8 | 5,2 | 6 | 2 | true |
| Matchday 5 | 16 | Núcleo ≥10 | 3 | 40 | 8 | 4,8 | 5 | 0 | true |
| Matchday 6 | 20 | Completo | 5 | 60 | 7 | 6,2 | 9 | 2 | true |
| Matchday 6 | 20 | Núcleo ≥10 | 5 | 60 | 7 | 6,2 | 9 | 1 | true |
| Matchday 7 | 24 | Completo | 6 | 75 | 9 | 7,2 | 9 | 2 | true |
| Matchday 7 | 24 | Núcleo ≥10 | 6 | 75 | 9 | 7,2 | 9 | 1 | true |
| Matchday 8 | 28 | Completo | 6 | 133 | 10 | 9,8 | 21 | 3 | true |
| Matchday 8 | 28 | Núcleo ≥10 | 7 | 75 | 8 | 7,0 | 15 | 0 | true |
| Matchday 9 | 32 | Completo | 7 | 227 | 15 | 14,4 | 24 | 3 | true |
| Matchday 9 | 32 | Núcleo ≥10 | 9 | 97 | 9 | 8,2 | 14 | 1 | true |
| Matchday 10 | 36 | Completo | 8 | 253 | 15 | 13,8 | 24 | 4 | true |
| Matchday 10 | 36 | Núcleo ≥10 | 10 | 109 | 10 | 9,2 | 13 | 1 | true |
| Matchday 11 | 40 | Completo | 9 | 238 | 15 | 14,2 | 24 | 4 | true |
| Matchday 11 | 40 | Núcleo ≥10 | 11 | 110 | 10 | 9,8 | 13 | 1 | true |
| Matchday 12 | 44 | Completo | 11 | 270 | 15 | 14,6 | 24 | 4 | true |
| Matchday 12 | 44 | Núcleo ≥10 | 13 | 121 | 11 | 9,6 | 17 | 1 | true |
| Matchday 13 | 48 | Completo | 14 | 204 | 14 | 13,8 | 20 | 3 | true |
| Matchday 13 | 48 | Núcleo ≥10 | 16 | 105 | 10 | 9,0 | 13 | 1 | true |
| Matchday 14 | 54 | Completo | 16 | 252 | 14 | 13,4 | 25 | 4 | true |
| Matchday 14 | 54 | Núcleo ≥10 | 18 | 135 | 11 | 10,2 | 15 | 1 | true |
| Matchday 15 | 60 | Completo | 18 | 216 | 14 | 13,0 | 17 | 3 | true |
| Matchday 15 | 60 | Núcleo ≥10 | 19 | 156 | 11 | 10,6 | 18 | 2 | true |
| Matchday 16 | 66 | Completo | 20 | 262 | 15 | 14,4 | 28 | 4 | true |
| Matchday 16 | 66 | Núcleo ≥10 | 23 | 115 | 10 | 9,0 | 17 | 0 | true |
| Matchday 17 | 72 | Completo | 23 | 225 | 14 | 12,8 | 25 | 3 | true |
| Matchday 17 | 72 | Núcleo ≥10 | 25 | 133 | 10 | 9,2 | 21 | 1 | true |
| Round of 32 | 88 | Completo | 29 | 251 | 13 | 12,4 | 28 | 4 | true |
| Round of 32 | 88 | Núcleo ≥10 | 32 | 131 | 10 | 8,8 | 20 | 1 | true |
| Round of 16 | 96 | Completo | 30 | 277 | 14 | 13,8 | 27 | 3 | true |
| Round of 16 | 96 | Núcleo ≥10 | 34 | 128 | 9 | 8,2 | 21 | 1 | true |
| Quarter-final | 100 | Completo | 31 | 256 | 13 | 12,6 | 32 | 4 | true |
| Quarter-final | 100 | Núcleo ≥10 | 34 | 145 | 10 | 9,0 | 21 | 1 | true |
| Semi-final | 102 | Completo | 31 | 257 | 13 | 12,6 | 32 | 5 | true |
| Semi-final | 102 | Núcleo ≥10 | 34 | 145 | 10 | 9,0 | 21 | 1 | true |
| Match for third place | 103 | Completo | 31 | 257 | 13 | 12,6 | 32 | 4 | true |
| Match for third place | 103 | Núcleo ≥10 | 34 | 145 | 10 | 9,0 | 21 | 2 | true |
| Final | 104 | Completo | 31 | 262 | 13 | 13,0 | 33 | 4 | true |
| Final | 104 | Núcleo ≥10 | 35 | 121 | 10 | 8,4 | 19 | 1 | true |

