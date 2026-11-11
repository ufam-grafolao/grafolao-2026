import prisma from '../../db/prisma.js'
import type {
  GrafoConfrontosResponse,
  CicloResponse,
  CaminhoMaisLongoResponse,
  EvolucaoRodadaResponse,
  ResultadoCaminhoMaisLongo,
} from './grafo-confrontos.schema.js'
import {
  ORCAMENTO_PADRAO_MS,
  agregarSaldo,
  calcularPageRank,
  caminhoMaisLongo,
  detectarCiclos,
  gerarConfrontosDoJogo,
} from './grafo-confrontos.algoritmos.js'
import type { ConfrontoAgregado } from './grafo-confrontos.algoritmos.js'
import { ordenarRodadasPorData } from '../../shared/utils/ordenar-rodadas.js'


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

  const novosConfrontos = gerarConfrontosDoJogo(palpites).map(c => ({ jogoId, ...c }))

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

  return agregarSaldo(confrontos)
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
  // A ordem das rodadas vem da data do primeiro jogo de cada uma (e não do nome,
  // pois "Matchday 10" vem antes de "Matchday 2" na ordem de texto).
  const jogos = await prisma.jogo.findMany({
    select: { rodada: true, dataHora: true, status: true },
  })

  const rodadasComJogoEncerrado = new Set(
    jogos.filter(j => j.status === 'ENCERRADO').map(j => j.rodada)
  )

  const usuarios = await buscarUsuariosFiltrados(0)
  const resultado: EvolucaoRodadaResponse[] = []

  const rodadasOrdenadas = ordenarRodadasPorData(jogos).filter(r => rodadasComJogoEncerrado.has(r))

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