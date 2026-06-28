export interface PalpiteExistente {
  id: string
  jogoId: string
  golsCasa: number
  golsVisitante: number
  pontos: number
  vencedorPenalti: 'CASA' | 'VISITANTE' | null
  status: 'PENDENTE' | 'ACERTO_PLACAR' | 'ACERTO_VENCEDOR' | 'ACERTO_BONUS' | 'ERRO'
  totalEdicoes: number
  jogo: {
    id: string
    rodada: string
    grupo: string | null
    dataHora: string
    timeCasa: { nome: string } | null
    timeVisitante: { nome: string } | null
    timeCasaRef: string | null
    timeVisitanteRef: string | null
  }
}

export interface PalpitarInput {
  jogoId: string
  golsCasa: number
  golsVisitante: number
  vencedorPenalti?: 'CASA' | 'VISITANTE'
}