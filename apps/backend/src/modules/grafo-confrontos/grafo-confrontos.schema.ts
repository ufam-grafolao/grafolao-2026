// ─── Tipos de resposta

export interface NoGrafo {
  id: string 
  nome: string
  avatarUrl: string | null
  pageRank: number
  posicao: number
}

export interface ArestaGrafo {
  origem: string      // usuarioId vencedor
  destino: string     // usuarioId perdedor
  peso: number        // saldo de confrontos
}

export interface GrafoConfrontosResponse {
  nos: NoGrafo[]
  arestas: ArestaGrafo[]
  totalConfrontos: number
  rodada: string | null  // null = grafo acumulado total
}

export interface CicloResponse {
  participantes: string[]   // nomes, em ordem do ciclo
  tamanho: number
}

export interface CaminhoMaisLongoResponse {
  participantes: string[]   // nomes, em ordem do caminho
  tamanho: number           // número de vértices no caminho
  completou: boolean        // true = busca exaustiva concluída (ótimo garantido)
                             // false = orçamento de tempo esgotado (apenas lower bound)
  tempoMs: number           // tempo de execução da busca, em milissegundos
}

export interface ResultadoCaminhoMaisLongo {
  caminhoIds: string[]
  completou: boolean   // true = espaço de busca esgotado (ótimo garantido)
  tempoMs: number
}

export interface EvolucaoRodadaResponse {
  rodada: string
  ranking: { usuarioId: string; nome: string; pageRank: number; posicao: number }[]
}

// ─── JSON Schemas

const noGrafoSchema = {
  type: 'object',
  properties: {
    id:        { type: 'string' },
    nome:      { type: 'string' },
    avatarUrl: { type: ['string', 'null'] },
    pageRank:  { type: 'number' },
    posicao:   { type: 'integer' },
  },
}

const arestaGrafoSchema = {
  type: 'object',
  properties: {
    origem:  { type: 'string' },
    destino: { type: 'string' },
    peso:    { type: 'integer' },
  },
}

export const grafoConfrontosResponseSchema = {
  200: {
    type: 'object',
    properties: {
      nos:             { type: 'array', items: noGrafoSchema },
      arestas:         { type: 'array', items: arestaGrafoSchema },
      totalConfrontos: { type: 'integer' },
      rodada:          { type: ['string', 'null'] },
    },
  },
}

export const ciclosResponseSchema = {
  200: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        participantes: { type: 'array', items: { type: 'string' } },
        tamanho:       { type: 'integer' },
      },
    },
  },
}

export const caminhoMaisLongoResponseSchema = {
  200: {
    type: 'object',
    properties: {
      participantes: { type: 'array', items: { type: 'string' } },
      tamanho:       { type: 'integer' },
      completou:     { type: 'boolean' },
      tempoMs:       { type: 'integer' },
    },
  },
}