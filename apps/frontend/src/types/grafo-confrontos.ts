export interface NoGrafo {
  id: string
  nome: string
  avatarUrl: string | null
  pageRank: number
  posicao: number
}

export interface ArestaGrafo {
  origem: string
  destino: string
  peso: number
}

export interface GrafoConfrontosResponse {
  nos: NoGrafo[]
  arestas: ArestaGrafo[]
  totalConfrontos: number
  rodada: string | null
}

export interface CicloResponse {
  participantes: string[]
  tamanho: number
}

export interface CaminhoMaisLongoResponse {
  participantes: string[]
  tamanho: number
  completou: boolean
  tempoMs: number
}