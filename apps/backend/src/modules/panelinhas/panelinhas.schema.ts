// ─── Tipos de resposta

export interface ParametrosPanelinhas {
  rodada?: string            // rodada ACUMULADA: considera os jogos até ela (inclusive)
  minPalpites: number
  percentil: number          // 0–100: aresta se peso ≥ percentil p dos pesos positivos
  excluirAcimaDe?: number    // 0–1: exclui jogos acertados por mais dessa fração de quem palpitou
  incluirBonus: boolean      // ACERTO_BONUS conta como acerto?
  k: number                  // quantas maiores panelas devolver / usar na média
  orcamentoMs: number
}

export interface ParticipantePanela {
  id: string
  nome: string
}

export interface NoPanelinhas {
  id: string
  nome: string
  avatarUrl: string | null
  panelas: number            // em quantas panelas (≥ 3) aparece
}

export interface ArestaPanelinhas {
  origem: string
  destino: string
  peso: number               // jogos acertados em comum (aresta não dirigida)
}

export interface PanelinhasResponse {
  rodada: string | null      // null = campeonato inteiro
  jogosConsiderados: number
  percentil: number
  limiar: number | null      // null = nenhum par com acerto em comum
  nos: NoPanelinhas[]
  arestas: ArestaPanelinhas[]
  cliqueMaxima: { participantes: ParticipantePanela[]; tamanho: number }
  totalPanelas: number       // cliques maximais com 3 ou mais participantes
  maioresPanelas: { participantes: ParticipantePanela[]; tamanho: number }[]
  k: number
  tamanhoMedioTopK: number
  completou: boolean         // false = orçamento esgotado, contagens são parciais
  tempoMs: number
}

export interface PontoSeriePanelinhas {
  rodada: string
  jogosAcumulados: number
  limiar: number | null
  totalArestas: number
  tamanhoMaximo: number
  tamanhoMedioTopK: number
  totalPanelas: number
  completou: boolean
  tempoMs: number
}

// ─── JSON Schemas

const participanteSchema = {
  type: 'object',
  properties: { id: { type: 'string' }, nome: { type: 'string' } },
}

const panelaSchema = {
  type: 'object',
  properties: {
    participantes: { type: 'array', items: participanteSchema },
    tamanho: { type: 'integer' },
  },
}

export const panelinhasResponseSchema = {
  200: {
    type: 'object',
    properties: {
      rodada: { type: ['string', 'null'] },
      jogosConsiderados: { type: 'integer' },
      percentil: { type: 'number' },
      limiar: { type: ['number', 'null'] },
      nos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nome: { type: 'string' },
            avatarUrl: { type: ['string', 'null'] },
            panelas: { type: 'integer' },
          },
        },
      },
      arestas: {
        type: 'array',
        items: {
          type: 'object',
          properties: { origem: { type: 'string' }, destino: { type: 'string' }, peso: { type: 'integer' } },
        },
      },
      cliqueMaxima: panelaSchema,
      totalPanelas: { type: 'integer' },
      maioresPanelas: { type: 'array', items: panelaSchema },
      k: { type: 'integer' },
      tamanhoMedioTopK: { type: 'number' },
      completou: { type: 'boolean' },
      tempoMs: { type: 'integer' },
    },
  },
}

export const serieResponseSchema = {
  200: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        rodada: { type: 'string' },
        jogosAcumulados: { type: 'integer' },
        limiar: { type: ['number', 'null'] },
        totalArestas: { type: 'integer' },
        tamanhoMaximo: { type: 'integer' },
        tamanhoMedioTopK: { type: 'number' },
        totalPanelas: { type: 'integer' },
        completou: { type: 'boolean' },
        tempoMs: { type: 'integer' },
      },
    },
  },
}
