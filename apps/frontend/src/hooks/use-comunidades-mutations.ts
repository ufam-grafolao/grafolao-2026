import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/env'
import type {
  CriarComunidadeBody,
  EntrarComunidadeBody,
  PromoverMembroBody,
  TipoComunidade,
} from '@/types/comunidade'
import { useToast } from '@/lib/toast'

function useAuthHeaders() {
  const { token } = useAuth()
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

// ─── Criar comunidade

export function useCriarComunidade() {
  const qc = useQueryClient()
  const headers = useAuthHeaders()
  const {toast} = useToast()

  return useMutation({
    mutationFn: async (body: CriarComunidadeBody) => {
      const res = await fetch(`${API_URL}/comunidades`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao criar comunidade')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comunidades'] })
      toast('success', 'Comunidade criada com sucesso!')
    },
    onError: (error: Error) => {
      toast('error','Erro ao criar a comunidade' ,error.message)
    }
  })
}

// ─── Entrar em comunidade (pública com ou sem código)

export function useEntrarComunidade() {
  const qc = useQueryClient()
  const headers = useAuthHeaders()
  const {toast} = useToast()

  return useMutation({
    mutationFn: async ({ comunidadeId, body }: { comunidadeId: string; body: EntrarComunidadeBody }) => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}/entrar`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao entrar na comunidade')
      }
      return res.json()
    },
    onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['comunidades'] })
    toast('success', 'Você entrou na comunidade!')
    },
    onError: (error: Error) => {
      if (error.message === 'JA_MEMBRO') {
        toast('info', 'Você já é membro desta comunidade.')
        return
      }
      const msgs: Record<string, string> = {
        CODIGO_INVALIDO: 'Código de convite inválido.',
      }
      toast('error', 'Erro ao entrar', msgs[error.message] ?? error.message)
    }
  })
}

// ─── Solicitar entrada (privada)

export function useSolicitarEntrada() {
  const qc = useQueryClient()
  const headers = useAuthHeaders()
  const {toast} = useToast()
  const { 'Content-Type': _, ...headersAuth } = headers

  return useMutation({
    mutationFn: async (comunidadeId: string) => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}/solicitar`, {
        method: 'POST',
        headers: headersAuth,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao solicitar entrada')
      }
      return res.json()
    },
    onSuccess: (_data, comunidadeId) => {
      qc.invalidateQueries({ queryKey: ['comunidades', comunidadeId, 'solicitacoes'] })
      toast('info', 'Solicitação enviada', 'Aguarde a aprovação dos moderadores.')
    },
    onError: (error: Error) => {
      const infoKeys = ['JA_MEMBRO', 'SOLICITACAO_PENDENTE', 'COMUNIDADE_PUBLICA']
      const msgs: Record<string, string> = {
        JA_MEMBRO:            'Você já é membro desta comunidade.',
        SOLICITACAO_PENDENTE: 'Você já enviou uma solicitação. Aguarde a aprovação.',
        COMUNIDADE_PUBLICA:   'Esta comunidade é pública, entre diretamente.',
      }
      const msg = msgs[error.message]
      if (msg && infoKeys.includes(error.message)) {
        toast('info', msg)
      } else {
        toast('error', 'Erro ao solicitar entrada', msg ?? error.message)
      }
    }
  })
}

// ─── Responder solicitação

export function useResponderSolicitacao(comunidadeId: string) {
  const qc = useQueryClient()
  const headers = useAuthHeaders()
  const {toast} = useToast()

  return useMutation({
    mutationFn: async ({ solicitacaoId, aceitar }: { solicitacaoId: string; aceitar: boolean }) => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}/solicitacoes/${solicitacaoId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ aceitar }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao responder solicitação')
      }
      return res.json()
    },
    onSuccess: (_data, { aceitar }) => {
      qc.invalidateQueries({ queryKey: ['comunidades', comunidadeId, 'solicitacoes'] })
      qc.invalidateQueries({ queryKey: ['comunidades', comunidadeId, 'detalhes'] })
      toast('success', aceitar ? 'Solicitação aceita' : 'Solicitação recusada')
    },
    onError: () => {
      toast('error', 'Erro ao responder solicitação')
    }
  })
}

// ─── Expulsar membro

export function useExpulsarMembro(comunidadeId: string) {
  const qc = useQueryClient()
  const headers = useAuthHeaders()
  const {toast} = useToast()
  const { 'Content-Type': _, ...headersAuth } = headers

  return useMutation({
    mutationFn: async (membroId: string) => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}/membros/${membroId}`, {
        method: 'DELETE',
        headers: headersAuth,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao expulsar membro')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comunidades', comunidadeId, 'detalhes'] })
      qc.invalidateQueries({ queryKey: ['comunidades', comunidadeId, 'ranking'] })
      toast('success', 'Membro expulso')
    },
    onError: (error: Error) => {
      const msgs: Record<string, string> = { SEM_PERMISSAO: 'Você não tem permissão para isso.' }
      toast('error', 'Erro ao expulsar membro', msgs[error.message] ?? error.message)
    }
  })
}

// ─── Promover / rebaixar membro

export function usePromoverMembro(comunidadeId: string) {
  const qc = useQueryClient()
  const headers = useAuthHeaders()
  const {toast} = useToast()

  return useMutation({
    mutationFn: async (body: PromoverMembroBody) => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}/membros/promover`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao alterar cargo')
      }
      return res.json()
    },
    onSuccess: (_data, { role }) => {
      qc.invalidateQueries({ queryKey: ['comunidades', comunidadeId, 'detalhes'] })
      toast('success', role === 'MODERADOR' ? 'Membro promovido a moderador' : 'Membro rebaixado')
    },
    onError: (error: Error) => {
      const msgs: Record<string, string> = { SEM_PERMISSAO: 'Apenas o dono pode alterar cargos.' }
      toast('error', 'Erro ao alterar cargo', msgs[error.message] ?? error.message)
    }

  })
}

// ─── Deletar comunidade

export function useDeletarComunidade() {
  const qc = useQueryClient()
  const headers = useAuthHeaders()
  const {toast} = useToast()
  const { 'Content-Type': _, ...headersAuth } = headers

  return useMutation({
    mutationFn: async (comunidadeId: string) => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}`, {
        method: 'DELETE',
        headers: headersAuth,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao deletar comunidade')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comunidades'] })
      toast('success', 'Comunidade deletada')
    },
    onError: (error: Error) => {
      const msgs: Record<string, string> = { SEM_PERMISSAO: 'Apenas o dono pode deletar a comunidade.' }
      toast('error', 'Erro ao deletar comunidade', msgs[error.message] ?? error.message)
    }
  })
}

// Alterar tipo da comunidade (pública/privada)

export function useAlterarTipoComunidade(comunidadeId: string) {
  const qc = useQueryClient()
  const headers = useAuthHeaders()
  const {toast} = useToast()

  return useMutation({
    mutationFn: async (tipo: TipoComunidade) => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}/tipo`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ tipo }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao alterar tipo')
      }
      return res.json()
    },
    onSuccess: (_data, tipo) => {
      qc.invalidateQueries({ queryKey: ['comunidades', comunidadeId, 'detalhes'] })
      qc.invalidateQueries({ queryKey: ['comunidades'] })
      toast('success', tipo === 'PRIVADA' ? 'Comunidade agora é privada' : 'Comunidade agora é pública')
    },
    onError: (error: Error) => {
      const msgs: Record<string, string> = { SEM_PERMISSAO: 'Apenas o dono pode alterar o tipo.' }
      toast('error', 'Erro ao alterar tipo', msgs[error.message] ?? error.message)
    },
  })
}

// ─── Atualizar nome/descrição da comunidade

export function useAtualizarComunidade(comunidadeId: string) {
  const qc = useQueryClient()
  const headers = useAuthHeaders()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (body: { nome?: string; descricao?: string }) => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao atualizar comunidade')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comunidades', comunidadeId, 'detalhes'] })
      qc.invalidateQueries({ queryKey: ['comunidades'] })
      toast('success', 'Comunidade atualizada!')
    },
    onError: (error: Error) => {
      const msgs: Record<string, string> = { SEM_PERMISSAO: 'Apenas o dono pode editar a comunidade.' }
      toast('error', 'Erro ao atualizar', msgs[error.message] ?? error.message)
    },
  })
}

// sair da comunidade

export function useSairComunidade() {
  const qc = useQueryClient()
  const {toast} = useToast()
  const { 'Content-Type': _, ...headersAuth } = useAuthHeaders()

  return useMutation({
    mutationFn: async (comunidadeId: string) => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}/sair`, {
        method: 'DELETE',
        headers: headersAuth,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao sair da comunidade')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comunidades'] })
      toast('success', 'Você saiu da comunidade')
    },
    onError: (error: Error) => {
      const msgs: Record<string, string> = { DONO_NAO_PODE_SAIR: 'O dono não pode sair da própria comunidade.' }
      toast('error', 'Erro ao sair', msgs[error.message] ?? error.message)
    }
  })
}