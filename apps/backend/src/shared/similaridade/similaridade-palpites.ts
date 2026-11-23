// Similaridade entre palpites de um MESMO jogo. Base compartilhada pelas propostas que
// comparam palpites entre si (1: redes de similaridade, 3: Aventura da Zebra,
// 5: panelinhas). Funções puras, sem Prisma.
//
// Distância entre dois palpites no mesmo jogo:
//   0    placar idêntico                                  (2×1 e 2×1)
//   0,5  mesmo resultado (vencedor ou empate), placar diferente (2×1 e 3×0; 1×1 e 0×0)
//   1    resultado diferente                              (2×1 e 1×1)
// Só entra quem palpitou no jogo: não existe distância para quem não palpitou.

export type Resultado = 'CASA' | 'EMPATE' | 'VISITANTE'

export interface Placar {
  golsCasa: number
  golsVisitante: number
}

export function resultadoDoPlacar({ golsCasa, golsVisitante }: Placar): Resultado {
  if (golsCasa > golsVisitante) return 'CASA'
  if (golsCasa < golsVisitante) return 'VISITANTE'
  return 'EMPATE'
}

export function distanciaPalpites(a: Placar, b: Placar): 0 | 0.5 | 1 {
  if (a.golsCasa === b.golsCasa && a.golsVisitante === b.golsVisitante) return 0
  return resultadoDoPlacar(a) === resultadoDoPlacar(b) ? 0.5 : 1
}

export interface PalpiteComPlacar extends Placar {
  usuarioId: string
}

export interface ParDistancia {
  a: string
  b: string
  peso: number
}

/** Grafo completo entre os palpiteiros de um jogo: uma aresta por par, peso = distância. */
export function grafoCompletoDoJogo(palpites: PalpiteComPlacar[]): ParDistancia[] {
  const pares: ParDistancia[] = []
  for (let i = 0; i < palpites.length; i++) {
    for (let j = i + 1; j < palpites.length; j++) {
      const [x, y] = palpites[i].usuarioId < palpites[j].usuarioId
        ? [palpites[i], palpites[j]] : [palpites[j], palpites[i]]
      pares.push({ a: x.usuarioId, b: y.usuarioId, peso: distanciaPalpites(x, y) })
    }
  }
  return pares
}

/** Distâncias de cada palpiteiro para todos os outros do mesmo jogo. */
export function distanciasAosDemais(palpites: PalpiteComPlacar[]): Map<string, number[]> {
  const mapa = new Map<string, number[]>(palpites.map(p => [p.usuarioId, []]))
  for (let i = 0; i < palpites.length; i++) {
    for (let j = i + 1; j < palpites.length; j++) {
      const d = distanciaPalpites(palpites[i], palpites[j])
      mapa.get(palpites[i].usuarioId)!.push(d)
      mapa.get(palpites[j].usuarioId)!.push(d)
    }
  }
  return mapa
}

/**
 * Distância média entre pares nos jogos em comum (grafo AGREGADO).
 * Recebe os palpites agrupados por jogo. Pares que nunca palpitaram o mesmo jogo
 * não aparecem; `jogosEmComum` permite filtrar pares com pouca evidência.
 */
export function distanciaMediaAgregada(
  palpitesPorJogo: PalpiteComPlacar[][]
): { a: string; b: string; peso: number; jogosEmComum: number }[] {
  const soma = new Map<string, { total: number; jogos: number }>()
  for (const palpites of palpitesPorJogo) {
    for (const { a, b, peso } of grafoCompletoDoJogo(palpites)) {
      const chave = `${a}|${b}`
      const atual = soma.get(chave) ?? { total: 0, jogos: 0 }
      atual.total += peso
      atual.jogos += 1
      soma.set(chave, atual)
    }
  }
  return [...soma.entries()].map(([chave, { total, jogos }]) => {
    const [a, b] = chave.split('|')
    return { a, b, peso: total / jogos, jogosEmComum: jogos }
  })
}
