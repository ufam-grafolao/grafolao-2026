export interface Usuario {
  id: string
  nome: string
  email: string
  avatarUrl: string | null
  role: 'ADMIN' | 'PARTICIPANTE'
}

export interface Resumo {
  pontos: number
  totalPalpites: number,
  acertosCompletos: number,
  acertosParciais: number,
}