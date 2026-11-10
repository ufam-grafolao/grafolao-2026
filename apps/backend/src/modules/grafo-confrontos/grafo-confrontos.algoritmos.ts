import type { ResultadoCaminhoMaisLongo } from './grafo-confrontos.schema.js'

// Algoritmos de grafo puros (sem Prisma): recebem vértices e arestas e devolvem resultados.
// Ficam separados do service para poderem ser testados com grafos pequenos, sem banco.

export const ORCAMENTO_PADRAO_MS = 120_000 // 2 minutos

export interface ConfrontoAgregado {
  vencedorId: string
  perdedorId: string
  peso: number
}

// ════════════════════════════════════════════════════════════════════════════
// PAGERANK — implementação iterativa clássica
//
//   PR(v) = (1-d)/N + d * Σ_{u→v} PR(u) / L(u)
// ════════════════════════════════════════════════════════════════════════════

const DAMPING = 0.85
const MAX_ITERACOES = 100
const TOLERANCIA = 1e-6

export function calcularPageRank(
  vertices: string[],
  arestas: ConfrontoAgregado[]
): Map<string, number> {
  const N = vertices.length
  if (N === 0) return new Map()

  const apontaPara = new Map<string, string[]>()
  const grauSaida = new Map<string, number>()

  for (const v of vertices) {
    apontaPara.set(v, [])
    grauSaida.set(v, 0)
  }

  for (const { vencedorId, perdedorId } of arestas) {
    apontaPara.get(perdedorId)?.push(vencedorId)
    grauSaida.set(perdedorId, (grauSaida.get(perdedorId) ?? 0) + 1)
  }

  let pr = new Map<string, number>(vertices.map(v => [v, 1 / N]))

  for (let iter = 0; iter < MAX_ITERACOES; iter++) {
    const novoPr = new Map<string, number>()
    let diferencaMaxima = 0

    for (const v of vertices) {
      let soma = 0
      for (const perdedor of vertices) {
        const destinos = apontaPara.get(perdedor) ?? []
        if (destinos.includes(v)) {
          const grau = grauSaida.get(perdedor) ?? 1
          soma += (pr.get(perdedor) ?? 0) / grau
        }
      }

      const valor = (1 - DAMPING) / N + DAMPING * soma
      novoPr.set(v, valor)
      diferencaMaxima = Math.max(diferencaMaxima, Math.abs(valor - (pr.get(v) ?? 0)))
    }

    pr = novoPr
    if (diferencaMaxima < TOLERANCIA) break
  }

  return pr
}

// ════════════════════════════════════════════════════════════════════════════
// DETECÇÃO DE CICLOS — busca em profundidade (DFS) com pilha de recursão
// ════════════════════════════════════════════════════════════════════════════

export function detectarCiclos(
  vertices: string[],
  arestas: ConfrontoAgregado[]
): { participantesIds: string[] }[] {
  const adjacencia = new Map<string, string[]>()
  for (const v of vertices) adjacencia.set(v, [])
  for (const { vencedorId, perdedorId } of arestas) {
    adjacencia.get(vencedorId)?.push(perdedorId)
  }

  const cor = new Map<string, 'branco' | 'cinza' | 'preto'>(
    vertices.map(v => [v, 'branco'])
  )
  const pilha: string[] = []
  const ciclosEncontrados: { participantesIds: string[] }[] = []
  const ciclosUnicos = new Set<string>()

  function dfs(v: string) {
    cor.set(v, 'cinza')
    pilha.push(v)

    for (const vizinho of adjacencia.get(v) ?? []) {
      if (cor.get(vizinho) === 'branco') {
        dfs(vizinho)
      } else if (cor.get(vizinho) === 'cinza') {
        const indiceInicio = pilha.indexOf(vizinho)
        const cicloIds = pilha.slice(indiceInicio)

        const idsOrdenados = [...cicloIds].sort()
        const assinatura = idsOrdenados.join('|')

        if (!ciclosUnicos.has(assinatura) && cicloIds.length >= 3) {
          ciclosUnicos.add(assinatura)
          ciclosEncontrados.push({ participantesIds: cicloIds })
        }
      }
    }

    pilha.pop()
    cor.set(v, 'preto')
  }

  for (const v of vertices) {
    if (cor.get(v) === 'branco') dfs(v)
  }

  return ciclosEncontrados
}

// ════════════════════════════════════════════════════════════════════════════
// CAMINHO MAIS LONGO — busca exaustiva com poda (branch and bound) e
// orçamento de tempo (estratégia anytime)
// ════════════════════════════════════════════════════════════════════════════

export function caminhoMaisLongo(
  vertices: string[],
  arestas: ConfrontoAgregado[],
  orcamentoMs: number = ORCAMENTO_PADRAO_MS
): ResultadoCaminhoMaisLongo {
  const adjacencia = new Map<string, string[]>()
  for (const v of vertices) adjacencia.set(v, [])
  for (const { vencedorId, perdedorId } of arestas) {
    adjacencia.get(vencedorId)?.push(perdedorId)
  }

  let melhorCaminho: string[] = []
  const inicio = Date.now()
  let estourouOrcamento = false

  function dfs(atual: string, visitados: Set<string>, caminho: string[]) {
    if (estourouOrcamento) return

    if (Date.now() - inicio > orcamentoMs) {
      estourouOrcamento = true
      return
    }

    if (caminho.length > melhorCaminho.length) {
      melhorCaminho = [...caminho]
    }

    for (const vizinho of adjacencia.get(atual) ?? []) {
      if (estourouOrcamento) return
      if (!visitados.has(vizinho)) {
        visitados.add(vizinho)
        caminho.push(vizinho)
        dfs(vizinho, visitados, caminho)
        caminho.pop()
        visitados.delete(vizinho)
      }
    }
  }

  const verticesComSaida = vertices.filter(
    v => (adjacencia.get(v)?.length ?? 0) > 0
  )

  for (const inicioVertice of verticesComSaida) {
    if (estourouOrcamento) break
    dfs(inicioVertice, new Set([inicioVertice]), [inicioVertice])
  }

  return {
    caminhoIds: melhorCaminho,
    completou: !estourouOrcamento,
    tempoMs: Date.now() - inicio,
  }
}


// ════════════════════════════════════════════════════════════════════════════
// FUNÇÕES PURAS EXTRAÍDAS DO SERVICE (mesma lógica, agora sem Prisma)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Compara, dois a dois, os palpites de um mesmo jogo.
 * p(vi) > p(vj) => aresta vi -> vj; empate de pontos => nenhuma aresta.
 */
export function gerarConfrontosDoJogo(
  palpites: { id: string; usuarioId: string; pontos: number }[]
): { vencedorId: string; perdedorId: string; palpiteId: string }[] {
  const confrontos: { vencedorId: string; perdedorId: string; palpiteId: string }[] = []

  for (let i = 0; i < palpites.length; i++) {
    for (let j = i + 1; j < palpites.length; j++) {
      const a = palpites[i]
      const b = palpites[j]

      if (a.pontos === b.pontos) continue

      const vencedor = a.pontos > b.pontos ? a : b
      const perdedor = a.pontos > b.pontos ? b : a

      confrontos.push({
        vencedorId: vencedor.usuarioId,
        perdedorId: perdedor.usuarioId,
        palpiteId: vencedor.id,
      })
    }
  }

  return confrontos
}

/**
 * Agrega confrontos brutos no saldo por par: w(vi, vj) = vit(vi->vj) - vit(vj->vi).
 * Só gera aresta quando o saldo é diferente de zero, apontando do vencedor líquido.
 */
export function agregarSaldo(
  confrontos: { vencedorId: string; perdedorId: string }[]
): ConfrontoAgregado[] {
  const contagem = new Map<string, number>()

  for (const c of confrontos) {
    const chave = `${c.vencedorId}::${c.perdedorId}`
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
  }

  const paresProcessados = new Set<string>()
  const agregados: ConfrontoAgregado[] = []

  for (const [chave] of contagem) {
    const [a, b] = chave.split('::')
    const parId = [a, b].sort().join('::')
    if (paresProcessados.has(parId)) continue
    paresProcessados.add(parId)

    const vitoriasAB = contagem.get(`${a}::${b}`) ?? 0
    const vitoriasBA = contagem.get(`${b}::${a}`) ?? 0
    const saldo = vitoriasAB - vitoriasBA

    if (saldo > 0) {
      agregados.push({ vencedorId: a, perdedorId: b, peso: saldo })
    } else if (saldo < 0) {
      agregados.push({ vencedorId: b, perdedorId: a, peso: -saldo })
    }
  }

  return agregados
}
