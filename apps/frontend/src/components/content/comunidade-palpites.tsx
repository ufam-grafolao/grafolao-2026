import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useComunidadePalpites, type JogoComPalpites, type PalpiteMembro } from '@/hooks/use-comunidade-palpites'
import { getBandeira } from '@/lib/bandeiras'
import { getNomePt } from '@/lib/nomes-times'
import { formatarDataHoraJogo } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function Bandeira({ nome }: { nome: string }) {
  const codigo = getBandeira(nome)
  if (!codigo) return null
  return <span className={`fi fi-${codigo}`} aria-label={nome} />
}

function MembroAvatar({ nome, avatarUrl }: { nome: string; avatarUrl: string | null }) {
  const [erro, setErro] = useState(false)
  return (
    <Avatar className="h-7 w-7 shrink-0">
      {!erro && avatarUrl
        ? <AvatarImage src={avatarUrl} alt={nome} onError={() => setErro(true)} />
        : null
      }
      <AvatarFallback className="text-[10px]">{getIniciais(nome)}</AvatarFallback>
    </Avatar>
  )
}

function badgePalpite(status: PalpiteMembro['status']) {
  switch (status) {
    case 'ACERTO_PLACAR':   return { label: '🥇 Placar', variant: 'default' as const }
    case 'ACERTO_VENCEDOR': return { label: '✅ Vencedor', variant: 'secondary' as const }
    case 'ERRO':            return { label: '❌ Erro', variant: 'outline' as const }
    default:                return null
  }
}

// ─── Card de uma partida ───────────────────────────────────────────────────────

function PartidaCard({ jogo }: { jogo: JogoComPalpites }) {
  const [aberto, setAberto] = useState(false)

  const nomeCasa      = getNomePt(jogo.timeCasa?.nome      ?? jogo.timeCasaRef      ?? '?')
  const nomeVisitante = getNomePt(jogo.timeVisitante?.nome ?? jogo.timeVisitanteRef ?? '?')
  const res           = jogo.resultado

  const palpitaram = jogo.palpites.filter(p => p.status !== null).length
  const total      = jogo.palpites.length

  return (
    <Card className="overflow-hidden">
      {/* Header clicável */}
      <button
        className="cursor-pointer w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors"
        onClick={() => setAberto(v => !v)}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Times */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Bandeira nome={jogo.timeCasa?.nome ?? ''} />
              <span className="text-sm font-medium hidden sm:inline">{nomeCasa}</span>
              <span className="text-sm font-medium sm:hidden">{nomeCasa.split(' ')[0]}</span>
            </div>

            {/* Resultado */}
            {res ? (
              <span className="text-base font-bold tabular-nums shrink-0">
                {res.golsCasa} – {res.golsVisitante}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground shrink-0">vs</span>
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm font-medium hidden sm:inline">{nomeVisitante}</span>
              <span className="text-sm font-medium sm:hidden">{nomeVisitante.split(' ')[0]}</span>
              <Bandeira nome={jogo.timeVisitante?.nome ?? ''} />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">{formatarDataHoraJogo(jogo.dataHora)}</p>
              <p className="text-xs text-muted-foreground">{palpitaram}/{total} palpitaram</p>
            </div>
            {aberto
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </div>
      </button>

      {/* Lista de palpites */}
      {aberto && (
        <CardContent className="px-4 pb-3 pt-0 border-t border-border">
          <div className="divide-y divide-border">
            {jogo.palpites.map(p => {
              const badge = badgePalpite(p.status)
              return (
                <div key={p.usuarioId} className="flex items-center gap-3 py-2.5">
                  <MembroAvatar nome={p.nome} avatarUrl={p.avatarUrl} />

                  <span className="flex-1 text-sm truncate">{p.nome}</span>

                  {p.status !== null ? (
                    <>
                      <span className="text-sm tabular-nums font-medium shrink-0">
                        {p.golsCasa} – {p.golsVisitante}
                      </span>
                      {badge && (
                        <Badge variant={badge.variant} className="text-xs shrink-0 hidden sm:flex">
                          {badge.label}
                        </Badge>
                      )}
                      <span className="text-sm font-semibold text-primary shrink-0 w-12 text-right">
                        {p.pontos} pts
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground italic shrink-0">não palpitou</span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function ComunidadePalpites({ comunidadeId }: { comunidadeId: string }) {
  const { data: jogos, isLoading } = useComunidadePalpites(comunidadeId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!jogos || jogos.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="py-10 text-center text-muted-foreground text-sm">
          Nenhuma partida finalizada ainda.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-2 mt-4">
      <p className="text-xs text-muted-foreground mb-1">
        {jogos.length} partida{jogos.length !== 1 ? 's' : ''} finalizada{jogos.length !== 1 ? 's' : ''} · clique para ver os palpites
      </p>
      {jogos.map(jogo => (
        <PartidaCard key={jogo.jogoId} jogo={jogo} />
      ))}
    </div>
  )
}
