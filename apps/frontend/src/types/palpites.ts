export interface PalpiteExistente {
  id: string
  jogoId: string
  golsCasa: number
  golsVisitante: number
  pontos: number
  status: 'PENDENTE' | 'ACERTO_PLACAR' | 'ACERTO_RESULTADO' | 'ERRO'
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