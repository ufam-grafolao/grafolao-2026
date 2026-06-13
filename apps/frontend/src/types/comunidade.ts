export type TipoComunidade = 'PUBLICA' | 'PRIVADA'
export type RoleComunidade = 'DONO' | 'MODERADOR' | 'MEMBRO'
export type StatusSolicitacao = 'PENDENTE' | 'ACEITA' | 'REJEITADA'

export interface UsuarioResumo {
  id: string
  nome: string
  avatarUrl: string | null
}

export interface ComunidadeResponse {
  id: string
  nome: string
  descricao: string | null
  tipo: TipoComunidade
  avatarUrl: string | null
  codigoCovite: string | null
  donoId: string
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface ComunidadeListaResponse extends ComunidadeResponse {
  membros: { role: RoleComunidade }[]
}

export interface ComunidadeComContagem extends ComunidadeResponse {
  _count: { membros: number }
  membros: { role: RoleComunidade }[]
}

export interface MembroResponse {
  id: string
  comunidadeId: string
  usuarioId: string
  role: RoleComunidade
  entradoEm: string
  usuario: UsuarioResumo
}

export interface DetalhesComunidade extends ComunidadeResponse {
  membros: MembroResponse[]
  _count: { membros: number }
  meuRole: RoleComunidade | null
}

export interface RankingMembro {
  posicao: number
  usuarioId: string
  nome: string
  avatarUrl: string | null
  role: RoleComunidade
  totalPontos: number
  pontosPalpites: number
  pontosEspeciais: number
}

export interface SolicitacaoResponse {
  id: string
  comunidadeId: string
  usuarioId: string
  status: StatusSolicitacao
  criadoEm: string
  usuario: UsuarioResumo
}

// ─── Body params

export interface CriarComunidadeBody {
  nome: string
  descricao?: string
  tipo: TipoComunidade
  avatarUrl?: string
}

export interface EntrarComunidadeBody {
  codigo?: string
}

export interface PromoverMembroBody {
  usuarioId: string
  role: 'MODERADOR' | 'MEMBRO'
}