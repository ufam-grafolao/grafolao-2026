import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/env'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

interface ApiFetchOptions extends RequestInit {
  skipAuthRedirect?: boolean
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { token, logout } = useAuth.getState()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401 && !options.skipAuthRedirect) {
    logout()

    if (window.location.pathname !== '/login') {
      window.location.href = '/login?erro=sessao_expirada'
    }

    throw new ApiError('Sessão expirada — faça login novamente', 401)
  }

  if (!res.ok) {
    let mensagem = 'Erro na requisição'
    try {
      const body = await res.json()
      mensagem = body.error ?? mensagem
    } catch {
      // resposta sem JSON, mantém mensagem genérica
    }
    throw new ApiError(mensagem, res.status)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}