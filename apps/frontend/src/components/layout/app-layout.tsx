import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
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
import { useAuth } from '@/hooks/use-auth'

const navPrincipal = [
  { titulo: 'Painel', href: '/dashboard', icone: LayoutDashboard },
  { titulo: 'Jogos e Palpites', href: '/jogos', icone: ClipboardList },
  { titulo: 'Meus Palpites', href: '/meus-palpites', icone: ClipboardList },
  { titulo: 'Ranking', href: '/ranking', icone: Trophy },
]

const navGrafos = [
  { titulo: 'Grafo de Confrontos', href: '/grafos/confrontos', icone: GitFork },
  { titulo: 'Caminho Mínimo', href: '/grafos/dag', icone: Network },
  { titulo: 'Cliques', href: '/grafos/cliques', icone: Layers },
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

  const navigate = useNavigate()
  const isAtivo = (href: string) => location.pathname.startsWith(href)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="h-16 border-b p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
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
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 w-full rounded-lg p-2 hover:bg-sidebar-accent transition-colors">
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
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-16 flex items-center gap-2 border-b px-4 h-14 shrink-0">
            <SidebarTrigger />
            <div className="flex-1" />
            <ThemeToggle />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}