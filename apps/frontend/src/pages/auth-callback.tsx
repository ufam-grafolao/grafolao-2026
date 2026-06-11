import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/env'
import { QueryClient } from '@tanstack/react-query'
import { useAuthMe } from '@/hooks/use-auth-me'

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const token = searchParams.get('token')
  const erro = searchParams.get('erro')

  const { data: usuario, isLoading, error } = useAuthMe(token)

  useEffect(() => {

    if (erro) {
      navigate(`/login?erro=${erro}`, { replace: true })
      return
    }

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    if (usuario) {
      setAuth(token, usuario)
      navigate('/dashboard', { replace: true })
    }

    if (error) {
      navigate(`/login?erro=falha_autenticacao`, { replace: true })
    }
    
  }, [token, erro, error, usuario, navigate, setAuth])



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-bounce">⚽</span>
          <p className="text-muted-foreground text-sm">Entrando no Grafolão...</p>
        </div>
      </div>
    )
  }

  return null
}