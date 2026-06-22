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
        [newPu, new Set([...Pj].filter(j => G.aresta(v, j)))],
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

function jogosVizinhosDeUsuario(G: Bipartido, usuarioId: string): Set<string> {
  const jogos = new Set<string>();

  for (const [jogoId, usuarios] of G.conjuntoJogos.entries()) {
    if (usuarios.has(usuarioId)) jogos.add(jogoId);
  }

  return jogos;
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
  const restantes = new Set(G.conjuntoUsuarios);
  const ordem: string[] = [];

  while (restantes.size > 0) {
    let melhorUsuario: string | undefined;
    let menorVizinhos = Number.POSITIVE_INFINITY;

    for (const usuarioId of restantes) {
      const [usuarios, jogos] = projectionExtendedNeighborhood(G, usuarioId, restantes);
      const tamanho = usuarios.size + jogos.size;

      if (tamanho < menorVizinhos) {
        menorVizinhos = tamanho;
        melhorUsuario = usuarioId;
      }
    }

    if (melhorUsuario === undefined) break;

    ordem.push(melhorUsuario);
    restantes.delete(melhorUsuario);
  }

  return ordem;
}

export type UsuarioEmClique = Usuario & { id: string };

export type Clique = {
  usuarios: UsuarioEmClique[],
  jogos: string[],
};

export async function encontrarPanelinhasMaximais(acertos: boolean): Promise<Clique[]> {
  const G = await obterBipartido(acertos);

  const cliques: [string[], string[]][] = [];

  const ordemUsuarios = obterOrdemBidegenerescenciaUsuarios(G);
  const usuariosAnteriores = new Set<string>();

  for (const ui of ordemUsuarios) {
    const [usuariosNP, jogosNP] = projectionExtendedNeighborhood(G, ui);
    const Pi = new Set([...usuariosNP].filter(usuarioId => !usuariosAnteriores.has(usuarioId)));
    const Xi = new Set([...usuariosNP].filter(usuarioId => usuariosAnteriores.has(usuarioId)));

    bronKerboschBipartido(
      G,
      [new Set<string>([ui]), new Set<string>()],
      [Pi, jogosNP],
      [Xi, new Set<string>()],
      cliques
    );

    usuariosAnteriores.add(ui);
  }

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