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
import PalpitesEspeciaisPage from './pages/palpites-especiais'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import Comunidades from './pages/comunidades'
import ComunidadeDetalhePage from './pages/comunidade-detalhe'
import RankingPage from './pages/ranking'
import AjudaPage from './pages/ajuda'
import SobrePage from './pages/sobre'
import ChaveamentoPage from './pages/chaveamento'
import { Loader2 } from 'lucide-react'

function GlobalLoading() {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  const isActive = isFetching > 0 || isMutating > 0

  return (
    <div
      className={`fixed top-0 left-0 z-9999 h-0.5 bg-primary transition-all duration-300 ${
        isActive ? 'w-full opacity-100' : 'w-0 opacity-0'
      }`}
    />
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
            <Route path="/palpites-especiais" element={<PalpitesEspeciaisPage />} />
            <Route path="/jogos" element={<JogosPalpitesPage/>} />
            <Route path='comunidades' element={<Comunidades/>}/>
            <Route path='comunidades/:comunidadeId' element={<ComunidadeDetalhePage/>}/>
            <Route path="/chaveamento" element={<ChaveamentoPage />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/ajuda" element={<AjudaPage />} />
            <Route path="/sobre" element={<SobrePage />} />
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