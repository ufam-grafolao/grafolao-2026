// Contratos de /grafos/panelinhas* (backend: modules/panelinhas/panelinhas.schema.ts, branch feat/panelinhas)

export interface ParticipantePanela {
  id: string
  nome: string
}

export interface Panela {
  participantes: ParticipantePanela[]
  tamanho: number
}

export interface NoPanelinhas {
  id: string
  nome: string
  avatarUrl: string | null
  /** em quantas panelas (≥ 3) aparece */
  panelas: number
}

export interface ArestaPanelinhas {
  origem: string
  destino: string
  /** jogos acertados em comum (aresta não dirigida) */
  peso: number
}

export interface PanelinhasResponse {
  /** null = campeonato inteiro */
  rodada: string | null
  jogosConsiderados: number
  percentil: number
  /** null = nenhum par com acerto em comum */
  limiar: number | null
  nos: NoPanelinhas[]
  arestas: ArestaPanelinhas[]
  cliqueMaxima: Panela
  /** cliques maximais com 3 ou mais participantes */
  totalPanelas: number
  maioresPanelas: Panela[]
  k: number
  tamanhoMedioTopK: number
  /** false = orçamento esgotado, contagens parciais */
  completou: boolean
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
