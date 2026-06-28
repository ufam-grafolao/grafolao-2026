export interface InserirResultadoInput {
  jogoId: string
  golsCasa: number
  golsVisitante: number
  penalti?: boolean
  vencedorPenalti?: 'CASA' | 'VISITANTE'
  artilheirosCasa?: string[]
  artilheirosVisitante?: string[]
  cartoesAmarelos?: number
  cartoesVermelhosIndiretos?: number
  cartoesVermelhosDiretos?: number
  cartoesAmarelosMaisVermelho?: number
}