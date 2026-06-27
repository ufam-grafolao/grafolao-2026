export type TipoPalpiteEspecial = 'CAMPEAO' | 'VICE' | 'TERCEIRO_LUGAR' | 'ARTILHEIRO' | 'MVP'

export interface PalpiteEspecialResponse {
  tipo: TipoPalpiteEspecial
  timeId: string | null
  timeNome: string | null
  timeCodigo: string | null
  jogadorId: string | null
  jogadorNome: string | null
  jogadorTimeNome: string | null
  jogadorFotoUrl: string | null
  totalEdicoes: number
  pontos: number
  acertou: boolean | null
}

export interface SalvarPalpiteEspecialBody {
  tipo: TipoPalpiteEspecial
  timeId?: string
  jogadorId?: string
}

export interface ResultadoEspecialResponse {
  tipo: TipoPalpiteEspecial
  timeId: string | null
  timeNome: string | null
  jogadorId: string | null
  jogadorNome: string | null
  inseridoEm: string
}
