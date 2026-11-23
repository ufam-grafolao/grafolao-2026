import { Link, Outlet, useLocation } from 'react-router-dom'
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
  Star,
  GitBranch,
  type LucideIcon,
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
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from './theme-toggle'
import { PalpitesEspeciaisBanner } from './palpites-especiais-banner'
import { MataMataModal } from './mata-mata-modal'
import { LimiteDeErro } from './limite-de-erro'
import { ErroPagina } from '@/components/estados/erro-pagina'
import { useAuth } from '@/hooks/use-auth'
import ufamLogo from '@/assets/UFAM.png'

interface ItemNav {
  titulo: string
  href: string
  icone: LucideIcon
}

const navPrincipal: ItemNav[] = [
  { titulo: 'Painel', href: '/dashboard', icone: LayoutDashboard },
  { titulo: 'Jogos e Palpites', href: '/jogos', icone: ClipboardList },
  { titulo: 'Meus Palpites', href: '/meus-palpites', icone: ClipboardList },
  { titulo: 'Palpites Especiais', href: '/palpites-especiais', icone: Star },
  { titulo: 'Chaveamento', href: '/chaveamento', icone: GitBranch },
  { titulo: 'Ranking', href: '/ranking', icone: Trophy },
  { titulo: 'Grupos', href: '/comunidades', icone: Users },
  { titulo: 'Ajuda', href: '/ajuda', icone: HelpCircle },
]

const navGrafos: ItemNav[] = [
  { titulo: 'Grafo de Confrontos', href: '/grafos/confrontos', icone: GitFork },
  { titulo: 'Caminho Mínimo para o Título', href: '/grafos/dag', icone: Network },
  { titulo: 'Cliques e Panelinhas', href: '/grafos/cliques', icone: Layers },
  { titulo: 'Aventura da Zebra', href: '/grafos/mst', icone: Layers },
  { titulo: 'Redes de Similaridades', href: '/grafos/redes', icone: Layers },
]

const navAdmin: ItemNav[] = [{ titulo: 'Administração', href: '/admin', icone: Settings }]

function getIniciais(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

/** Um grupo do menu lateral. Os itens são links de verdade (abrem em nova aba, mostram a página atual). */
function GrupoNav({ rotulo, itens }: { rotulo: string; itens: ItemNav[] }) {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{rotulo}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {itens.map((item) => {
            const ativo = pathname.startsWith(item.href)
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={ativo}
                  className="h-11 text-[15px] md:h-9 md:text-sm"
                  render={
                    <Link
                      to={item.href}
                      aria-current={ativo ? 'page' : undefined}
                      // No celular, a gaveta fecha ao escolher um destino
                      onClick={() => isMobile && setOpenMobile(false)}
                    />
                  }
                >
                  <item.icone className="size-4" aria-hidden />
                  <span>{item.titulo}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function BotaoNotificacoes() {
  const { estado, processando, ativar, desativar } = usePushNotifications()
  if (estado === 'sem-suporte' || estado === 'negado') return null
  const inscrito = estado === 'inscrito'

  return (
    <button
      type="button"
      onClick={inscrito ? desativar : ativar}
      disabled={estado === 'carregando' || processando}
      className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-[background-color,color] duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 md:min-h-9"
    >
      {processando ? (
        <>
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          <span>Aguarde…</span>
        </>
      ) : inscrito ? (
        <>
          <Bell className="size-4 text-primary" aria-hidden />
          <span>Notificações ativas</span>
        </>
      ) : (
        <>
          <BellOff className="size-4" aria-hidden />
          <span>Ativar notificações</span>
        </>
      )}
    </button>
  )
}

function MenuUsuario() {
  const { usuario, logout } = useAuth()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Conta de ${usuario?.nome ?? 'usuário'}`}
        className="flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-left transition-[background-color] duration-150 hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
      >
        <Avatar className="size-8">
          <AvatarImage src={usuario?.avatarUrl ?? ''} alt="" />
          <AvatarFallback className="text-xs">{usuario ? getIniciais(usuario.nome) : '?'}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{usuario?.nome}</span>
          <span className="block truncate text-xs text-muted-foreground">{usuario?.email}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuItem onClick={logout} className="min-h-11 cursor-pointer text-destructive md:min-h-8">
          <LogOut className="size-4" aria-hidden />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppLayout() {
  const { isAdmin } = useAuth()
  const { pathname } = useLocation()

  return (
    <SidebarProvider>
      {/* Primeiro alvo do Tab: pula o menu e vai direto ao conteúdo */}
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Pular para o conteúdo
      </a>
      <div className="flex h-dvh w-full overflow-hidden">
        <Sidebar>
          <SidebarHeader className="h-16 justify-center border-b px-4">
            <Link
              to="/dashboard"
              className="flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <img src={ufamLogo} alt="" className="size-8 shrink-0 object-contain" />
              <span>
                <span className="block font-display text-xl font-bold leading-none">Grafolão</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">Copa 2026 · IComp/UFAM</span>
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <nav aria-label="Menu principal" className="contents">
              <GrupoNav rotulo="Principal" itens={navPrincipal} />
              <GrupoNav rotulo="Análise de grafos" itens={navGrafos} />
              {isAdmin() && <GrupoNav rotulo="Admin" itens={navAdmin} />}
            </nav>
          </SidebarContent>

          <SidebarFooter className="gap-1 border-t p-2">
            <BotaoNotificacoes />
            <MenuUsuario />
          </SidebarFooter>
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4">
            <SidebarTrigger className="size-11 [&_svg]:size-5" />
            {/* Nome do app: não é o título da tela (cada página tem o seu único <h1>) */}
            <p className="min-w-0 flex-1 truncate text-center font-display text-lg font-semibold sm:text-xl">
              Grafolão da Copa<span className="hidden sm:inline">: Torneio de Palpiteiros</span>
            </p>
            <ThemeToggle />
          </header>
          <PalpitesEspeciaisBanner />
          <MataMataModal />
          <main id="conteudo" tabIndex={-1} className="flex-1 overflow-auto p-4 outline-none sm:p-6">
            {/* Uma página que falha mostra o erro aqui; menu e cabeçalho continuam. Reinicia ao trocar de rota. */}
            <LimiteDeErro key={pathname} fallback={(tentarDeNovo) => <ErroPagina onTentarDeNovo={tentarDeNovo} />}>
              <Outlet />
            </LimiteDeErro>
          </main>
          <footer className="flex shrink-0 flex-wrap items-center gap-x-3 border-t px-4 py-1 text-xs text-muted-foreground sm:px-6">
            <img src={ufamLogo} alt="" className="size-6 shrink-0 object-contain" />
            <span>Grafolão da Copa · IComp/UFAM · 2026</span>
            <span aria-hidden>·</span>
            <Link to="/sobre" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:min-h-8">
              Sobre o projeto
            </Link>
            <span aria-hidden>·</span>
            <Link to="/ajuda" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:min-h-8">
              Ajuda
            </Link>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  )
}
