import type { MetricaOusadia, OrdemZebra } from './zebra.algoritmos.js'

// ─── Tipos de resposta

export interface LinhaRankingZebra {
  usuarioId: string
  nome: string
  avatarUrl: string | null
  posicao: number
  indice: number          // Σ ousadia × pontos
  indiceMedio: number     // indice / jogos palpitados
  jogosPalpitados: number
  acertosOusados: number  // jogos em que pontuou com ousadia > 0
}

export interface RankingZebraResponse {
  rodada: string | null
  ousadia: MetricaOusadia
  ordenarPor: OrdemZebra
  minPalpites: number
  jogosConsiderados: number
  ranking: LinhaRankingZebra[]
}

export interface NoMst {
  id: string
  nome: string
  avatarUrl: string | null
}

export interface ArestaMst {
  origem: string
  destino: string
  peso: number
  jogosEmComum?: number
}

export interface MstAgregadaResponse {
  rodada: string | null
  minPalpites: number
  minJogosEmComum: number
  nos: NoMst[]
  arestas: ArestaMst[]
  pesoTotal: number
  componentes: number     // 1 = árvore; > 1 = floresta (há grupos sem jogos em comum suficientes)
}

export interface PalpiteNoJogo {
  usuarioId: string
  nome: string
  avatarUrl: string | null
  golsCasa: number
  golsVisitante: number
  pontos: number
  ousadia: number
}

export interface DetalheJogoZebraResponse {
  jogo: {
    id: string
    rodada: string
    timeCasa: string | null
    timeVisitante: string | null
    golsCasa: number | null
    golsVisitante: number | null
  }
  ousadia: MetricaOusadia
  nos: PalpiteNoJogo[]
  arestas: ArestaMst[]
  pesoTotal: number
  ousadosQueAcertaram: PalpiteNoJogo[]
}

// ─── JSON Schemas

const numero = { type: 'number' }
const inteiro = { type: 'integer' }
const texto = { type: 'string' }
const textoOuNulo = { type: ['string', 'null'] }

const arestaSchema = {
  type: 'object',
  properties: { origem: texto, destino: texto, peso: numero, jogosEmComum: inteiro },
}

const palpiteNoJogoSchema = {
  type: 'object',
  properties: {
    usuarioId: texto, nome: texto, avatarUrl: textoOuNulo,
    golsCasa: inteiro, golsVisitante: inteiro, pontos: inteiro, ousadia: numero,
  },
}

export const rankingZebraResponseSchema = {
  200: {
    type: 'object',
    properties: {
      rodada: textoOuNulo, ousadia: texto, ordenarPor: texto, minPalpites: inteiro, jogosConsiderados: inteiro,
      ranking: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            usuarioId: texto, nome: texto, avatarUrl: textoOuNulo, posicao: inteiro,
            indice: numero, indiceMedio: numero, jogosPalpitados: inteiro, acertosOusados: inteiro,
          },
        },
      },
    },
  },
}

export const mstAgregadaResponseSchema = {
  200: {
    type: 'object',
    properties: {
      rodada: textoOuNulo, minPalpites: inteiro, minJogosEmComum: inteiro,
      nos: { type: 'array', items: { type: 'object', properties: { id: texto, nome: texto, avatarUrl: textoOuNulo } } },
      arestas: { type: 'array', items: arestaSchema },
      pesoTotal: numero, componentes: inteiro,
    },
  },
}

export const detalheJogoZebraResponseSchema = {
  200: {
    type: 'object',
    properties: {
      jogo: {
        type: 'object',
        properties: {
          id: texto, rodada: texto, timeCasa: textoOuNulo, timeVisitante: textoOuNulo,
          golsCasa: { type: ['integer', 'null'] }, golsVisitante: { type: ['integer', 'null'] },
        },
      },
      ousadia: texto,
      nos: { type: 'array', items: palpiteNoJogoSchema },
      arestas: { type: 'array', items: arestaSchema },
      pesoTotal: numero,
      ousadosQueAcertaram: { type: 'array', items: palpiteNoJogoSchema },
    },
  },
  404: { type: 'object', properties: { erro: texto } },
}
