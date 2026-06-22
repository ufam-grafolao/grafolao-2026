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
  ) {
    this.usuarios = usuarios;
    this.conjuntoUsuarios = conjuntoUsuarios;
    this.conjuntoJogos = conjuntoJogos;
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
  );
}

function bronKerboschBipartido(
  G: Bipartido,
  [Ru, Rj]: [Set<string>, Set<string>],
  [Pu, Pj]: [Set<string>, Set<string>],
  [Xu, Xj]: [Set<string>, Set<string>],
  cliques: [string[], string[]][]
) {
  if ((Pu.size === 0 || Pj.size === 0) && Xu.size === 0 && Xj.size === 0) {
    // Adicionar R U P como um biclique maximal
    cliques.push([[...Ru, ...Pu], [...Rj, ...Pj]]);
    return;
  }

  if ((Pu.size === 0 && Xj.size !== 0) || (Pj.size === 0 && Xu.size !== 0))
    return;

  // Escolher um pivô para reduzir recursões
  const pivo = (Pu.values().next().value ?? Pj.values().next().value) as string;
  
  let PFiltrado: string[] | undefined;

  // Iterar apenas pelos não-vizinhos de `pivo` nos subconjuntos correspondentes
  if (G.conjuntoUsuarios.has(pivo)) {
    PFiltrado = [...Pj].filter(j => !G.aresta(pivo, j));
  } else {
    PFiltrado = [...Pu].filter(u => !G.aresta(u, pivo));
  }
  
  // Caso pivo ∈ P
  if (Pu.has(pivo) || Pj.has(pivo))
    PFiltrado.push(pivo);

  for (const v of PFiltrado) {
    if (G.conjuntoUsuarios.has(v)) {
      // v é um usuário
      const newRu = new Set(Ru).add(v);
      const newPu = new Set(Pu);
      newPu.delete(v);
      
      bronKerboschBipartido(
        G,
        [newRu, Rj],
        [newPu,       new Set([...Pj].filter(j => G.aresta(v, j)))],
        [new Set(Xu), new Set([...Xj].filter(j => G.aresta(v, j)))],
        cliques
      );

      Pu.delete(v);
      Xu.add(v);
    } else {
      // v é um jogo
      const newRj = new Set(Rj).add(v);
      const newPj = new Set(Pj);
      newPj.delete(v);
      
      bronKerboschBipartido(
        G,
        [Ru, newRj],
        [new Set([...Pu].filter(u => G.aresta(u, v))), newPj],
        [new Set([...Xu].filter(u => G.aresta(u, v))), new Set(Xj)],
        cliques
      );

      Pj.delete(v);
      Xj.add(v);
    }
  }
}



export type UsuarioEmClique = Usuario & { id: string };

export type Clique = {
  usuarios: UsuarioEmClique[],
  jogos: string[],
};

/**
 * Calcula os conjuntos de usuários e jogos na vizinhança estendida de um vértice `v` em um grafo bipartido `G`.
 * @param G Um grafo bipartido (usuarios x jogos).
 * @param v Um vértice do grafo (pode ser um usuário ou um jogo).
 * @returns Um par de conjuntos contendo usuários-vizinhos de `v` e os jogos-vizinhos de `v`
 * nessa projection-extended neighborhood.
 */
function projectionExtendedNeighborhood(G: Bipartido, v: string): [Set<string>, Set<string>] {
  const vizinhos = G.conjuntoUsuarios.has(v) ? G.conjuntoJogos.get(v) ?? new Set() : new Set([...G.conjuntoUsuarios].filter(u => G.aresta(u, v)));
  return G.conjuntoUsuarios.has(v) ? [new Set(), vizinhos] : [vizinhos, new Set()];
}

export async function encontrarPanelinhasMaximais(acertos: boolean): Promise<Clique[]> {
  const G = await obterBipartido(acertos);
  
  const cliques: [string[], string[]][] = [];
  
  /*
  for each ui in a bidegeneracy order u1, u2, . . . , un of U do
    Pi ← N P (ui) \ {u1, . . . , ui−1}
    Xi ← N P (ui) ∩ {u1, . . . , ui−1}
    BipBronKerbosch({ui}, Pi, Xi)
  */

  for (const ui of G.conjuntoUsuarios) {
    const Pi = new Set([...G.conjuntoJogos.keys()].filter(j => G.aresta(ui, j)));
    const Xi = new Set<string>();

    bronKerboschBipartido(
      G,
      [new Set<string>([ui]), new Set<string>()],
      [Pi, new Set<string>()],
      [Xi, new Set<string>()],
      cliques
    );
  }

  bronKerboschBipartido(
    G,
    [new Set<string>(), new Set<string>()],
    [new Set<string>(G.conjuntoUsuarios), new Set<string>(G.conjuntoJogos.keys())],
    [new Set<string>(), new Set<string>()],
    cliques
  );

  return cliques
    .sort((a, b) => (b[0].length - a[0].length) || (b[1].length - a[1].length)) // Ordenar por tamanho decrescente em usuarios
    .filter(([_, jogoIds]) => jogoIds.length > 2) // Filtrar cliques com 3 ou mais jogos
    .filter(([usuarioIds, _]) => usuarioIds.length > 2) // Filtrar cliques com 3 ou mais usuarios
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