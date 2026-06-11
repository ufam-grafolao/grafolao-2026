export interface InserirResultadoInput {
  jogoId: string
  golsCasa: number
  golsVisitante: number
  artilheirosCasa?: string[]
  artilheirosVisitante?: string[]
  cartoesAmarelos?: number
  cartoesVermelhosIndiretos?: number
  cartoesVermelhosDiretos?: number
  cartoesAmarelosMaisVermelho?: number
}