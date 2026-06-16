import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/env'

export function LoginPage() {
  const { isAutenticado } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAutenticado()) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAutenticado, navigate])

  const handleLogin = () => {
    window.location.href = `${API_URL}/auth/google`
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0a3d1f' }}>

      {/* Blobs de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -left-16 w-52 h-52 rounded-full" style={{ background: '#0f5c2e' }} />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full" style={{ background: '#0f5c2e' }} />
        <div className="absolute top-8 right-16 w-32 h-32 rounded-full" style={{ background: '#1a7a40', opacity: 0.5 }} />

        {/* Losango externo */}
        <div className="absolute" style={{
          width: 480, height: 480,
          border: '1.5px solid rgba(245,208,0,0.15)',
          borderRadius: 24,
          transform: 'rotate(45deg)',
          top: '50%', left: '50%',
          marginTop: -240, marginLeft: -240,
        }} />
        {/* Losango interno */}
        <div className="absolute" style={{
          width: 300, height: 300,
          border: '1px solid rgba(245,208,0,0.08)',
          borderRadius: 16,
          transform: 'rotate(45deg)',
          top: '50%', left: '50%',
          marginTop: -150, marginLeft: -150,
        }} />
      </div>

      {/* Card central — fundo mais visível */}
      <div
        className="relative z-10 flex flex-col items-center w-full max-w-sm mx-4"
        style={{
          padding: '44px 40px 36px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 20,
        }}
      >
        {/* Troféu com glow */}
        <div
          className="flex items-center justify-center rounded-full mb-5"
          style={{
            width: 72, height: 72,
            background: '#f5d000',
            WebkitBoxShadow: '0 0 0 8px rgba(245,208,0,0.15), 0 0 0 16px rgba(245,208,0,0.06)',
            boxShadow: '0 0 0 8px rgba(245,208,0,0.15), 0 0 0 16px rgba(245,208,0,0.06)',
          }}
        >
          <span style={{ fontSize: 32 }}>🏆</span>
        </div>

        {/* Tag Copa 2026 */}
        <div
          className="flex items-center gap-1 mb-4 font-medium uppercase tracking-wider"
          style={{
            fontSize: 10,
            background: 'rgba(245,208,0,0.12)',
            border: '1px solid rgba(245,208,0,0.25)',
            color: 'rgba(245,208,0,0.80)',
            padding: '3px 10px',
            borderRadius: 20,
          }}
        >
          🌍 Copa 2026
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold tracking-tight text-center mb-1.5" style={{ color: '#f5d000' }}>
          Grafolão 2026
        </h1>

        {/* Subtítulo */}
        <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Bolão da Copa do Mundo<br />com análise de grafos
        </p>

        {/* Traços da bandeira */}
        <div className="flex gap-1 mb-6">
          <div className="rounded-full" style={{ width: 32, height: 3, background: '#009c3b' }} />
          <div className="rounded-full" style={{ width: 32, height: 3, background: '#f5d000' }} />
          <div className="rounded-full" style={{ width: 32, height: 3, background: '#002776' }} />
        </div>

        {/* Divisor */}
        <div className="w-full mb-6" style={{ height: 1, background: 'rgba(255,255,255,0.12)' }} />

        {/* Botão Google */}
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-5 text-sm font-semibold cursor-pointer mb-5"
          style={{
            background: '#fff',
            color: '#1a1a1a',
            borderRadius: 10,
            border: 'none',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Entrar com Google
        </button>

        {/* Footer */}
        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.28)', letterSpacing: '0.3px' }}>
          Copa do Mundo 2026 · UFAM ICC041
        </p>
      </div>
    </div>
  )
}