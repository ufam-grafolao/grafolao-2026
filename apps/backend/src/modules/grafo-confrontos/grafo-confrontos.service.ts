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
  gerarConfrontosDeAusenciaDosJogos,
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
  rodadas: string | string[] | undefined,
  idsPermitidos: Set<string> | undefined,
  considerarAusencia: boolean
): Promise<ConfrontoAgregado[]> {
  const filtroRodada =
    rodadas === undefined ? {} : { rodada: Array.isArray(rodadas) ? { in: rodadas } : rodadas }

  const where: Record<string, unknown> = rodadas === undefined ? {} : { jogo: filtroRodada }

  if (idsPermitidos) {
    const ids = Array.from(idsPermitidos)
    where.vencedorId = { in: ids }
    where.perdedorId = { in: ids }
  }

  const gravados = await prisma.confronto.findMany({
    where,
    select: { vencedorId: true, perdedorId: true },
  })

  // concat, e não push(...lista): com a regra são centenas de milhares de confrontos,
  // e espalhar isso como argumentos estoura a pilha ("Maximum call stack size exceeded").
  const confrontos = considerarAusencia
    ? gravados.concat(await confrontosDeAusencia(filtroRodada, idsPermitidos))
    : gravados

  // Ordem fixa (por id) para que os algoritmos que dependem da ordem de visita
  // (detecção de ciclos, caminho mais longo) deem sempre o mesmo resultado.
  return agregarSaldo(confrontos).sort(
    (a, b) => a.vencedorId.localeCompare(b.vencedorId) || a.perdedorId.localeCompare(b.perdedorId)
  )
}

/**
 * Confrontos de ausência (ver identificarAusentes): não ficam gravados na tabela
 * Confronto, são derivados na leitura a partir de jogos ENCERRADOS, palpites e
 * datas de cadastro. Assim a tabela continua guardando só palpite contra palpite
 * e "sem a regra" segue idêntico ao comportamento anterior.
 */
async function confrontosDeAusencia(
  filtroRodada: Record<string, unknown>,
  idsPermitidos?: Set<string>
): Promise<{ vencedorId: string; perdedorId: string }[]> {
  const ids = idsPermitidos ? Array.from(idsPermitidos) : undefined

  const jogos = await prisma.jogo.findMany({
    where: { status: 'ENCERRADO', ...filtroRodada },
    select: { id: true, dataHora: true },
  })
  const palpites = await prisma.palpite.findMany({
    where: { jogoId: { in: jogos.map(j => j.id) }, ...(ids ? { usuarioId: { in: ids } } : {}) },
    select: { id: true, usuarioId: true, jogoId: true },
  })
  const usuarios = await prisma.usuario.findMany({
    where: ids ? { id: { in: ids } } : {},
    select: { id: true, criadoEm: true },
  })

  return gerarConfrontosDeAusenciaDosJogos(jogos, palpites, usuarios)
    .map(({ vencedorId, perdedorId }) => ({ vencedorId, perdedorId }))
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

  for (let i = 0; i < rodadasOrdenadas.length; i++) {
    const rodadasAcumuladas = rodadasOrdenadas.slice(0, i + 1)
    const arestasAcumuladas = await agregarConfrontos(rodadasAcumuladas, undefined, considerarAusencia)
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
