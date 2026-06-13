import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { AppLayout } from '@/components/layout/app-layout'
import { RotaProtegida } from '@/components/layout/rota-protegida'
import { LoginPage } from '@/pages/login'
import { AuthCallbackPage } from '@/pages/auth-callback'
import { DashboardPage } from '@/pages/dashboard'
import JogosPalpitesPage from './pages/jogos-palpites'
import AdminPage from './pages/admin'
import MeusPalpitesPage from './pages/meus-palpites'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import Comunidades from './pages/comunidades'
import ComunidadeDetalhePage from './pages/comunidade-detalhe'
import { Loader2 } from 'lucide-react'

function GlobalLoading() {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()

  if (!isFetching && !isMutating) return null
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <GlobalLoading />
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Rotas protegidas */}
          <Route
            element={
              <RotaProtegida>
                <AppLayout />
              </RotaProtegida>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/meus-palpites" element={<MeusPalpitesPage />} />
            <Route path="/jogos" element={<JogosPalpitesPage/>} />
            <Route path='comunidades' element={<Comunidades/>}/>
            <Route path='comunidades/:comunidadeId' element={<ComunidadeDetalhePage/>}/>
            {/* <Route path="/ranking" element={<div>Ranking — em breve</div>} /> */}
            <Route path="/grafos/confrontos" element={<div>Grafo de Confrontos - Duelo de Palpiteiros — em breve</div>} />
            <Route path="/grafos/dag" element={<div>Caminho Mínimo — em breve</div>} />
            <Route path="/grafos/cliques" element={<div>Cliques e Panelinhas - Comunidades Máximas — em breve</div>} />
            <Route path="/grafos/mst" element={<div>Aventura da Zebra -  MST da Divergência — em breve</div>} />
            <Route path="/grafos/redes" element={<div>Redes de Similaridades - Laços de Palpites — em breve</div>} />

            {/* Rota admin */}
            <Route
              path="/admin"
              element={
                <RotaProtegida apenasAdmin>
                  <AdminPage/>
                </RotaProtegida>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}