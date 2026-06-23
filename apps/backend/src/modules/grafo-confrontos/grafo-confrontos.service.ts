import prisma from '../../db/prisma.js'
import type {
  GrafoConfrontosResponse,
  CicloResponse,
  CaminhoMaisLongoResponse,
  EvolucaoRodadaResponse,
  ResultadoCaminhoMaisLongo,
} from './grafo-confrontos.schema.js'

const ORCAMENTO_PADRAO_MS = 120_000 // 2 minutos

/**
 * Constrói os confrontos referentes a um jogo específico.
 * Para cada par de participantes que palpitaram o jogo, compara a pontuação
 * obtida e cria/atualiza a relação de confronto (vencedor -> perdedor).
 *
 * Critério: p_k(vi) > p_k(vj)  =>  vi venceu vj no jogo k
 *           p_k(vi) = p_k(vj)  =>  nenhuma relação é criada
 */
export async function construirConfrontosJogo(jogoId: string) {
  const palpites = await prisma.palpite.findMany({
    where: { jogoId },
    select: { id: true, usuarioId: true, pontos: true },
  })

  await prisma.confronto.deleteMany({ where: { jogoId } })

  const novosConfrontos: {
    jogoId: string
    vencedorId: string
    perdedorId: string
    palpiteId: string
  }[] = []

  for (let i = 0; i < palpites.length; i++) {
    for (let j = i + 1; j < palpites.length; j++) {
      const a = palpites[i]
      const b = palpites[j]

      if (a.pontos === b.pontos) continue

      const vencedor = a.pontos > b.pontos ? a : b
      const perdedor = a.pontos > b.pontos ? b : a

      novosConfrontos.push({
        jogoId,
        vencedorId: vencedor.usuarioId,
        perdedorId: perdedor.usuarioId,
        palpiteId: vencedor.id,
      })
    }
  }

  if (novosConfrontos.length > 0) {
    await prisma.confronto.createMany({ data: novosConfrontos })
  }

  return { confrontosCriados: novosConfrontos.length }
}

// ════════════════════════════════════════════════════════════════════════════
// AGREGAÇÃO — calcula o saldo de confrontos (peso das arestas) a partir
// dos confrontos brutos por jogo, conforme a Equação 2 do artigo:
//   w(vi, vj) = vit(vi->vj) - vit(vj->vi)
//
// Aceita um conjunto opcional de IDs permitidos (idsPermitidos) para
// restringir a agregação ao subconjunto filtrado de participantes — usado
// pela análise "com poda" (minPalpites). Sem esse filtro nas duas pontas
// (vencedorId E perdedorId), arestas envolvendo usuários fora do filtro
// "contaminariam" o saldo calculado para quem está dentro.
// ════════════════════════════════════════════════════════════════════════════

interface ConfrontoAgregado {
  vencedorId: string
  perdedorId: string
  peso: number
}

async function agregarConfrontos(
  rodada?: string,
  idsPermitidos?: Set<string>
): Promise<ConfrontoAgregado[]> {
  const where: Record<string, unknown> = rodada
    ? { jogo: { rodada } }
    : {}

  if (idsPermitidos) {
    const ids = Array.from(idsPermitidos)
    where.vencedorId = { in: ids }
    where.perdedorId = { in: ids }
  }

  const confrontos = await prisma.confronto.findMany({
    where,
    select: { vencedorId: true, perdedorId: true },
  })

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

// ════════════════════════════════════════════════════════════════════════════
// PAGERANK — implementação iterativa clássica
//
//   PR(v) = (1-d)/N + d * Σ_{u→v} PR(u) / L(u)
// ════════════════════════════════════════════════════════════════════════════

const DAMPING = 0.85
const MAX_ITERACOES = 100
const TOLERANCIA = 1e-6

function calcularPageRank(
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

function detectarCiclos(
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

function caminhoMaisLongo(
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
// FUNÇÕES PÚBLICAS — usadas pelo controller
// ════════════════════════════════════════════════════════════════════════════

/**
 * Busca usuários, opcionalmente filtrando por número mínimo de palpites
 * registrados (estratégia de "poda" para reduzir ruído estatístico de
 * arestas baseadas em pouquíssimos confrontos diretos — ver Seção 2 do
 * artigo). minPalpites = 0 (padrão) retorna todos os usuários, sem filtro.
 */
async function buscarUsuariosFiltrados(minPalpites: number = 0) {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      avatarUrl: true,
      _count: { select: { palpites: true } },
    },
  })

  return usuarios
    .filter(u => u._count.palpites >= minPalpites)
    .map(u => ({ id: u.id, nome: u.nome, avatarUrl: u.avatarUrl }))
}

export async function buscarGrafoConfrontos(
  rodada?: string,
  minPalpites: number = 0
): Promise<GrafoConfrontosResponse> {
  const usuarios = await buscarUsuariosFiltrados(minPalpites)
  const vertices = usuarios.map(u => u.id)
  const idsPermitidos = minPalpites > 0 ? new Set(vertices) : undefined
  const arestas = await agregarConfrontos(rodada, idsPermitidos)

  const pageRankMap = calcularPageRank(vertices, arestas)

  const nos = usuarios
    .map(u => ({
      id: u.id,
      nome: u.nome,
      avatarUrl: u.avatarUrl,
      pageRank: pageRankMap.get(u.id) ?? 0,
      posicao: 0,
    }))
    .sort((a, b) => b.pageRank - a.pageRank)
    .map((n, i) => ({ ...n, posicao: i + 1 }))

  return {
    nos,
    arestas: arestas.map(a => ({
      origem: a.vencedorId,
      destino: a.perdedorId,
      peso: a.peso,
    })),
    totalConfrontos: arestas.length,
    rodada: rodada ?? null,
  }
}

export async function buscarCiclos(
  rodada?: string,
  minPalpites: number = 0
): Promise<CicloResponse[]> {
  const usuarios = await buscarUsuariosFiltrados(minPalpites)
  const mapaNomes = new Map(usuarios.map(u => [u.id, u.nome]))
  const vertices = usuarios.map(u => u.id)
  const idsPermitidos = minPalpites > 0 ? new Set(vertices) : undefined
  const arestas = await agregarConfrontos(rodada, idsPermitidos)

  const ciclos = detectarCiclos(vertices, arestas)
  console.log(`Ciclos encontrados: ${ciclos.length}`)

  return ciclos.map(c => ({
    participantes: c.participantesIds.map(id => mapaNomes.get(id) ?? id),
    tamanho: c.participantesIds.length,
  }))
}

export async function buscarCaminhoMaisLongo(
  rodada?: string,
  orcamentoMs?: number,
  minPalpites: number = 0
): Promise<CaminhoMaisLongoResponse> {
  const usuarios = await buscarUsuariosFiltrados(minPalpites)
  const mapaNomes = new Map(usuarios.map(u => [u.id, u.nome]))
  const vertices = usuarios.map(u => u.id)
  const idsPermitidos = minPalpites > 0 ? new Set(vertices) : undefined
  const arestas = await agregarConfrontos(rodada, idsPermitidos)

  const { caminhoIds, completou, tempoMs } = caminhoMaisLongo(
    vertices,
    arestas,
    orcamentoMs ?? ORCAMENTO_PADRAO_MS
  )

  return {
    participantes: caminhoIds.map(id => mapaNomes.get(id) ?? id),
    tamanho: caminhoIds.length,
    completou,
    tempoMs,
  }
}

/**
 * Calcula a evolução do PageRank rodada a rodada (G_1 ⊆ G_2 ⊆ ... ⊆ G_T),
 * para gerar gráficos de evolução temporal (bônus — Critério 06).
 */
export async function buscarEvolucaoPorRodada(): Promise<EvolucaoRodadaResponse[]> {
  const rodadasDistintas = await prisma.jogo.findMany({
    where: { status: 'ENCERRADO' },
    select: { rodada: true },
    distinct: ['rodada'],
    orderBy: { rodada: 'asc' },
  })

  const usuarios = await buscarUsuariosFiltrados(0)
  const resultado: EvolucaoRodadaResponse[] = []

  const rodadasOrdenadas = rodadasDistintas.map(r => r.rodada)

  for (let i = 0; i < rodadasOrdenadas.length; i++) {
    const rodadasAcumuladas = rodadasOrdenadas.slice(0, i + 1)

    const confrontos = await prisma.confronto.findMany({
      where: { jogo: { rodada: { in: rodadasAcumuladas } } },
      select: { vencedorId: true, perdedorId: true },
    })

    const contagem = new Map<string, number>()
    for (const c of confrontos) {
      const chave = `${c.vencedorId}::${c.perdedorId}`
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
    }

    const paresProcessados = new Set<string>()
    const arestasAcumuladas: ConfrontoAgregado[] = []

    for (const [chave] of contagem) {
      const [a, b] = chave.split('::')
      const parId = [a, b].sort().join('::')
      if (paresProcessados.has(parId)) continue
      paresProcessados.add(parId)

      const vitoriasAB = contagem.get(`${a}::${b}`) ?? 0
      const vitoriasBA = contagem.get(`${b}::${a}`) ?? 0
      const saldo = vitoriasAB - vitoriasBA

      if (saldo > 0) arestasAcumuladas.push({ vencedorId: a, perdedorId: b, peso: saldo })
      else if (saldo < 0) arestasAcumuladas.push({ vencedorId: b, perdedorId: a, peso: -saldo })
    }

    const vertices = usuarios.map(u => u.id)
    const pageRankMap = calcularPageRank(vertices, arestasAcumuladas)

    const ranking = usuarios
      .map(u => ({
        usuarioId: u.id,
        nome: u.nome,
        pageRank: pageRankMap.get(u.id) ?? 0,
        posicao: 0,
      }))
      .sort((a, b) => b.pageRank - a.pageRank)
      .map((r, idx) => ({ ...r, posicao: idx + 1 }))

    resultado.push({ rodada: rodadasOrdenadas[i], ranking })
  }

  return resultado
}