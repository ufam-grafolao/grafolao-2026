import { useLocation, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Trophy,
  GitFork,
  Network,
  Layers,
  Settings,
  LogOut,
  ChevronDown,
  Users,
  Bell,
  BellOff,
  Loader2,
  HelpCircle,
  Star
} from 'lucide-react'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from './theme-toggle'
import { PalpitesEspeciaisBanner } from './palpites-especiais-banner'
import { useAuth } from '@/hooks/use-auth'
import ufamLogo from '@/assets/UFAM.png'

const navPrincipal = [
  { titulo: 'Painel', href: '/dashboard', icone: LayoutDashboard },
  { titulo: 'Jogos e Palpites', href: '/jogos', icone: ClipboardList },
  { titulo: 'Meus Palpites', href: '/meus-palpites', icone: ClipboardList },
  { titulo: 'Palpites Especiais', href: '/palpites-especiais', icone: Star },
  { titulo: 'Ranking', href: '/ranking', icone: Trophy },
  { titulo: 'Grupos', href: '/comunidades', icone: Users },
  { titulo: 'Ajuda', href: '/ajuda', icone: HelpCircle },
]

const navGrafos = [
  { titulo: 'Grafo de Confrontos', href: '/grafos/confrontos', icone: GitFork },
  { titulo: 'Caminho Mínimo para o Título', href: '/grafos/dag', icone: Network },
  { titulo: 'Cliques e Panelinhas', href: '/grafos/cliques', icone: Layers },
  { titulo: 'Aventura da Zebra', href: '/grafos/mst', icone: Layers },
  { titulo: 'Redes de Similaridades', href: '/grafos/redes', icone: Layers },
]

const navAdmin = [
  { titulo: 'Administração', href: '/admin', icone: Settings },
]

function getIniciais(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function AppLayout() {
  const { usuario, logout, isAdmin } = useAuth()
  const location = useLocation()
  const { estado, processando, ativar, desativar } = usePushNotifications()

  const navigate = useNavigate()
  const isAtivo = (href: string) => location.pathname.startsWith(href)

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar>
          <SidebarHeader className="h-16 border-b p-4">
            <div className="flex items-center gap-3">
              <img src={ufamLogo} alt="UFAM" className="h-8 w-8 shrink-0 object-contain" />
              <div>
                <p className="font-semibold text-sm leading-none">Grafolão</p>
                <p className="text-xs text-muted-foreground mt-1">Copa 2026</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navPrincipal.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isAtivo(item.href)}
                        onClick={() => navigate(item.href)}
                      >
                        <item.icone className="h-4 w-4" />
                        <span>{item.titulo}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Análise de Grafos</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navGrafos.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isAtivo(item.href)}
                        onClick={() => navigate(item.href)}
                      >
                        <item.icone className="h-4 w-4" />
                        <span>{item.titulo}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {isAdmin() && (
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navAdmin.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton 
                            isActive={isAtivo(item.href)}
                            onClick={() => navigate(item.href)}
                        >
                            <item.icone className="h-4 w-4" />
                            <span>{item.titulo}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t p-2">
            {estado !== 'sem-suporte' && estado !== 'negado' && (
              <button
                onClick={estado === 'inscrito' ? desativar : ativar}
                disabled={estado === 'carregando' || processando}
                title={estado === 'inscrito' ? 'Desativar notificações' : 'Ativar notificações'}
                className="cursor-pointer flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {processando
                  ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Aguarde...</span></>
                  : estado === 'inscrito'
                    ? <><Bell className="h-4 w-4 text-primary" /><span>Notificações ativas</span></>
                    : <><BellOff className="h-4 w-4" /><span>Ativar notificações</span></>
                }
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer flex items-center gap-3 w-full rounded-lg p-2 hover:bg-sidebar-accent transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={usuario?.avatarUrl ?? ''} alt={usuario?.nome} />
                    <AvatarFallback className="text-xs">
                      {usuario ? getIniciais(usuario.nome) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{usuario?.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{usuario?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="h-16 justify-between flex items-center gap-2 border-b px-4 shrink-0">
            <SidebarTrigger />
            <div className="flex-1 text-center">
              <h1>Grafolão da Copa: Torneio de Palpiteiros</h1>
            </div>
            <ThemeToggle />
          </header>
          <PalpitesEspeciaisBanner />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
          <footer className="border-t px-6 py-3 flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <img src={ufamLogo} alt="UFAM" className="h-6 w-6 shrink-0 object-contain" />
            <span>Grafolão da Copa · IComp/UFAM · 2026</span>
            <span className="text-border">·</span>
            <a href="/sobre" className="hover:text-foreground transition-colors">Sobre o projeto</a>
            <span className="text-border">·</span>
            <a href="/ajuda" className="hover:text-foreground transition-colors">Ajuda</a>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  )
}