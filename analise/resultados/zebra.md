# Aventura da Zebra: sensibilidade da métrica de ousadia

Fonte: `data/*.csv` (exportação de produção de 2026-08-14). Gerado por `analise/zebra.ts` em 2026-11-23.
Jogos encerrados: 104. Palpites nesses jogos: 4181. Ousadia calculada só entre quem palpitou no jogo, com todos os palpiteiros (o recorte ≥10 só filtra o ranking).

## 1. Distribuição da ousadia por palpite

| Métrica | n | Média | p25 | Mediana | p75 | p90 | Máx | % zeros | Valores distintos |
|---|---|---|---|---|---|---|---|---|---|
| media | 4181 | 0,595 | 0,455 | 0,543 | 0,731 | 0,888 | 1,000 | 0,0% | 503 |
| mediana | 4181 | 0,655 | 0,500 | 0,500 | 1,000 | 1,000 | 1,000 | 0,0% | 3 |
| raridade | 4181 | 0,598 | 0,090 | 0,238 | 0,930 | 1,668 | 3,970 | 4,5% | 209 |

Spearman entre métricas, por palpite (mesmos palpites):

- media × mediana: 0,796
- media × raridade: 0,908
- mediana × raridade: 0,804

## 2a. Ranking do Índice de Zebra ordenado por soma (padrão)

### Completo (quem palpitou) (154 participantes)

| Par de métricas | Spearman (ranking inteiro) | Do top 10 da 1ª, quantos saem do top 10 da 2ª |
|---|---|---|
| media × mediana | 0,998 | 1 |
| media × raridade | 0,982 | 4 |
| mediana × raridade | 0,982 | 3 |

Top 10 por métrica (pseudônimos):

- media: user1 (300,5, 102 j), user5 (273,3, 87 j), user46 (263,3, 99 j), user6 (261,9, 96 j), user4 (249,1, 90 j), user26 (247,6, 99 j), user75 (230,5, 79 j), user91 (228,3, 85 j), user129 (223,5, 68 j), user3 (220,4, 87 j)
- mediana: user1 (330,8, 102 j), user5 (298,8, 87 j), user6 (289,5, 96 j), user46 (284,5, 99 j), user4 (275,5, 90 j), user26 (254,5, 99 j), user75 (252,3, 79 j), user129 (247,0, 68 j), user157 (246,5, 69 j), user91 (245,0, 85 j)
- raridade: user1 (215,8, 102 j), user5 (204,9, 87 j), user6 (203,4, 96 j), user46 (199,7, 99 j), user157 (192,4, 69 j), user129 (169,8, 68 j), user112 (165,0, 72 j), user4 (161,4, 90 j), user54 (160,6, 85 j), user177 (149,0, 62 j)

### Núcleo ≥10 (72 participantes)

| Par de métricas | Spearman (ranking inteiro) | Do top 10 da 1ª, quantos saem do top 10 da 2ª |
|---|---|---|
| media × mediana | 0,994 | 1 |
| media × raridade | 0,946 | 4 |
| mediana × raridade | 0,952 | 3 |

Top 10 por métrica (pseudônimos):

- media: user1 (300,5, 102 j), user5 (273,3, 87 j), user46 (263,3, 99 j), user6 (261,9, 96 j), user4 (249,1, 90 j), user26 (247,6, 99 j), user75 (230,5, 79 j), user91 (228,3, 85 j), user129 (223,5, 68 j), user3 (220,4, 87 j)
- mediana: user1 (330,8, 102 j), user5 (298,8, 87 j), user6 (289,5, 96 j), user46 (284,5, 99 j), user4 (275,5, 90 j), user26 (254,5, 99 j), user75 (252,3, 79 j), user129 (247,0, 68 j), user157 (246,5, 69 j), user91 (245,0, 85 j)
- raridade: user1 (215,8, 102 j), user5 (204,9, 87 j), user6 (203,4, 96 j), user46 (199,7, 99 j), user157 (192,4, 69 j), user129 (169,8, 68 j), user112 (165,0, 72 j), user4 (161,4, 90 j), user54 (160,6, 85 j), user177 (149,0, 62 j)

## 2b. Ranking do Índice de Zebra ordenado por média por jogo palpitado

### Completo (quem palpitou) (154 participantes)

| Par de métricas | Spearman (ranking inteiro) | Do top 10 da 1ª, quantos saem do top 10 da 2ª |
|---|---|---|
| media × mediana | 0,986 | 2 |
| media × raridade | 0,871 | 4 |
| mediana × raridade | 0,882 | 4 |

Top 10 por métrica (pseudônimos):

- media: user92 (6,1, 1 j), user15 (6,0, 2 j), user44 (5,9, 4 j), user142 (5,1, 1 j), user47 (4,9, 2 j), user166 (4,8, 4 j), user123 (4,1, 8 j), user100 (3,9, 4 j), user106 (3,8, 15 j), user151 (3,7, 8 j)
- mediana: user142 (7,0, 1 j), user92 (7,0, 1 j), user15 (6,8, 2 j), user44 (6,3, 4 j), user186 (5,0, 1 j), user47 (5,0, 2 j), user123 (4,7, 8 j), user166 (4,6, 4 j), user100 (4,3, 4 j), user116 (4,3, 2 j)
- raridade: user47 (16,8, 2 j), user92 (10,0, 1 j), user44 (9,2, 4 j), user48 (9,0, 4 j), user100 (8,1, 4 j), user15 (6,8, 2 j), user58 (6,2, 3 j), user172 (5,8, 3 j), user142 (5,2, 1 j), user64 (5,1, 16 j)

### Núcleo ≥10 (72 participantes)

| Par de métricas | Spearman (ranking inteiro) | Do top 10 da 1ª, quantos saem do top 10 da 2ª |
|---|---|---|
| media × mediana | 0,964 | 1 |
| media × raridade | 0,769 | 4 |
| mediana × raridade | 0,819 | 4 |

Top 10 por métrica (pseudônimos):

- media: user106 (3,8, 15 j), user64 (3,4, 16 j), user129 (3,3, 68 j), user177 (3,2, 62 j), user5 (3,1, 87 j), user157 (3,1, 69 j), user126 (3,1, 64 j), user36 (3,0, 63 j), user139 (3,0, 64 j), user1 (2,9, 102 j)
- mediana: user106 (4,2, 15 j), user129 (3,6, 68 j), user157 (3,6, 69 j), user64 (3,6, 16 j), user177 (3,5, 62 j), user36 (3,5, 63 j), user5 (3,4, 87 j), user156 (3,3, 63 j), user1 (3,2, 102 j), user126 (3,2, 64 j)
- raridade: user64 (5,1, 16 j), user106 (3,9, 15 j), user157 (2,8, 69 j), user129 (2,5, 68 j), user14 (2,4, 58 j), user177 (2,4, 62 j), user5 (2,4, 87 j), user28 (2,3, 21 j), user112 (2,3, 72 j), user10 (2,2, 12 j)

## 2c. Quanto a soma reflete o volume de palpites

- Completo (quem palpitou), media: Spearman(índice soma, jogos palpitados) = 0,950; Spearman(índice médio, jogos palpitados) = 0,384
- Completo (quem palpitou), mediana: Spearman(índice soma, jogos palpitados) = 0,946; Spearman(índice médio, jogos palpitados) = 0,415
- Completo (quem palpitou), raridade: Spearman(índice soma, jogos palpitados) = 0,923; Spearman(índice médio, jogos palpitados) = 0,526
- Núcleo ≥10, media: Spearman(índice soma, jogos palpitados) = 0,924; Spearman(índice médio, jogos palpitados) = 0,213
- Núcleo ≥10, mediana: Spearman(índice soma, jogos palpitados) = 0,918; Spearman(índice médio, jogos palpitados) = 0,248
- Núcleo ≥10, raridade: Spearman(índice soma, jogos palpitados) = 0,855; Spearman(índice médio, jogos palpitados) = 0,262

## 3. MST do grafo agregado (distância média nos jogos em comum)

| Recorte | Mín. jogos em comum | Vértices | Pares no grafo | Arestas da MST | Componentes | Peso total | Peso médio por aresta | Tempo (ms) |
|---|---|---|---|---|---|---|---|---|
| Completo (quem palpitou) | 1 | 154 | 6385 | 153 | 1 | 12,90 | 0,084 | 9 |
| Completo (quem palpitou) | 3 | 154 | 3586 | 110 | 44 | 34,19 | 0,311 | 6 |
| Completo (quem palpitou) | 5 | 154 | 2552 | 79 | 75 | 32,09 | 0,406 | 2 |
| Completo (quem palpitou) | 10 | 154 | 2101 | 71 | 83 | 31,32 | 0,441 | 2 |
| Núcleo ≥10 | 1 | 72 | 2457 | 71 | 1 | 25,76 | 0,363 | 2 |
| Núcleo ≥10 | 3 | 72 | 2390 | 71 | 1 | 29,01 | 0,409 | 2 |
| Núcleo ≥10 | 5 | 72 | 2310 | 71 | 1 | 30,13 | 0,424 | 1 |
| Núcleo ≥10 | 10 | 72 | 2101 | 71 | 1 | 31,32 | 0,441 | 1 |

