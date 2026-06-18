import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getBandeira } from '@/lib/bandeiras'
import { useJogosPendentes } from '@/hooks/use-jogos-pendentes'
import { useInserirResultado } from '@/hooks/use-resultado'
import { useAdminStats } from '@/hooks/use-admin-stats'
import { useAdminPush } from '@/hooks/use-admin-push'
import { Loader2, Plus, X, Users, ClipboardList, Star, Search, Bell } from 'lucide-react'
import { JogoPendente } from '@/types/jogo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useJogosEncerrados } from '@/hooks/use-jogos-encerrados'
import { formatarDataHoraJogo } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Bandeira({ nome }: { nome: string }) {
  const codigo = getBandeira(nome)
  if (!codigo) return null
  return <span className={`fi fi-${codigo} text-xl`} aria-label={nome} />
}

// ─── Formulário de resultado ──────────────────────────────────────────────────

interface FormResultadoProps {
  jogo: JogoPendente & {
    resultado?: {
      golsCasa: number
      golsVisitante: number
      artilheirosCasa: string[]
      artilheirosVisitante: string[]
    } | null
  }
  onFechar: () => void
}

function FormResultado({ jogo, onFechar }: FormResultadoProps) {
  const { mutate: inserir, isPending } = useInserirResultado()

  const nomeCasa      = jogo.timeCasa?.nome      ?? jogo.timeCasaRef      ?? '?'
  const nomeVisitante = jogo.timeVisitante?.nome ?? jogo.timeVisitanteRef ?? '?'

  const [golsCasa,      setGolsCasa]      = useState(String(jogo.resultado?.golsCasa      ?? ''))
  const [golsVisitante, setGolsVisitante] = useState(String(jogo.resultado?.golsVisitante ?? ''))
  const [artCasa,       setArtCasa]       = useState<string[]>(jogo.resultado?.artilheirosCasa      ?? [])
  const [artVisitante,  setArtVisitante]  = useState<string[]>(jogo.resultado?.artilheirosVisitante ?? [])
  const [novoArtCasa,       setNovoArtCasa]       = useState('')
  const [novoArtVisitante,  setNovoArtVisitante]  = useState('')

  function adicionarArtilheiro(lado: 'casa' | 'visitante') {
    if (lado === 'casa' && novoArtCasa.trim()) {
      setArtCasa(prev => [...prev, novoArtCasa.trim()])
      setNovoArtCasa('')
    }
    if (lado === 'visitante' && novoArtVisitante.trim()) {
      setArtVisitante(prev => [...prev, novoArtVisitante.trim()])
      setNovoArtVisitante('')
    }
  }

  function removerArtilheiro(lado: 'casa' | 'visitante', idx: number) {
    if (lado === 'casa')      setArtCasa(prev => prev.filter((_, i) => i !== idx))
    if (lado === 'visitante') setArtVisitante(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit() {
    const casa      = parseInt(golsCasa)
    const visitante = parseInt(golsVisitante)

    if (isNaN(casa) || isNaN(visitante) || casa < 0 || visitante < 0) {
      alert('Insira um placar válido.')
      return
    }

    inserir(
      {
        jogoId: jogo.id,
        golsCasa: casa,
        golsVisitante: visitante,
        artilheirosCasa: artCasa,
        artilheirosVisitante: artVisitante,
      },
      {
        onSuccess: onFechar,
        onError: (err) => alert(err.message),
      }
    )
  }

  return (
    <Card className="border-primary/40">
      <CardContent className="pt-4 pb-4 flex flex-col gap-4">

        {/* Times */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bandeira nome={nomeCasa} />
            <span className="font-medium text-sm">{nomeCasa}</span>
          </div>
          <span className="text-xs text-muted-foreground">vs</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{nomeVisitante}</span>
            <Bandeira nome={nomeVisitante} />
          </div>
        </div>

        {/* Placar */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Placar final</p>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={20}
              placeholder="0"
              value={golsCasa}
              onChange={e => setGolsCasa(e.target.value)}
              className="w-16 text-center text-lg font-semibold"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={0}
              max={20}
              placeholder="0"
              value={golsVisitante}
              onChange={e => setGolsVisitante(e.target.value)}
              className="w-16 text-center text-lg font-semibold"
            />
          </div>
        </div>

        {/* Artilheiros */}
        <div className="grid grid-cols-2 gap-4">
          {/* Casa */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Artilheiros — {nomeCasa}</p>
            <div className="flex flex-col gap-1 mb-2">
              {artCasa.map((nome, idx) => (
                <div key={idx} className="flex items-center justify-between gap-1 text-xs bg-muted/40 rounded px-2 py-1">
                  <span>⚽ {nome}</span>
                  <button onClick={() => removerArtilheiro('casa', idx)}>
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                placeholder="Nome do jogador"
                value={novoArtCasa}
                onChange={e => setNovoArtCasa(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && adicionarArtilheiro('casa')}
                className="h-7 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2"
                onClick={() => adicionarArtilheiro('casa')}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Visitante */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Artilheiros — {nomeVisitante}</p>
            <div className="flex flex-col gap-1 mb-2">
              {artVisitante.map((nome, idx) => (
                <div key={idx} className="flex items-center justify-between gap-1 text-xs bg-muted/40 rounded px-2 py-1">
                  <span>⚽ {nome}</span>
                  <button onClick={() => removerArtilheiro('visitante', idx)}>
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                placeholder="Nome do jogador"
                value={novoArtVisitante}
                onChange={e => setNovoArtVisitante(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && adicionarArtilheiro('visitante')}
                className="h-7 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2"
                onClick={() => adicionarArtilheiro('visitante')}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onFechar}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isPending || !golsCasa || !golsVisitante}
          >
            {isPending ? (
              <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Salvando...</>
            ) : (
              'Confirmar resultado'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Card de jogo pendente ────────────────────────────────────────────────────

interface JogoPendenteCardProps {
  jogo: JogoPendente
}

function JogoPendenteCard({ jogo }: JogoPendenteCardProps) {
  const [aberto, setAberto] = useState(false)

  const nomeCasa      = jogo.timeCasa?.nome      ?? jogo.timeCasaRef      ?? '?'
  const nomeVisitante = jogo.timeVisitante?.nome ?? jogo.timeVisitanteRef ?? '?'

  if (aberto) {
    return <FormResultado jogo={jogo} onFechar={() => setAberto(false)} />
  }

  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardContent className="pt-3 pb-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {jogo.grupo ?? 'Mata-mata'} · {jogo.rodada}
          </span>
          <Badge variant="secondary" className="text-xs">
            {formatarDataHoraJogo(jogo.dataHora)}
          </Badge>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1">
            <Bandeira nome={nomeCasa} />
            <span className="text-sm font-medium">{nomeCasa}</span>
          </div>
          <span className="text-xs text-muted-foreground">vs</span>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="text-sm font-medium">{nomeVisitante}</span>
            <Bandeira nome={nomeVisitante} />
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => setAberto(true)}
        >
          Inserir resultado
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Aba de estatísticas ──────────────────────────────────────────────────────

function getIniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function TabEstatisticas() {
  const { data, isLoading } = useAdminStats()
  const [busca, setBusca] = useState('')

  const usuariosFiltrados = (data?.palpitesPorUsuario ?? []).filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 mt-4">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Usuários ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading
              ? <Skeleton className="h-9 w-16" />
              : <p className="text-3xl font-semibold">{data?.totalUsuarios ?? 0}</p>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Palpites feitos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading
              ? <Skeleton className="h-9 w-16" />
              : <p className="text-3xl font-semibold">{data?.totalPalpites ?? 0}</p>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" /> Palpites especiais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading
              ? <Skeleton className="h-9 w-16" />
              : <p className="text-3xl font-semibold">{data?.totalEspeciais ?? 0}</p>
            }
          </CardContent>
        </Card>
      </div>

      {/* Tabela por usuário */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Palpites por usuário</h2>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar usuário..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {usuariosFiltrados.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </p>
              ) : (
                usuariosFiltrados.map((u, idx) => (
                  <div key={u.usuarioId} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-6 text-xs text-muted-foreground text-right shrink-0">
                      {idx + 1}
                    </span>
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={u.avatarUrl ?? ''} alt={u.nome} />
                      <AvatarFallback className="text-[10px]">{getIniciais(u.nome)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs text-right">
                      <div className="hidden sm:block text-muted-foreground">
                        <span>{u.palpites} normais</span>
                        <span className="mx-1">·</span>
                        <span>{u.especiais} especiais</span>
                      </div>
                      <Badge variant="secondary" className="min-w-12 justify-center">
                        {u.total} total
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── Aba de notificações push ─────────────────────────────────────────────────

function TabNotificacoes() {
  const { data, isLoading } = useAdminPush()
  const [busca, setBusca] = useState('')

  const filtrados = (data?.assinantes ?? []).filter(a =>
    a.usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.usuario.email.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="flex items-center gap-3">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" /> Assinantes ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading
              ? <Skeleton className="h-9 w-16" />
              : <p className="text-3xl font-semibold">{data?.total ?? 0}</p>
            }
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Quem está recebendo notificações</h2>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar usuário..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {filtrados.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {busca ? 'Nenhum usuário encontrado.' : 'Nenhum assinante ainda.'}
                </p>
              ) : (
                filtrados.map(a => (
                  <div key={a.subscriptionId} className="flex items-center gap-3 px-4 py-2.5">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={a.usuario.avatarUrl ?? ''} alt={a.usuario.nome} />
                      <AvatarFallback className="text-[10px]">{getIniciais(a.usuario.nome)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.usuario.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.usuario.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      desde {new Date(a.criadoEm).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: jogosPendentes, isLoading } = useJogosPendentes()
  const { data: jogosEncerrados, isLoading: loadingEncerrados } = useJogosEncerrados()

  return (
    <Tabs defaultValue="pendentes" className="w-full">
      <TabsList variant="line">
        <TabsTrigger value="pendentes">
          Pendentes
          {jogosPendentes && jogosPendentes.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">({jogosPendentes.length})</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="encerrados">Encerrados</TabsTrigger>
        <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
      </TabsList>

      <TabsContent className="mt-4" value="pendentes">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : jogosPendentes && jogosPendentes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jogosPendentes.map(jogo => (
              <JogoPendenteCard key={jogo.id} jogo={jogo} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              Todos os jogos já têm resultado inserido. ✅
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent className="mt-4" value="encerrados">
        {loadingEncerrados ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : jogosEncerrados && jogosEncerrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jogosEncerrados.map(jogo => (
              <JogoPendenteCard key={jogo.id} jogo={jogo} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              Nenhum jogo encerrado ainda.
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="stats">
        <TabEstatisticas />
      </TabsContent>

      <TabsContent value="notificacoes">
        <TabNotificacoes />
      </TabsContent>
    </Tabs>
  )
}