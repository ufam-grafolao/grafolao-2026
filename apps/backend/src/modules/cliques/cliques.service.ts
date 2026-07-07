import { Prisma } from '@prisma/client';
import prisma from '../../db/prisma.js'

type Status = Prisma.PalpiteGetPayload<{}>['status'];

type Usuario = {
  id: string,
  nome: string,
  avatarUrl?: string,
}

type Jogo = {
  id: string,
  timeCasa: string | undefined,
  timeVisitante: string | undefined,
  golsCasa: number | undefined,
  golsVisitante: number | undefined,
}


/**
 * @brief Representa uma partição de um grafo bipartido.
 */
class Particao<I> {
  constructor(
    public readonly vertices: I[],
    public readonly vizinhos: Map<number, Set<number>> = new Map(),
    public R: Set<number> = new Set(),
    public P: Set<number> = new Set(),
    public X: Set<number> = new Set(),
  ) {
    this.vertices = vertices;
    this.vizinhos = vizinhos;
    this.R = R;
    this.P = P;
    this.X = X;
  }

  clone(): Particao<I> {
    return new Particao<I>(
      this.vertices,
      this.vizinhos,
      new Set(this.R),
      new Set(this.P),
      new Set(this.X),
    )
  }

  /**
   * @brief Cria outra partição tirando `u` (desta partição) do conjunto de candidatos `P` e adicionando-o ao conjunto maximal `R`.
   */
  semCandidato(u: number): Particao<I> {
    const R = new Set(this.R).add(u);
    const P = new Set(this.P);
    P.delete(u);

    return new Particao(
      this.vertices,
      this.vizinhos,
      R,
      P,
      new Set(this.X)
    );
  }

  /**
   * @brief Cria outra partição contendo apenas os vizinhos de `v` (de outra partição) do conjunto de candidatos `P` e no conjunto de já processados `X`
   */
  apenasVizinhosDe(v: number): Particao<I> {
    return new Particao(
      this.vertices,
      this.vizinhos,
      new Set(this.R),
      new Set([...this.P].filter(u => this.vizinhos.get(u)!.has(v))),
      new Set([...this.X].filter(u => this.vizinhos.get(u)!.has(v)))
    );
  }
}

const obterStatusWhere = (acertos: boolean) => ({
  in: (acertos ? ['ACERTO_PLACAR', 'ACERTO_VENCEDOR'] : ['PENDENTE', 'ERRO']) as Status[]
} as const);

/**
 * @brief Obtém as arestas de um grafo bipartido representando palpiteiros x jogos. Cada elemento do vetor é um jogo,
 * contendo os palpites dos usuários
 */
async function obterBipartido(acertos: boolean): Promise<[Particao<Usuario>, Particao<Jogo>]> {
  const STATUS_WHERE = obterStatusWhere(acertos);

  const [jogos, usuarios] = await prisma.$transaction([
    prisma.jogo.findMany({
      select: {
        id: true,
        timeCasa: { select: { nome: true } },
        timeVisitante: { select: { nome: true } },
        resultado: { select: { golsCasa: true, golsVisitante: true } },
        palpites: {
          select: { usuarioId: true },
          where: { status: STATUS_WHERE }
        },
      },
    }),

    prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        avatarUrl: true,
        palpites: {
          select: { jogoId: true, },
          where: { status: STATUS_WHERE }
        },
      },
    })
  ]);

  // Construir partição de Usuários
  const U = new Particao<Usuario>([]);
  for (let usuarioIndex = 0; usuarioIndex < usuarios.length; usuarioIndex++) {
    const usuario = usuarios[usuarioIndex];
    U.vertices.push({
      id: usuario.id,
      nome: usuario.nome,
      avatarUrl: usuario.avatarUrl ?? undefined
    });

    // Mapear jogos corretamente palpitados para índices
    U.vizinhos.set(
      usuarioIndex,
      new Set(usuario.palpites.map(palpite => jogos.findIndex(jogo => jogo.id === palpite.jogoId)))
    );
  }

  // Construir partição de Jogos
  const J = new Particao<Jogo>([]);
  for (let jogoIndex = 0; jogoIndex < jogos.length; jogoIndex++) {
    const jogo = jogos[jogoIndex];
    J.vertices.push({
      id: jogo.id,
      timeCasa: jogo.timeCasa?.nome,
      timeVisitante: jogo.timeVisitante?.nome,
      golsCasa: jogo.resultado?.golsCasa,
      golsVisitante: jogo.resultado?.golsVisitante
    });

    // Mapear usuários corretamente palpitados para índices
    J.vizinhos.set(
      jogoIndex,
      new Set(jogo.palpites.map(palpite => usuarios.findIndex(usuario => usuario.id === palpite.usuarioId)))
    );
  }

  return [U, J];
}

function testeMaximalidade<U, V>(
  U: Particao<U>,
  V: Particao<V>,
  cliques: [number[], number[]][]
) {
  // Terminam a recursão porém não formam bicliques maximais
  if (
    (U.P.size === 0 && U.R.size === 0) ||
    (V.P.size === 0 && V.R.size === 0) ||
    (U.P.size === 0 && V.X.size !== 0) ||
    (V.P.size === 0 && U.X.size !== 0)
  ) return true;

  // Terminam a recursão E formam bicliques maximais
  if (
    (U.P.size === 0 && U.X.size === 0) ||
    (V.P.size === 0 && V.X.size === 0)
  ) {
    cliques.push([[...U.R, ...U.P], [...V.R, ...V.P]]);
    return true;
  }

  return false;
}

/**
 * @brief Realiza uma escolha gulosa em U pelo vértice com maior grau (número de vizinhos em V).
 */
function escolherPivo<U, V>(U: Particao<U>, V: Particao<V>): number {
  const set = U.X.size !== 0 ? U.X : U.P;

  let [pivot, maxDegree] = [NaN, Number.NEGATIVE_INFINITY];

  for (const key of set) {
    let degree = 0;

    // Contar o número de vizinhos de `key` que são candidatos de V
    for (const neighbor of U.vizinhos.get(key)!) {
      if (V.P.has(neighbor))
        degree++;
    }

    if (degree > maxDegree)
      [pivot, maxDegree] = [key, degree];
  }

  return pivot;
}

/**
 * @brief Executa o algoritmo Bipartite Bron-Kerbosch, com uma mínima adaptação para evitar a enumeração de bicliques com apenas 1 vértice em um dos conjuntos.
 * @param U Partição U do grafo bipartido
 * @param V Partição V do grafo bipartido
 * @param cliques Lista de bicliques maximais encontrados correspondentes a tuplas [U, V].
 */
function bronKerboschBipartido<U, V>(
  U: Particao<U>,
  V: Particao<V>,
  cliques: [number[], number[]][]
) {
  // Adicionar R U P como um biclique maximal
  if (testeMaximalidade(U, V, cliques))
    return;

  // Escolher um pivô para reduzir recursões
  const pivoEmU = U.P.size > V.P.size;
  const pivo = pivoEmU ? escolherPivo(U, V) : escolherPivo(V, U);
  const pivoEmP = pivoEmU ? U.P.has(pivo) : V.P.has(pivo);

  // Filtrar candidatos a serem iterados evitando vizinhos do pivô para reduzir recursões
  let [itU, itV] = (
    pivoEmU ? [
      pivoEmP ? [pivo] : [],
      [...V.P].filter(j => !U.vizinhos.get(pivo)!.has(j))
    ] : [
      [...U.P].filter(u => !V.vizinhos.get(pivo)!.has(u)),
      pivoEmP ? [pivo] : [],
    ]
  );

  // Iterar sobre os candidatos em U
  for (const u of itU) {
    bronKerboschBipartido(
      U.semCandidato(u),
      V.apenasVizinhosDe(u),
      cliques
    );

    U.P.delete(u);
    U.X.add(u);
  }

  // Iterar sobre os candidatos em V
  for (const v of itV) {
    bronKerboschBipartido(
      U.apenasVizinhosDe(v),
      V.semCandidato(v),
      cliques
    );

    V.P.delete(v);
    V.X.add(v);
  }
}

export async function encontrarPanelinhasMaximais(acertos: boolean) {
  const [U, V] = await obterBipartido(acertos);

  // Iniciar conjuntos de candidatos com todos os vértices de cada partição
  U.P = new Set(Array.from({ length: U.vertices.length }, (_, index) => index));
  V.P = new Set(Array.from({ length: V.vertices.length }, (_, index) => index));

  // Enumerar todas as bicliques maximais
  const cliques: [number[], number[]][] = [];
  bronKerboschBipartido(U, V, cliques);

  return {
    usuarios: U.vertices,
    jogos: V.vertices,
    bicliques: cliques.sort((a, b) => b[0].length + b[1].length - a[0].length - a[1].length) // Ordenar por tamanho decrescente em arestas (|U| * |V|)
  }
}