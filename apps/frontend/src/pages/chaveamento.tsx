import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useJogos } from '@/hooks/use-jogos'
import { getBandeira } from '@/lib/bandeiras'
import { getNomePt } from '@/lib/nomes-times'
import { Skeleton } from '@/components/ui/skeleton'
import type { Jogo } from '@/types/jogo'

// ─── Layout constants
const BASE_SLOT = 72          // R32 slot height in px
const CARD_W    = 140         // match card width in px
const CONN_W    = 18          // connector column width in px
const MAX_DEPTH = 3           // SF(0) → QF(1) → R16(2) → R32(3)
const TOTAL_H   = BASE_SLOT * (1 << MAX_DEPTH)  // 576px

const FASES_LABEL: Record<string, string> = {
  GRUPOS: 'Grupos', ROUND_OF_32: 'Pré-oitavas', ROUND_OF_16: 'Oitavas',
  QUARTAS: 'Quartas', SEMIFINAL: 'Semis', FINAL: 'Final',
  TERCEIRO_LUGAR: '3º lugar',
}

// ─── Bracket tree helpers 

function parseWRef(ref: string | null): number | null {
  const m = ref?.match(/^W(\d+)$/)
  return m ? +m[1] : null
}

interface BN { jogo: Jogo; top: BN | null; bot: BN | null }

function buildNode(jogo: Jogo, byNum: Map<number, Jogo>): BN {
  const t = parseWRef(jogo.timeCasaRef), b = parseWRef(jogo.timeVisitanteRef)
  return {
    jogo,
    top: t != null && byNum.has(t) ? buildNode(byNum.get(t)!, byNum) : null,
    bot: b != null && byNum.has(b) ? buildNode(byNum.get(b)!, byNum) : null,
  }
}

function gamesAtDepth(n: BN, d: number): Jogo[] {
  if (d === 0) return [n.jogo]
  return [
    ...(n.top ? gamesAtDepth(n.top, d - 1) : []),
    ...(n.bot ? gamesAtDepth(n.bot, d - 1) : []),
  ]
}

// slotH: SF(d=0)=576px, QF(d=1)=288px, R16(d=2)=144px, R32(d=3)=72px
function slotH(d: number) { return BASE_SLOT * (1 << (MAX_DEPTH - d)) }

// ─── Match helpers ────────────────────────────────────────────────────────────

function getVencedor(j: Jogo): 'CASA' | 'VISITANTE' | null {
  if (j.status !== 'ENCERRADO' || !j.resultado) return null
  const r = j.resultado
  if (r.golsCasa > r.golsVisitante) return 'CASA'
  if (r.golsCasa < r.golsVisitante) return 'VISITANTE'
  return r.vencedorPenalti ?? null
}
function podeApostar(j: Jogo) { return j.status === 'AGENDADO' && !!(j.timeCasa || j.timeVisitante) }

// ─── Team row ─────────────────────────────────────────────────────────────────

function TeamRow({ nomeOrig, nomePt, flag, gols, winner, loser, sep }: {
  nomeOrig: string; nomePt: string; flag: string | null
  gols?: number; winner: boolean; loser: boolean; sep?: boolean
}) {
  return (
    <div className={[
      'flex items-center gap-1.5 px-2 py-1.5',
      sep    ? 'border-t border-border/60' : '',
      winner ? 'bg-primary/8 font-medium'  : '',
      loser  ? 'opacity-35'                : '',
    ].filter(Boolean).join(' ')}>
      {flag
        ? <span className={`fi fi-${flag} text-base shrink-0`} />
        : <span className="w-5 h-3.5 rounded-sm bg-muted shrink-0 flex items-center justify-center text-[8px] font-mono text-muted-foreground">{nomeOrig.slice(0, 3)}</span>
      }
      <span className="flex-1 text-[11px] truncate">{flag ? nomePt : nomeOrig}</span>
      {gols !== undefined && (
        <span className={['text-[11px] tabular-nums font-bold shrink-0', winner ? 'text-primary' : ''].join(' ')}>{gols}</span>
      )}
    </div>
  )
}

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchCard({ jogo, highlight, clickable, onClick, width = CARD_W }: {
  jogo: Jogo; highlight?: boolean; clickable: boolean; onClick: () => void; width?: number | string
}) {
  const v    = getVencedor(jogo), enc = jogo.status === 'ENCERRADO'
  const origCasa = jogo.timeCasa?.nome      ?? jogo.timeCasaRef      ?? '?'
  const origVis  = jogo.timeVisitante?.nome ?? jogo.timeVisitanteRef ?? '?'
  const nomeCasa = jogo.timeCasa      ? getNomePt(origCasa) : origCasa
  const nomeVis  = jogo.timeVisitante ? getNomePt(origVis)  : origVis
  const flagCasa = jogo.timeCasa      ? getBandeira(origCasa) : null
  const flagVis  = jogo.timeVisitante ? getBandeira(origVis)  : null
  const isEmpate = enc && jogo.resultado?.golsCasa === jogo.resultado?.golsVisitante

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? e => e.key === 'Enter' && onClick() : undefined}
      className={[
        'rounded-lg border bg-card overflow-hidden transition-all duration-150',
        highlight ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '',
        clickable ? 'cursor-pointer hover:border-primary/60 hover:shadow-md hover:-translate-y-px' : '',
      ].filter(Boolean).join(' ')}
      style={{ width }}
    >
      <TeamRow nomeOrig={origCasa} nomePt={nomeCasa} flag={flagCasa}
        gols={enc ? jogo.resultado?.golsCasa : undefined}
        winner={v === 'CASA'} loser={!!(enc && v && v !== 'CASA')} />
      <TeamRow nomeOrig={origVis} nomePt={nomeVis} flag={flagVis}
        gols={enc ? jogo.resultado?.golsVisitante : undefined}
        winner={v === 'VISITANTE'} loser={!!(enc && v && v !== 'VISITANTE')} sep />
      {isEmpate && jogo.resultado?.vencedorPenalti && (
        <div className="px-2 py-0.5 text-[9px] text-center text-muted-foreground border-t border-border/60 bg-muted/30">
          Pên: {jogo.resultado.vencedorPenalti === 'CASA' ? nomeCasa : nomeVis}
        </div>
      )}
      {clickable && (
        <div className="px-2 py-0.5 text-[9px] text-center text-primary border-t border-border/60 bg-primary/5 font-medium">
          Palpitar
        </div>
      )}
    </div>
  )
}

// ─── Group card ───────────────────────────────────────────────────────────────

function GrupoCard({ nome, jogos, classificados }: { nome: string; jogos: Jogo[]; classificados: Set<string> }) {
  const times = useMemo(() => {
    const seen = new Set<string>()
    const result: { nomeOrig: string; nomePt: string }[] = []
    for (const j of jogos) {
      for (const [orig, rel] of [
        [j.timeCasa?.nome ?? j.timeCasaRef ?? '?', j.timeCasa],
        [j.timeVisitante?.nome ?? j.timeVisitanteRef ?? '?', j.timeVisitante],
      ] as [string, typeof j.timeCasa][]) {
        if (!seen.has(orig)) {
          seen.add(orig)
          result.push({ nomeOrig: orig, nomePt: rel ? getNomePt(orig) : orig })
        }
      }
    }
    return result.slice(0, 4)
  }, [jogos])

  const alguemClassificou = times.some(t => classificados.has(t.nomeOrig))

  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-[10px] font-bold text-muted-foreground mb-2.5 uppercase tracking-widest">
        {nome.replace('Group ', 'Grupo ')}
      </p>
      <div className="flex flex-col gap-1.5">
        {times.map((t, idx) => {
          const flag = getBandeira(t.nomeOrig)
          const isClassificado = classificados.has(t.nomeOrig)
          const isEliminado = alguemClassificou && !isClassificado

          return (
            <div key={t.nomeOrig} className={['flex items-center gap-1.5', isEliminado ? 'opacity-30' : ''].join(' ')}>
              {flag
                ? <span className={`fi fi-${flag} text-sm shrink-0`} />
                : <span className="w-4 h-3 rounded-sm bg-muted shrink-0" />
              }
              <span className={[
                'text-xs truncate flex-1',
                idx < 2 && isClassificado ? 'font-medium' : '',
                isEliminado ? 'line-through' : '',
              ].join(' ')}>
                {t.nomePt}
              </span>
              {isClassificado && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Phase progress bar ───────────────────────────────────────────────────────

function FaseProgress({ fases }: { fases: { fase: string; total: number; encerrados: number }[] }) {
  const ativas = fases.filter(f => f.fase !== 'GRUPOS')
  if (ativas.length === 0) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {ativas.map((f, i) => {
        const done    = f.total > 0 && f.encerrados === f.total
        const active  = f.encerrados > 0 && f.encerrados < f.total
        const pending = f.encerrados === 0

        return (
          <div key={f.fase} className="flex items-center gap-2 shrink-0">
            {i > 0 && <div className="w-4 h-px bg-border shrink-0" />}
            <div className="flex flex-col items-center gap-0.5">
              <div className={[
                'text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap',
                done    ? 'text-muted-foreground line-through' :
                active  ? 'text-primary' :
                pending ? 'text-muted-foreground/50' : '',
              ].join(' ')}>
                {FASES_LABEL[f.fase] ?? f.fase}
              </div>
              <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                <div
                  className={['h-full rounded-full transition-all', done ? 'bg-muted-foreground' : 'bg-primary'].join(' ')}
                  style={{ width: f.total > 0 ? `${(f.encerrados / f.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Bracket connector ────────────────────────────────────────────────────────
// Draws the bracket lines between two adjacent columns.
// For each pair of child games feeding into one parent game:
//   • horizontal arm at the midpoint of each child slot
//   • vertical spine on `spine` edge connecting the two midpoints
// The parent's midpoint is at the center of the pair (= where the spine meets the edge).

function BracketConnector({ childSlotH, numPairs, spine }: {
  childSlotH: number; numPairs: number; spine: 'left' | 'right'
}) {
  const pairH = childSlotH * 2
  const mid1  = childSlotH / 2      // midpoint of top child
  const mid2  = childSlotH * 3 / 2  // midpoint of bottom child

  return (
    <div className="flex flex-col shrink-0" style={{ width: CONN_W }}>
      {Array.from({ length: numPairs }).map((_, i) => (
        <div key={i} className="relative shrink-0" style={{ height: pairH }}>
          <div className="absolute h-px bg-amber-400/40" style={{ top: mid1, left: 0, right: 0 }} />
          <div className="absolute w-px bg-amber-400/40" style={{ top: mid1, bottom: pairH - mid2, [spine]: 0 }} />
          <div className="absolute h-px bg-amber-400/40" style={{ top: mid2, left: 0, right: 0 }} />
        </div>
      ))}
    </div>
  )
}

// ─── Bracket column ───────────────────────────────────────────────────────────

function BracketColumn({ games, sh, highlightId, onClickGame }: {
  games: Jogo[]; sh: number; highlightId: string | null; onClickGame: (j: Jogo) => void
}) {
  return (
    <div className="flex flex-col shrink-0" style={{ width: CARD_W }}>
      {games.map(j => (
        <div key={j.id} className="flex items-center justify-center shrink-0" style={{ height: sh }}>
          <MatchCard jogo={j} highlight={j.id === highlightId} clickable={podeApostar(j)} onClick={() => onClickGame(j)} />
        </div>
      ))}
    </div>
  )
}

// ─── Half bracket ─────────────────────────────────────────────────────────────
// Renders one side of the bracket (left or right of center Final).
// Left:  R32 | conn | R16 | conn | QF | conn | SF  (converges right toward Final)
// Right: SF  | conn | QF  | conn | R16 | conn | R32 (diverges right away from Final)

function HalfBracket({ sfNode, side, highlightId, onClickGame }: {
  sfNode: BN; side: 'left' | 'right'; highlightId: string | null; onClickGame: (j: Jogo) => void
}) {
  const columns = useMemo(() => {
    // base[0]=SF, base[1]=QF, base[2]=R16, base[3]=R32
    const base = Array.from({ length: MAX_DEPTH + 1 }, (_, d) => ({
      games: gamesAtDepth(sfNode, d),
      sh: slotH(d),
    }))
    // Left side displays R32 first (outward→inward); right side displays SF first (inward→outward)
    return side === 'left' ? [...base].reverse() : base
  }, [sfNode, side])

  return (
    <div className="flex items-stretch shrink-0">
      {columns.flatMap((col, i) => {
        const next = columns[i + 1]
        const isLeftSide = side === 'left'
        // Left side: col[i] is child (smaller slots), col[i+1] is parent (larger slots)
        // Right side: col[i] is parent (larger slots), col[i+1] is child (smaller slots)
        const connector = next ? (
          <BracketConnector
            key={`conn-${i}`}
            childSlotH={isLeftSide ? col.sh : next.sh}
            numPairs={isLeftSide ? next.games.length : col.games.length}
            spine={isLeftSide ? 'right' : 'left'}
          />
        ) : null

        return [
          <BracketColumn
            key={`col-${i}`}
            games={col.games}
            sh={col.sh}
            highlightId={highlightId}
            onClickGame={onClickGame}
          />,
          ...(connector ? [connector] : []),
        ]
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChaveamentoPage() {
  const { data: todosJogos, isLoading } = useJogos()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('jogoId')

  function handleClickJogo(jogo: Jogo) {
    navigate(`/jogos-palpites?jogoId=${jogo.id}&tab=todos`)
  }

  const { finalGame, terceiroGame, leftTree, rightTree } = useMemo(() => {
    if (!todosJogos) return { finalGame: null, terceiroGame: null, leftTree: null, rightTree: null }

    const byNum = new Map<number, Jogo>()
    for (const j of todosJogos) if (j.num != null) byNum.set(j.num, j)

    const finalGame    = todosJogos.find(j => j.fase === 'FINAL')         ?? null
    const terceiroGame = todosJogos.find(j => j.fase === 'TERCEIRO_LUGAR') ?? null

    if (!finalGame) return { finalGame, terceiroGame, leftTree: null, rightTree: null }

    const leftSFNum  = parseWRef(finalGame.timeCasaRef)
    const rightSFNum = parseWRef(finalGame.timeVisitanteRef)
    const leftSF     = leftSFNum  != null ? byNum.get(leftSFNum)  : null
    const rightSF    = rightSFNum != null ? byNum.get(rightSFNum) : null

    return {
      finalGame,
      terceiroGame,
      leftTree:  leftSF  ? buildNode(leftSF,  byNum) : null,
      rightTree: rightSF ? buildNode(rightSF, byNum) : null,
    }
  }, [todosJogos])

  const timesClassificados = useMemo(() => {
    const nomes = new Set<string>()
    todosJogos?.filter(j => !j.grupo).forEach(j => {
      if (j.timeCasa?.nome)      nomes.add(j.timeCasa.nome)
      if (j.timeVisitante?.nome) nomes.add(j.timeVisitante.nome)
    })
    return nomes
  }, [todosJogos])

  const jogosPorGrupo = useMemo(() => {
    const map: Record<string, Jogo[]> = {}
    todosJogos?.filter(j => j.grupo).forEach(j => {
      if (!map[j.grupo!]) map[j.grupo!] = []
      map[j.grupo!].push(j)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [todosJogos])

  const progressoFases = useMemo(() => {
    const fases: { fase: string; total: number; encerrados: number }[] = []
    if (jogosPorGrupo.length > 0) {
      const gs = todosJogos?.filter(j => j.grupo) ?? []
      fases.push({ fase: 'GRUPOS', total: gs.length, encerrados: gs.filter(j => j.status === 'ENCERRADO').length })
    }
    for (const f of ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTAS', 'SEMIFINAL', 'FINAL'] as const) {
      const js = todosJogos?.filter(j => j.fase === f) ?? []
      if (js.length > 0) fases.push({ fase: f, total: js.length, encerrados: js.filter(j => j.status === 'ENCERRADO').length })
    }
    return fases
  }, [todosJogos, jogosPorGrupo])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  const hasBracket = !!(leftTree || rightTree || finalGame)

  return (
    <div className="flex flex-col gap-8 pb-6">
      <div>
        <h1 className="text-xl font-bold">Chaveamento</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Copa do Mundo 2026</p>
      </div>

      <FaseProgress fases={progressoFases} />

      {hasBracket && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Eliminatórias
          </h2>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex justify-center py-2" style={{ minWidth: 'max-content' }}>
              {/* Left half: R32 → R16 → QF → SF converging toward Final */}
              {leftTree && (
                <HalfBracket
                  sfNode={leftTree}
                  side="left"
                  highlightId={highlightId}
                  onClickGame={handleClickJogo}
                />
              )}

              {/* Connector arm: left SF → Final */}
              <div className="shrink-0 h-px bg-amber-400/40 self-center" style={{ width: CONN_W }} />

              {/* Final (centered vertically in the bracket height) */}
              <div className="shrink-0 flex items-center" style={{ height: TOTAL_H, width: CARD_W }}>
                {finalGame && (
                  <MatchCard
                    jogo={finalGame}
                    highlight={finalGame.id === highlightId}
                    clickable={podeApostar(finalGame)}
                    onClick={() => handleClickJogo(finalGame)}
                  />
                )}
              </div>

              {/* Connector arm: Final → right SF */}
              <div className="shrink-0 h-px bg-amber-400/40 self-center" style={{ width: CONN_W }} />

              {/* Right half: SF → QF → R16 → R32 diverging from Final */}
              {rightTree && (
                <HalfBracket
                  sfNode={rightTree}
                  side="right"
                  highlightId={highlightId}
                  onClickGame={handleClickJogo}
                />
              )}
            </div>
          </div>
        </section>
      )}

      {terceiroGame && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Disputa de 3º lugar
          </h2>
          <div className="max-w-xs">
            <MatchCard
              jogo={terceiroGame}
              highlight={terceiroGame.id === highlightId}
              clickable={podeApostar(terceiroGame)}
              onClick={() => handleClickJogo(terceiroGame)}
              width="100%"
            />
          </div>
        </section>
      )}

      {jogosPorGrupo.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Fase de Grupos
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {jogosPorGrupo.map(([g, js]) => (
              <GrupoCard key={g} nome={g} jogos={js} classificados={timesClassificados} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
