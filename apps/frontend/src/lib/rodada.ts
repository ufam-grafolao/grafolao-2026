export const RODADAS: Record<string, string> = {
  'Matchday 1': 'Rodada 1',
  'Matchday 2': 'Rodada 1',
  'Matchday 3': 'Rodada 1',
  'Matchday 4': 'Rodada 1',
  'Matchday 5': 'Rodada 1',
  'Matchday 6': 'Rodada 1',
  'Matchday 7': 'Rodada 1',
  'Matchday 8': 'Rodada 2',
  'Matchday 9': 'Rodada 2',
  'Matchday 10': 'Rodada 2',
  'Matchday 11': 'Rodada 2',
  'Matchday 12': 'Rodada 2',
  'Matchday 13': 'Rodada 2',
  'Matchday 14': 'Rodada 3',
  'Matchday 15': 'Rodada 3',
  'Matchday 16': 'Rodada 3',
  'Matchday 17': 'Rodada 3',
}

export const getRodada = (fase: string, matchday?: string) => {
  if (fase === 'GRUPOS' && matchday) {
    const rodada = RODADAS[matchday]
    if (rodada) return rodada
  }
  return fase
}