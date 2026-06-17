export interface EntradaRanking {
  posicao: number
  usuarioId: string
  nome: string
  avatarUrl: string | null
  totalPontos: number
  pontosPalpites: number
  pontosEspeciais: number
  acertosCompletos: number
  acertosParciais: number
}

export interface RankingGeralResponse {
  data: EntradaRanking[]
  total: number
  page: number
  totalPages: number
  minhaEntrada: EntradaRanking | null
}
