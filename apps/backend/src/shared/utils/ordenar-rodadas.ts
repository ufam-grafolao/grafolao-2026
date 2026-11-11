/**
 * Ordena as rodadas em ordem cronológica: da rodada cuja partida mais cedo
 * acontece primeiro até a que acontece por último.
 *
 * Por que não ordenar o nome: "Matchday 10" vem antes de "Matchday 2" quando
 * se compara texto. A ordem correta é a da data do primeiro jogo de cada rodada.
 * Como as fases de mata-mata acontecem depois da fase de grupos, elas saem
 * naturalmente depois pela data.
 *
 * Em caso de empate na data do primeiro jogo, desempata pelo nome com
 * comparação numérica ("Matchday 2" antes de "Matchday 10"), para o resultado
 * ser sempre o mesmo.
 */
export function ordenarRodadasPorData(
  jogos: { rodada: string; dataHora: Date }[]
): string[] {
  const primeiroJogo = new Map<string, number>()

  for (const { rodada, dataHora } of jogos) {
    const instante = dataHora.getTime()
    const atual = primeiroJogo.get(rodada)
    if (atual === undefined || instante < atual) primeiroJogo.set(rodada, instante)
  }

  return [...primeiroJogo.entries()]
    .sort(([nomeA, dataA], [nomeB, dataB]) =>
      dataA - dataB || nomeA.localeCompare(nomeB, 'en', { numeric: true })
    )
    .map(([rodada]) => rodada)
}
