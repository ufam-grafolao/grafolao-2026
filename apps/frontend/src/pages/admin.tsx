import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getBandeira } from '@/lib/bandeiras'
import { useJogosPendentes } from '@/hooks/use-jogos-pendentes'
import { useInserirResultado } from '@/hooks/use-resultado'
import { Loader2, Plus, X } from 'lucide-react'
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
    </Tabs>
  )
}