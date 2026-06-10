import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/env'

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const erro = searchParams.get('erro')

    if (erro) {
      navigate(`/login?erro=${erro}`, { replace: true })
      return
    }

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    // Busca dados do usuário com o token
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((usuario) => {
        setAuth(token, usuario)
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        navigate('/login?erro=falha_autenticacao', { replace: true })
      })
  }, [searchParams, navigate, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="text-4xl animate-bounce">⚽</span>
        <p className="text-muted-foreground text-sm">Entrando no Grafolão...</p>
      </div>
    </div>
  )
}