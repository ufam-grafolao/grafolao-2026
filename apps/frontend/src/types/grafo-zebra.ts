// Contratos de /grafos/zebra/* (backend: modules/zebra/zebra.schema.ts, branch feat/zebra-mst)

export type MetricaOusadia = 'media' | 'mediana' | 'raridade'
export type OrdemZebra = 'soma' | 'media'

export interface LinhaRankingZebra {
  usuarioId: string
  nome: string
  avatarUrl: string | null
  posicao: number
  /** Σ ousadia × pontos */
  indice: number
  /** indice / jogos palpitados */
  indiceMedio: number
  jogosPalpitados: number
  /** jogos em que pontuou com ousadia > 0 */
  acertosOusados: number
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
  /** distância média nos jogos em comum (0 = palpites iguais, 1 = resultados diferentes) */
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
  /** 1 = árvore; > 1 = floresta */
  componentes: number
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
