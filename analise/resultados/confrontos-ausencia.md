# Grafo de Confrontos com e sem a regra da ausência

Fonte: `data/*.csv` (exportação de produção de 2026-08-14). Gerado por `analise/confrontos-ausencia.ts` em 2026-11-23.

- Jogos encerrados: 104. Sem confrontos gravados no CSV: 53. Base A usa 51.
- Densidade = |E| / (|V|·(|V|−1)), com |V| = todos os usuários do recorte (como na API).
- Ciclos: contagem da `detectarCiclos` (um ciclo por aresta de retorno da DFS), com vértices e arestas em ordem de id. Não é o total de ciclos simples e muda com a ordem.
- Publicado (coleta de produção de 2026-08-14): completo 197 / 3.235 / 8,38% / 1.228; núcleo 72 / 1.612 / 31,53% / 841.

| Base | Recorte | Regra da ausência | \|V\| | V com aresta | \|E\| | Densidade | Ciclos (DFS, ordem por id) |
|---|---|---|---|---|---|---|---|
| A. publicada | Completo | sem | 198 | 139 | 3.235 | 8,29% | 1.201 |
| A. publicada | Completo | com | 198 | 196 | 14.622 | 37,49% | 4.193 |
| A. publicada | Núcleo ≥10 | sem | 72 | 69 | 1.612 | 31,53% | 797 |
| A. publicada | Núcleo ≥10 | com | 72 | 72 | 2.431 | 47,55% | 1.352 |
| B. completa | Completo | sem | 198 | 154 | 4.222 | 10,82% | 1.822 |
| B. completa | Completo | com | 198 | 196 | 16.433 | 42,13% | 3.809 |
| B. completa | Núcleo ≥10 | sem | 72 | 72 | 2.177 | 42,59% | 1.156 |
| B. completa | Núcleo ≥10 | com | 72 | 72 | 2.528 | 49,45% | 849 |
