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

export default function App() {
  return (
    <ThemeProvider>
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
            <Route path="/ranking" element={<div>Ranking — em breve</div>} />
            <Route path="/grafos/confrontos" element={<div>Grafo de Confrontos — em breve</div>} />
            <Route path="/grafos/dag" element={<div>Caminho Mínimo — em breve</div>} />
            <Route path="/grafos/cliques" element={<div>Cliques — em breve</div>} />

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