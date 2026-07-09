export type CliquesOrdem = 'vertices' | 'arestas' | 'usuarios' | 'jogos'

export type Biclique = [number[], number[]]

export interface CliqueUsuario {
  id: string
  nome: string
  avatarUrl?: string | null
}

export interface CliqueJogo {
  id: string
  timeCasa?: string | null
  timeVisitante?: string | null
  golsCasa?: number | null
  golsVisitante?: number | null
}

export interface CliquesResponse {
  usuarios: CliqueUsuario[]
  jogos: CliqueJogo[]
  bicliques: Biclique[]
}

export interface CliquesQueryParams {
  ordem?: CliquesOrdem
  minimoUsuarios?: number
  minimoJogos?: number
  comigo?: boolean
  comJogo?: string
}