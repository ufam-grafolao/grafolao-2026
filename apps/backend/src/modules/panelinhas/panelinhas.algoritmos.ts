// Proposta 5 — Cliques e Panelinhas. Funções puras (sem Prisma), testáveis com grafos pequenos.
//
// Grafo de similaridade (não dirigido): vértices = participantes; peso entre dois
// participantes = número de jogos ENCERRADOS que os dois acertaram. Só vira aresta o
// par com peso ≥ limiar, e o limiar é o percentil p dos pesos positivos.
// Uma "panela" é uma clique maximal desse grafo: um grupo em que todos acertaram
// muitos jogos em comum com todos.

export const ORCAMENTO_PADRAO_MS = 30_000
export const PERCENTIL_PADRAO = 90
export const TAMANHO_MINIMO_PANELA = 3

// ─── Definição de acerto ──────────────────────────────────────────────────────
//
// Acerto = palpite com resultado certo (vencedor ou empate), ou seja, pontos > 0.
// Pelos status de palpites.regras.ts isso é ACERTO_PLACAR, ACERTO_VENCEDOR e
// ACERTO_BONUS. ACERTO_BONUS só existe no mata-mata: o participante palpitou empate,
// o jogo foi para os pênaltis e ele errou quem venceu nos pênaltis (10 pontos).
// O resultado do tempo normal estava certo, por isso conta como acerto por padrão;
// incluirBonus = false reproduz a definição da versão anterior (arquivo/cliques-paulo),
// que só contava ACERTO_PLACAR e ACERTO_VENCEDOR.

export type StatusPalpite = 'PENDENTE' | 'ACERTO_PLACAR' | 'ACERTO_VENCEDOR' | 'ACERTO_BONUS' | 'ERRO'

export function ehAcerto(status: StatusPalpite | string, incluirBonus = true): boolean {
  if (status === 'ACERTO_PLACAR' || status === 'ACERTO_VENCEDOR') return true
  return incluirBonus && status === 'ACERTO_BONUS'
}

export interface PalpiteAvaliado {
  usuarioId: string
  jogoId: string
  status: StatusPalpite | string
}

export interface OpcoesSimilaridade {
  incluirBonus?: boolean
  /**
   * Exclui jogos "óbvios": acertados por mais de `excluirAcimaDe` (fração 0–1) de quem
   * palpitou no jogo. undefined = sem filtro.
   */
  excluirAcimaDe?: number
}

/** Quem acertou cada jogo, já com o filtro de jogos óbvios aplicado. */
export function acertadoresPorJogo(
  palpites: PalpiteAvaliado[],
  opcoes: OpcoesSimilaridade = {}
): Map<string, string[]> {
  const { incluirBonus = true, excluirAcimaDe } = opcoes
  const palpiteiros = new Map<string, number>()
  const acertadores = new Map<string, string[]>()

  for (const p of palpites) {
    palpiteiros.set(p.jogoId, (palpiteiros.get(p.jogoId) ?? 0) + 1)
    if (ehAcerto(p.status, incluirBonus)) {
      acertadores.set(p.jogoId, [...(acertadores.get(p.jogoId) ?? []), p.usuarioId])
    }
  }

  if (excluirAcimaDe !== undefined) {
    for (const [jogoId, lista] of acertadores) {
      if (lista.length / (palpiteiros.get(jogoId) ?? 1) > excluirAcimaDe) acertadores.delete(jogoId)
    }
  }
  return acertadores
}

const chavePar = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

/** Peso de cada par = número de jogos que os dois acertaram. Pares com peso 0 não aparecem. */
export function pesosAcertosEmComum(acertadores: Map<string, string[]>): Map<string, number> {
  const pesos = new Map<string, number>()
  for (const lista of acertadores.values()) {
    const unicos = [...new Set(lista)]
    for (let i = 0; i < unicos.length; i++) {
      for (let j = i + 1; j < unicos.length; j++) {
        const chave = chavePar(unicos[i], unicos[j])
        pesos.set(chave, (pesos.get(chave) ?? 0) + 1)
      }
    }
  }
  return pesos
}

/**
 * Percentil pelo método do posto mais próximo (nearest-rank): o menor valor v tal que
 * pelo menos p% dos pesos são ≤ v. Sem pesos devolve Infinity (nenhuma aresta).
 */
export function limiarPercentil(pesos: number[], percentil: number): number {
  if (pesos.length === 0) return Infinity
  const ordenados = [...pesos].sort((a, b) => a - b)
  const p = Math.min(100, Math.max(0, percentil))
  const posto = Math.max(1, Math.ceil((p / 100) * ordenados.length))
  return ordenados[posto - 1]
}

export interface ArestaSimilaridade { a: string; b: string; peso: number }

export interface GrafoSimilaridade {
  vertices: string[]
  arestas: ArestaSimilaridade[]
  limiar: number
  /** Pesos positivos de todos os pares (antes do limiar), para inspecionar a distribuição. */
  pesos: number[]
}

/**
 * Grafo de similaridade restrito a `vertices`. Aresta se peso ≥ limiar (percentil p
 * dos pesos positivos entre os pares de `vertices`).
 */
export function construirGrafoSimilaridade(
  vertices: string[],
  palpites: PalpiteAvaliado[],
  percentil: number = PERCENTIL_PADRAO,
  opcoes: OpcoesSimilaridade = {}
): GrafoSimilaridade {
  const permitido = new Set(vertices)
  const pesosPorPar = pesosAcertosEmComum(
    acertadoresPorJogo(palpites.filter(p => permitido.has(p.usuarioId)), opcoes)
  )
  const pesos = [...pesosPorPar.values()]
  const limiar = limiarPercentil(pesos, percentil)

  const arestas: ArestaSimilaridade[] = []
  for (const [chave, peso] of pesosPorPar) {
    if (peso >= limiar) {
      const [a, b] = chave.split('|')
      arestas.push({ a, b, peso })
    }
  }
  arestas.sort((x, y) => x.a.localeCompare(y.a) || x.b.localeCompare(y.b))
  return { vertices: [...vertices].sort(), arestas, limiar, pesos }
}

// ─── Bron–Kerbosch com pivô e ordenação por degenerescência ──────────────────
//
// Enumera todas as cliques maximais (Eppstein, Löffler e Strash, 2010):
//   - laço externo na ordem de degenerescência (remove sempre o vértice de menor grau);
//     cada vértice v só procura cliques com vizinhos que vêm depois dele;
//   - dentro, Bron–Kerbosch com pivô de Tomita (o vértice de P ∪ X com mais vizinhos em P).
// Orçamento de tempo como no caminho mais longo: se estourar, devolve o que achou
// com completou = false.

export interface ResultadoCliques {
  cliques: string[][]
  completou: boolean
  tempoMs: number
}

function listaDeAdjacencia(vertices: string[], arestas: { a: string; b: string }[]) {
  const adj = new Map<string, Set<string>>(vertices.map(v => [v, new Set<string>()]))
  for (const { a, b } of arestas) {
    if (a === b || !adj.has(a) || !adj.has(b)) continue
    adj.get(a)!.add(b)
    adj.get(b)!.add(a)
  }
  return adj
}

/** Ordem de degenerescência. Empates de grau saem pela ordem de `vertices`. */
export function ordemDegenerescencia(vertices: string[], arestas: { a: string; b: string }[]): string[] {
  const adj = listaDeAdjacencia(vertices, arestas)
  const grau = new Map(vertices.map(v => [v, adj.get(v)!.size]))
  const restantes = new Set(vertices)
  const ordem: string[] = []

  while (restantes.size > 0) {
    let escolhido: string | undefined
    for (const v of restantes) {
      if (escolhido === undefined || grau.get(v)! < grau.get(escolhido)!) escolhido = v
    }
    ordem.push(escolhido!)
    restantes.delete(escolhido!)
    for (const u of adj.get(escolhido!)!) {
      if (restantes.has(u)) grau.set(u, grau.get(u)! - 1)
    }
  }
  return ordem
}

export function cliquesMaximais(
  vertices: string[],
  arestas: { a: string; b: string }[],
  orcamentoMs: number = ORCAMENTO_PADRAO_MS
): ResultadoCliques {
  const inicio = Date.now()
  const adj = listaDeAdjacencia(vertices, arestas)
  const cliques: string[][] = []
  let estourou = false

  function bronKerbosch(R: string[], P: Set<string>, X: Set<string>) {
    if (estourou) return
    if (Date.now() - inicio > orcamentoMs) { estourou = true; return }

    if (P.size === 0) {
      if (X.size === 0) cliques.push([...R].sort())
      return
    }

    // Pivô de Tomita: maximiza |P ∩ N(u)|, para ramificar só em P \ N(pivô).
    let pivo = ''
    let melhor = -1
    for (const u of [...P, ...X]) {
      let n = 0
      for (const w of adj.get(u)!) if (P.has(w)) n++
      if (n > melhor) { melhor = n; pivo = u }
    }

    for (const v of [...P].filter(v => !adj.get(pivo)!.has(v))) {
      const vizinhos = adj.get(v)!
      bronKerbosch(
        [...R, v],
        new Set([...P].filter(w => vizinhos.has(w))),
        new Set([...X].filter(w => vizinhos.has(w)))
      )
      if (estourou) return
      P.delete(v)
      X.add(v)
    }
  }

  const ordem = ordemDegenerescencia(vertices, arestas)
  const posicao = new Map(ordem.map((v, i) => [v, i]))
  for (const v of ordem) {
    if (estourou) break
    const P = new Set<string>()
    const X = new Set<string>()
    for (const u of adj.get(v)!) (posicao.get(u)! > posicao.get(v)! ? P : X).add(u)
    bronKerbosch([v], P, X)
  }

  // Ordem estável da saída: maior primeiro, depois pelos ids.
  cliques.sort((a, b) => b.length - a.length || a.join('|').localeCompare(b.join('|')))
  return { cliques, completou: !estourou, tempoMs: Date.now() - inicio }
}

// ─── Resumo das panelas ───────────────────────────────────────────────────────

export interface ResumoPanelas {
  /** Tamanho da clique máxima (0 sem vértices; 1 se não há arestas). */
  tamanhoMaximo: number
  /** Uma clique de tamanho máximo (a primeira na ordem estável). */
  cliqueMaxima: string[]
  /** Número de cliques maximais com tamanho ≥ tamanhoMinimo. */
  totalPanelas: number
  /** As k maiores panelas (tamanho ≥ tamanhoMinimo). */
  maioresPanelas: string[][]
  /** Tamanho médio das k maiores panelas (0 se não houver). */
  tamanhoMedioTopK: number
  /** Em quantas panelas (≥ tamanhoMinimo) cada participante aparece. Só quem aparece ao menos 1 vez. */
  panelasPorParticipante: Map<string, number>
}

export function resumirPanelas(
  cliques: string[][],
  k: number = 5,
  tamanhoMinimo: number = TAMANHO_MINIMO_PANELA
): ResumoPanelas {
  const ordenadas = [...cliques].sort((a, b) => b.length - a.length || a.join('|').localeCompare(b.join('|')))
  const panelas = ordenadas.filter(c => c.length >= tamanhoMinimo)
  const top = panelas.slice(0, Math.max(0, k))

  const porParticipante = new Map<string, number>()
  for (const panela of panelas) {
    for (const id of panela) porParticipante.set(id, (porParticipante.get(id) ?? 0) + 1)
  }

  return {
    tamanhoMaximo: ordenadas[0]?.length ?? 0,
    cliqueMaxima: ordenadas[0] ?? [],
    totalPanelas: panelas.length,
    maioresPanelas: top,
    tamanhoMedioTopK: top.length === 0 ? 0 : top.reduce((s, c) => s + c.length, 0) / top.length,
    panelasPorParticipante: porParticipante,
  }
}
