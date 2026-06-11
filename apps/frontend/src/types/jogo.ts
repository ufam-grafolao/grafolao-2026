export interface Time {
  id: string
  nome: string
  codigo: string | null
  grupo: string | null
}

export interface Resultado {
  golsCasa: number
  golsVisitante: number
  artilheirosCasa: string[]
  artilheirosVisitante: string[]
}

export interface Jogo {
  id: string
  num: number | null
  fase: string
  rodada: string
  grupo: string | null
  dataHora: string
  local: string
  status: 'AGENDADO' | 'EM_ANDAMENTO' | 'ENCERRADO' | 'BLOQUEADO'
  timeCasa: Time | null
  timeVisitante: Time | null
  timeCasaRef: string | null
  timeVisitanteRef: string | null
  resultado: Resultado | null
}