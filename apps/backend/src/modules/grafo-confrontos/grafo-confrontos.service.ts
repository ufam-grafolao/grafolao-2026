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
  arestasDeConfrontos,
  gerarConfrontosDoJogo,
} from './grafo-confrontos.algoritmos.js'
import type { BaseConfrontos, ConfrontoAgregado } from './grafo-confrontos.algoritmos.js'
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
// LEITURA — o grafo é construído a partir dos PALPITES dos jogos encerrados
// (arestasDeConfrontos), e não da tabela Confronto. A tabela continua sendo
// gravada por construirConfrontosJogo, mas fica só como histórico: na
// exportação de 2026-08-14, 53 dos 104 jogos encerrados não tinham confrontos
// gravados, e o grafo lido dela ficava incompleto.
//
// O saldo segue a Equação 2 do artigo: w(vi, vj) = vit(vi->vj) - vit(vj->vi).
// Com minPalpites, as duas pontas precisam estar no recorte; senão arestas com
// quem está fora "contaminariam" o saldo de quem está dentro.
// ════════════════════════════════════════════════════════════════════════════

async function carregarBaseConfrontos(): Promise<BaseConfrontos> {
  const jogos = await prisma.jogo.findMany({
    where: { status: 'ENCERRADO' },
    select: { id: true, rodada: true, dataHora: true },
  })
  const [palpites, usuarios] = await Promise.all([
    prisma.palpite.findMany({
      where: { jogoId: { in: jogos.map(j => j.id) } },
      select: { id: true, usuarioId: true, jogoId: true, pontos: true },
    }),
    prisma.usuario.findMany({ select: { id: true, criadoEm: true } }),
  ])
  return { jogos, palpites, usuarios }
}

async function agregarConfrontos(
  rodada: string | undefined,
  idsPermitidos: Set<string> | undefined,
  considerarAusencia: boolean
): Promise<ConfrontoAgregado[]> {
  const base = await carregarBaseConfrontos()
  return arestasDeConfrontos(base, {
    rodadas: rodada === undefined ? undefined : [rodada],
    idsPermitidos,
    considerarAusencia,
  })
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
    orderBy: { id: 'asc' },
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
  minPalpites: number = 0,
  considerarAusencia: boolean = true
): Promise<GrafoConfrontosResponse> {
  const usuarios = await buscarUsuariosFiltrados(minPalpites)
  const vertices = usuarios.map(u => u.id)
  const idsPermitidos = minPalpites > 0 ? new Set(vertices) : undefined
  const arestas = await agregarConfrontos(rodada, idsPermitidos, considerarAusencia)

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
  minPalpites: number = 0,
  considerarAusencia: boolean = true
): Promise<CicloResponse[]> {
  const usuarios = await buscarUsuariosFiltrados(minPalpites)
  const mapaNomes = new Map(usuarios.map(u => [u.id, u.nome]))
  const vertices = usuarios.map(u => u.id)
  const idsPermitidos = minPalpites > 0 ? new Set(vertices) : undefined
  const arestas = await agregarConfrontos(rodada, idsPermitidos, considerarAusencia)

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
  minPalpites: number = 0,
  considerarAusencia: boolean = true
): Promise<CaminhoMaisLongoResponse> {
  const usuarios = await buscarUsuariosFiltrados(minPalpites)
  const mapaNomes = new Map(usuarios.map(u => [u.id, u.nome]))
  const vertices = usuarios.map(u => u.id)
  const idsPermitidos = minPalpites > 0 ? new Set(vertices) : undefined
  const arestas = await agregarConfrontos(rodada, idsPermitidos, considerarAusencia)

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
export async function buscarEvolucaoPorRodada(
  considerarAusencia: boolean = true
): Promise<EvolucaoRodadaResponse[]> {
  // A ordem das rodadas vem da data do primeiro jogo de cada uma (e não do nome,
  // pois "Matchday 10" vem antes de "Matchday 2" na ordem de texto).
  const jogos = await prisma.jogo.findMany({
    select: { rodada: true, dataHora: true, status: true },
  })

  const rodadasComJogoEncerrado = new Set(
    jogos.filter(j => j.status === 'ENCERRADO').map(j => j.rodada)
  )

  const usuarios = await buscarUsuariosFiltrados(0)
  const vertices = usuarios.map(u => u.id)
  const resultado: EvolucaoRodadaResponse[] = []

  const rodadasOrdenadas = ordenarRodadasPorData(jogos).filter(r => rodadasComJogoEncerrado.has(r))
  // Uma leitura só; cada rodada acumulada é recortada em memória.
  const base = await carregarBaseConfrontos()

  for (let i = 0; i < rodadasOrdenadas.length; i++) {
    const rodadasAcumuladas = rodadasOrdenadas.slice(0, i + 1)
    const arestasAcumuladas = arestasDeConfrontos(base, { rodadas: rodadasAcumuladas, considerarAusencia })
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
