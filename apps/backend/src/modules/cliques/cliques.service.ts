import { Prisma } from '@prisma/client';
import prisma from '../../db/prisma.js'

type Status = Prisma.PalpiteGetPayload<{}>['status'];

type Usuario = {
  nome: string,
  avatarUrl?: string,
}

/**
 * @brief Estrutura de dados para representar os acertos dos palpiteiros em cada jogo.
 */
class Bipartido {
  constructor(
    public readonly usuarios: {
      // Objeto que indexa usuários por ID e devolve os jogos que ele acertou/errou, e alguns dados do usuário.
      [id: string]: Usuario;
    },
    public readonly conjuntoUsuarios: Set<string>,
    public readonly conjuntoJogos: Map<string, Set<string>>,
    public readonly jogosPorUsuario: Map<string, Set<string>>,
  ) {
    this.usuarios = usuarios;
    this.conjuntoUsuarios = conjuntoUsuarios;
    this.conjuntoJogos = conjuntoJogos;
    this.jogosPorUsuario = jogosPorUsuario;
  }

  // Verifica se há uma aresta entre o usuário `u` e o jogo `j`.
  aresta(u: string, j: string): boolean {
    return this.conjuntoJogos.get(j)?.has(u) ?? false;
  };
};

const obterStatusWhere = (acertos: boolean) => ({
  in: (acertos ? ['ACERTO_PLACAR', 'ACERTO_VENCEDOR'] : ['PENDENTE', 'ERRO']) as Status[]
} as const);

/**
 * @brief Obtém as arestas de um grafo bipartido representando palpiteiros x jogos. Cada elemento do vetor é um jogo,
 * contendo os palpites dos usuários
 */
async function obterBipartido(acertos: boolean): Promise<Bipartido> {
  const STATUS_WHERE = obterStatusWhere(acertos);

  const [jogos, usuarios] = await prisma.$transaction([
    prisma.jogo.findMany({
      select: {
        id: true,
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

  return new Bipartido(
    Object.fromEntries(
      usuarios.map(usuario => [
        usuario.id,
        { nome: usuario.nome, avatarUrl: usuario.avatarUrl ?? undefined }
      ])
    ),
    new Set(usuarios.map(usuario => usuario.id)),
    new Map(jogos.map(jogo => [jogo.id, new Set(jogo.palpites.map(palpite => palpite.usuarioId))])),
    new Map(usuarios.map(usuario => [
      usuario.id,
      new Set(usuario.palpites.map(palpite => palpite.jogoId))
    ])),
  );
}

class Particao {
  constructor(
    public readonly ids: Set<string>,
    public readonly vizinhos: Map<string, Set<string>>,
    public readonly R: Set<string>,
    public readonly P: Set<string>,
    public readonly X: Set<string>,
  ) {
    this.ids = ids;
    this.vizinhos = vizinhos;
    this.R = R;
    this.P = P;
    this.X = X;
  }

  clone(): Particao {
    return new Particao(
      this.ids,
      this.vizinhos,
      new Set(this.R),
      new Set(this.P),
      new Set(this.X),
    )
  }

  /**
   * @brief Cria outra partição tirando `u` (desta partição) do conjunto de candidatos `P` e adicionando-o ao conjunto maximal `R`.
   */
  semCandidato(u: string): Particao {
    const R = new Set(this.R).add(u);
    const P = new Set(this.P);
    P.delete(u);

    return new Particao(
      this.ids,
      this.vizinhos,
      R,
      P,
      new Set(this.X)
    );
  }

  /**
   * @brief Cria outra partição contendo apenas os vizinhos de `v` (de outra partição) do conjunto de candidatos `P` e no conjunto de já processados `X`
   */
  apenasVizinhosDe(v: string): Particao {
    return new Particao(
      this.ids,
      this.vizinhos,
      new Set(this.R),
      new Set([...this.P].filter(u => this.vizinhos.get(u)!.has(v))),
      new Set([...this.X].filter(u => this.vizinhos.get(u)!.has(v)))
    );
  }
}

function testeMaximalidade(
  U: Particao,
  V: Particao,
  cliques: [string[], string[]][]
) {
  if (
    (U.P.size === 0 && U.R.size === 0) ||
    (V.P.size === 0 && V.R.size === 0) ||
    (U.P.size === 0 && V.X.size !== 0) ||
    (V.P.size === 0 && U.X.size !== 0)
  ) return true;
  
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
 * @brief Executa o algoritmo Bipartite Bron-Kerbosch, com uma mínima adaptação para evitar a enumeração de bicliques com apenas 1 vértice em um dos conjuntos.
 * @param G Grafo bipartido (usuarios x jogos)
 * @param [Ru, Rj] Conjunto de vértices atualmente na clique (usuarios, jogos)
 * @param [Pu, Pj] Conjunto de vértices candidatos a serem adicionados à clique (usuarios, jogos)
 * @param [Xu, Xj] Conjunto de vértices já processados (usuarios, jogos)
 * @param cliques Lista de bicliques maximais encontrados
 */
function bronKerboschBipartido(
  U: Particao,
  V: Particao,
  cliques: [string[], string[]][]
) {
  // Adicionar R U P como um biclique maximal
  if (testeMaximalidade(U, V, cliques)) {
    return;
  }

  if ((U.P.size === 0 && V.X.size !== 0) || (V.P.size === 0 && U.X.size !== 0))
    return;

  // Escolher um pivô para reduzir recursões
  const pivo = (U.P.values().next().value ?? V.P.values().next().value) as string;

  let PFiltrado: string[] | undefined;

  // Iterar apenas pelos não-vizinhos de `pivo` nos subconjuntos correspondentes
  if (U.ids.has(pivo)) {
    PFiltrado = [...V.P].filter(j => !U.vizinhos.get(pivo)!.has(j));
  } else {
    PFiltrado = [...U.P].filter(u => !V.vizinhos.get(pivo)!.has(u));
  }

  // Caso pivo ∈ P
  // if (U.P.has(pivo) || V.P.has(pivo))
  PFiltrado.push(pivo);

  for (const v of PFiltrado) {
    if (U.ids.has(v)) {
      // v é um usuário
      bronKerboschBipartido(
        U.semCandidato(v),
        V.apenasVizinhosDe(v),
        cliques
      );

      U.P.delete(v);
      U.X.add(v);
    } else {
      // v é um jogo
      bronKerboschBipartido(
        U.apenasVizinhosDe(v),
        V.semCandidato(v),
        cliques
      );

      V.P.delete(v);
      V.X.add(v);
    }
  }
}

function jogosVizinhosDeUsuario(G: Bipartido, usuarioId: string): Set<string> {
  return new Set(G.jogosPorUsuario.get(usuarioId) ?? []);
}

function usuariosVizinhosDeJogo(G: Bipartido, jogoId: string): Set<string> {
  return new Set(G.conjuntoJogos.get(jogoId) ?? []);
}

/**
 * Calcula os conjuntos de usuários e jogos na vizinhança estendida de um vértice `v` em um grafo bipartido `G`.
 * @param G Um grafo bipartido (usuarios x jogos).
 * @param v Um vértice do grafo (pode ser um usuário ou um jogo).
 * @param usuariosAtivos Conjunto de usuários ainda presentes no subgrafo induzido.
 * @returns Um par de conjuntos contendo os vértices de U e V pertencentes a N_P(v).
 */
function projectionExtendedNeighborhood(
  G: Bipartido,
  v: string,
  usuariosAtivos: Set<string> = G.conjuntoUsuarios,
): [Set<string>, Set<string>] {
  if (G.conjuntoUsuarios.has(v)) {
    const jogos = jogosVizinhosDeUsuario(G, v);
    const usuarios = new Set<string>();

    for (const jogoId of jogos) {
      for (const usuarioId of usuariosVizinhosDeJogo(G, jogoId)) {
        if (usuarioId !== v && usuariosAtivos.has(usuarioId)) usuarios.add(usuarioId);
      }
    }

    return [usuarios, jogos];
  }

  const usuarios = new Set<string>();
  const jogos = new Set<string>();

  for (const usuarioId of usuariosVizinhosDeJogo(G, v)) {
    if (!usuariosAtivos.has(usuarioId)) continue;
    usuarios.add(usuarioId);

    for (const jogoId of jogosVizinhosDeUsuario(G, usuarioId)) {
      if (jogoId !== v) jogos.add(jogoId);
    }
  }

  return [usuarios, jogos];
}

function obterOrdemBidegenerescenciaUsuarios(G: Bipartido): string[] {
  const vizinhosProjetados = new Map<string, Set<string>>();
  const grauAtual = new Map<string, number>();

  for (const usuarioId of G.conjuntoUsuarios) {
    vizinhosProjetados.set(usuarioId, new Set<string>());
    grauAtual.set(usuarioId, G.jogosPorUsuario.get(usuarioId)?.size ?? 0);
  }

  for (const usuariosDoJogo of G.conjuntoJogos.values()) {
    const listaUsuarios = [...usuariosDoJogo];

    for (let i = 0; i < listaUsuarios.length; i++) {
      const usuarioId = listaUsuarios[i];
      const vizinhosDoUsuario = vizinhosProjetados.get(usuarioId)!;

      for (let j = 0; j < listaUsuarios.length; j++) {
        if (i === j) continue;

        const outroUsuarioId = listaUsuarios[j];

        if (!vizinhosDoUsuario.has(outroUsuarioId)) {
          vizinhosDoUsuario.add(outroUsuarioId);
          grauAtual.set(usuarioId, (grauAtual.get(usuarioId) ?? 0) + 1);
        }
      }
    }
  }

  const restantes = new Set(G.conjuntoUsuarios);
  const ordem: string[] = [];

  while (restantes.size > 0) {
    let melhorUsuario: string | undefined;
    let menorVizinhos = Number.POSITIVE_INFINITY;

    for (const usuarioId of restantes) {
      const tamanho = grauAtual.get(usuarioId) ?? 0;

      if (tamanho < menorVizinhos) {
        menorVizinhos = tamanho;
        melhorUsuario = usuarioId;
      }
    }

    if (melhorUsuario === undefined) break;

    ordem.push(melhorUsuario);
    restantes.delete(melhorUsuario);

    for (const vizinhoId of vizinhosProjetados.get(melhorUsuario) ?? []) {
      if (!restantes.has(vizinhoId)) continue;
      grauAtual.set(vizinhoId, (grauAtual.get(vizinhoId) ?? 0) - 1);
    }
  }

  return ordem;
}

export type UsuarioEmClique = Usuario & { id: string };

export type Clique = {
  usuarios: UsuarioEmClique[],
  jogos: string[],
};

export async function encontrarPanelinhasMaximais(acertos: boolean) {
  const G = await obterBipartido(acertos);
  const jogos = new Set(G.conjuntoJogos.keys());

  const cliques: [string[], string[]][] = [];

  const U = new Particao(
    G.conjuntoUsuarios,
    G.jogosPorUsuario,
    new Set(),
    new Set(G.conjuntoUsuarios),
    new Set()
  );
  
  const V = new Particao(
    jogos,
    G.conjuntoJogos,
    new Set(),
    new Set(jogos),
    new Set()
  );
  
  for (const ui of G.conjuntoUsuarios) {
    U.R.add(ui);
    U.P.delete(ui);

    bronKerboschBipartido(
      U.clone(),
      V.clone(),
      cliques
    );

    U.X.add(ui);
    U.R.delete(ui);
  }

  return cliques
    .sort((a, b) => (b[0].length * b[1].length) - (a[0].length * a[1].length)) // Ordenar por tamanho decrescente em arestas (|U| * |V|)
    .map(([usuarioIds, jogoIds]) => {
      return {
        usuarios: usuarioIds.map(usuarioId => ({
          ...G.usuarios[usuarioId],
          id: usuarioId,
        })),
        jogos: jogoIds
      }
    });
}