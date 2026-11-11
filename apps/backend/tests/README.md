# Testes do backend

Este diretório protege as regras que mais importam no Grafolão: **pontuação dos palpites**, **bloqueio e limite de edições** e **construção e análise do grafo de confrontos**. Os testes não precisam de banco de dados nem de internet.

## O que é testado (e por quê)

| Área | Arquivo de teste | O que garante |
|---|---|---|
| Pontuação, grupos | `palpites/pontuacao-grupos.test.ts` | 10 / 5 / 5+2 / 0 e as bordas (0 a 0, goleada, empate com placar errado) |
| Pontuação, mata-mata | `palpites/pontuacao-mata-mata.test.ts` | Cada linha da tabela abaixo, incluindo pênaltis |
| Prazo e edições | `palpites/bloqueio-e-edicoes.test.ts` | Bloqueio no início do jogo (1 ms antes, exato, 1 ms depois) e limite de 2 edições |
| Arestas do grafo | `grafo-confrontos/arestas.test.ts` | Quem vence quem num jogo, empate sem aresta, saldo agregado por par |
| PageRank | `grafo-confrontos/pagerank.test.ts` | Soma 1 em grafo sem sorvedouro, ordem esperada e o comportamento atual com invicto |
| Ciclos | `grafo-confrontos/ciclos.test.ts` | Ciclos conhecidos em grafos pequenos e deduplicação |
| Caminho mais longo | `grafo-confrontos/caminho-mais-longo.test.ts` | Ótimo conhecido e `completou=false` quando o orçamento acaba |
| Configuração | `smoke.test.ts` | O Vitest roda TypeScript e importa módulos do backend |

**Por que unitários e sem banco:** as regras ficam em funções puras, que recebem dados e devolvem decisões. Elas foram separadas dos services (que falam com o Prisma) em:

- `src/modules/palpites/palpites.regras.ts`
- `src/modules/grafo-confrontos/grafo-confrontos.algoritmos.ts`

Os services continuam fazendo a leitura e a escrita no banco e chamam essas funções. O código das funções não mudou ao ser movido; só mudou de arquivo.

## Como rodar

```bash
cd apps/backend
npm test                # roda todos os testes uma vez
npm run test:watch      # reexecuta ao salvar
npm run test:coverage   # testes + cobertura (relatório no terminal e em coverage/index.html)
```

A cobertura é informativa: não há meta mínima. O relatório lista só os arquivos que os testes carregam.

## Como ler um teste

Todo teste segue Arrange / Act / Assert e o nome descreve o comportamento em português:

```ts
it('dá 10 pontos quando o placar é exato', () => {
  // Arrange
  const palpite = placar(2, 1)
  const resultado = placar(2, 1)

  // Act
  const pontuacao = calcularGrupos(palpite, resultado)

  // Assert
  expect(pontuacao).toEqual({ pontos: 10, status: 'ACERTO_PLACAR' })
})
```

- Comentários com **"Por que:"** explicam casos que não são óbvios.
- Testes de grafo trazem um **desenho** e o **resultado calculado à mão** no comentário. Uma aresta `user1 → user2` significa "user1 venceu user2".
- Os dados são sintéticos (`user1`, `user2`, ...). Nenhum dado real de participante entra nos testes.

## Regras de pontuação

### Fase de grupos

| Situação | Pontos |
|---|---|
| Placar exato | 10 (total, o bônus não se soma) |
| Resultado certo (vencedor ou empate), sem bônus | 5 |
| Resultado certo + gols de um dos times **ou** saldo de gols certo | 5 + 2 = 7 |
| Resultado errado | 0 |

O bônus de +2 vale no máximo uma vez, mesmo que gols e saldo coincidam, e só existe junto com o resultado certo. Um empate palpitado com outro placar (por exemplo 1 x 1 contra 2 x 2) leva 7, porque o saldo também coincide (0 = 0).

### Mata-mata (tabela completa)

Avaliada nesta ordem. "Pênaltis" significa que o jogo terminou empatado e foi decidido na disputa de pênaltis.

| # | Situação | Pontos | Status |
|---|---|---|---|
| 1 | Placar exato, jogo foi a pênaltis e acertou o vencedor dos pênaltis | 20 | `ACERTO_PLACAR` |
| 2 | Placar exato (jogo sem pênaltis, ou pênaltis com vencedor errado ou não informado) | 15 | `ACERTO_PLACAR` |
| 3 | Jogo foi a pênaltis e o palpite foi de vitória (não empate) | 0 | `ERRO` |
| 4 | Jogo foi a pênaltis, palpitou empate (outro placar) e acertou o vencedor dos pênaltis | 15 | `ACERTO_VENCEDOR` |
| 5 | Jogo foi a pênaltis, palpitou empate (outro placar) e errou o vencedor dos pênaltis | 10 | `ACERTO_BONUS` |
| 6 | Sem pênaltis, vencedor certo e gols de um time ou saldo certo | 10 | `ACERTO_VENCEDOR` |
| 7 | Sem pênaltis, vencedor certo, sem bônus | 7 | `ACERTO_VENCEDOR` |
| 8 | Sem pênaltis, vencedor errado ou palpitou empate | 0 | `ERRO` |

### Prazo e edições

- Só se palpita em jogo `AGENDADO`; `BLOQUEADO`, `EM_ANDAMENTO` e `ENCERRADO` recusam o palpite.
- O prazo termina no instante do início do jogo (`agora >= início`).
- **Deslocamento de +4 horas:** o banco guarda o horário local de Manaus (UTC-4) como se fosse UTC, vindo de `copa2026.utc4.json` pelo seed. O início real é o valor gravado + 4 horas. Esta explicação foi inferida do código (seed, scheduler); não há documentação dela.
- O palpite pode ser editado no máximo 2 vezes; a terceira alteração é recusada.

## Comportamento atual registrado

`pagerank.test.ts` tem um teste que **documenta o comportamento atual, não o desejado**: quando alguém nunca perdeu, sua pontuação não é redistribuída e a soma dos PageRanks fica abaixo de 1. Se isso for corrigido no futuro, esse teste deve falhar e ser substituído.
