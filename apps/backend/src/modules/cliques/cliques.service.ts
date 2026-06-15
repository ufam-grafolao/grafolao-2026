import { Prisma } from '@prisma/client';
import prisma from '../../db/prisma.js'

type Status = Prisma.PalpiteGetPayload<{}>['status'];

/**
 * @brief Estrutura de dados para representar os acertos dos palpiteiros em cada jogo.
 */
type Bipartido = {
  jogos: {
    [id: string]: string[]; // jogoId -> [usuarioId]
  },
  usuarios: {
    [id: string]: string[]; // usuarioId -> [jogoId]
  },
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
        palpites: {
          select: { jogoId: true },
          where: { status: STATUS_WHERE }
        },
      }
    })
  ]);
  
  return {
    jogos: Object.fromEntries(jogos.map(jogo => [jogo.id, jogo.palpites.map(p => p.usuarioId)])),
    usuarios: Object.fromEntries(usuarios.map(usuario => [usuario.id, usuario.palpites.map(p => p.jogoId)])),
  }
}

async function obterGrafoPanelinhas(acertos: boolean): Promise<Map<string, Set<string>>> {
  const bipartido = await obterBipartido(acertos);
  
  const panelinhas = new Map<string, Set<string>>(); // usuarioId -> Set<usuarioId>

  for (const usuariosIds of Object.values(bipartido.jogos)) {
    for (let i = 0; i < usuariosIds.length; i++) {
      let panelinha = panelinhas.get(usuariosIds[i]);
      if (panelinha === undefined) {
        panelinha = new Set<string>();
        panelinhas.set(usuariosIds[i], panelinha);
      }

      // Adicionar usuários à esquerda do atual que acertaram/erraram o mesmo jogo
      for (let j = 0; j < i; j++)
        panelinha.add(usuariosIds[j]);

      // Adicionar usuários à direita do atual que acertaram/erraram o mesmo jogo
      for (let j = i + 1; j < usuariosIds.length; j++)
        panelinha.add(usuariosIds[j]);
    }
  }
  
  return panelinhas;
}

function bronKerbosch(
  grafoPanelinhas: Map<string, Set<string>>,
  R: Set<string>,
  P: Set<string>,
  X: Set<string>,
  cliques: string[][]
) {
  if (P.size === 0 && X.size === 0) {
    cliques.push(Array.from(R));
    return;
  }

  const u = (P.values().next().value ?? X.values().next().value) as string;
  
  const PFiltrado = Array.from(P).filter(v => !grafoPanelinhas.get(u)?.has(v));
  for (const v of PFiltrado) {
    const neighbors = grafoPanelinhas.get(v) as Set<string>;

    const newR = new Set(R);
    newR.add(v);

    const newP = new Set([...P].filter(u => neighbors.has(u)));
    const newX = new Set([...X].filter(u => neighbors.has(u)));

    bronKerbosch(grafoPanelinhas, newR, newP, newX, cliques);

    P.delete(v);
    X.add(v);
  }
}

async function encontrarPanelinhasMaximais(acertos: boolean): Promise<string[][]> {
  const grafoPanelinhas = await obterGrafoPanelinhas(acertos);
  
  const cliques: string[][] = [];
  bronKerbosch(
    grafoPanelinhas,
    new Set<string>(),
    new Set(grafoPanelinhas.keys()),
    new Set<string>(),
    cliques
  );

  // Ordenar por tamanho decrescente
  return cliques.sort((a, b) => b.length - a.length);
}