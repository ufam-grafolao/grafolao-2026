import { useMemo } from 'react'
import { useJogos } from '@/hooks/use-jogos'
import { getBandeira } from '@/lib/bandeiras'
import { getNomePt } from '@/lib/nomes-times'
import type { Jogo } from '@/types/jogo'

const FASES_LABEL: Record<string, string> = {
  ROUND_OF_32:    'Pré-oitavas',
  ROUND_OF_16:    'Oitavas de final',
  QUARTAS:        'Quartas de final',
  SEMIFINAL:      'Semifinais',
  FINAL:          'Final',
  TERCEIRO_LUGAR: 'Disputa de 3º lugar',
}

const FASES_ORDEM = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTAS', 'SEMIFINAL', 'FINAL', 'TERCEIRO_LUGAR']

function getVencedor(jogo: Jogo): 'CASA' | 'VISITANTE' | null {
  if (jogo.status !== 'ENCERRADO' || !jogo.resultado) return null
  const r = jogo.resultado
  if (r.golsCasa > r.golsVisitante) return 'CASA'
  if (r.golsCasa < r.golsVisitante) return 'VISITANTE'
  return r.vencedorPenalti ?? null
}

function MatchCard({ jogo }: { jogo: Jogo }) {
  const nomeOrigCasa      = jogo.timeCasa?.nome      ?? jogo.timeCasaRef      ?? '?'
  const nomeOrigVisitante = jogo.timeVisitante?.nome ?? jogo.timeVisitanteRef ?? '?'
  const nomeCasa      = jogo.timeCasa      ? getNomePt(nomeOrigCasa)      : nomeOrigCasa
  const nomeVisitante = jogo.timeVisitante ? getNomePt(nomeOrigVisitante) : nomeOrigVisitante
  const flagCasa      = jogo.timeCasa      ? getBandeira(nomeOrigCasa)      : null
  const flagVisitante = jogo.timeVisitante ? getBandeira(nomeOrigVisitante) : null
  const vencedor  = getVencedor(jogo)
  const encerrado = jogo.status === 'ENCERRADO'
  const isEmpate  = encerrado && jogo.resultado && jogo.resultado.golsCasa === jogo.resultado.golsVisitante

  return (
    <div className="border rounded-lg overflow-hidden bg-card text-sm">
      {/* Casa */}
      <div className={`flex items-center gap-2 px-3 py-2 ${
        vencedor === 'CASA'
          ? 'bg-primary/10 font-semibold'
          : encerrado && vencedor ? 'opacity-40' : ''
      }`}>
        {flagCasa
          ? <span className={`fi fi-${flagCasa} text-base shrink-0`} />
          : <span className="text-xs text-muted-foreground shrink-0 w-5 text-center font-mono">{nomeOrigCasa}</span>
        }
        <span className="flex-1 truncate text-xs">{flagCasa ? nomeCasa : ''}</span>
        {encerrado && jogo.resultado && (
          <span className="font-bold tabular-nums text-sm">{jogo.resultado.golsCasa}</span>
        )}
      </div>

      {/* Visitante */}
      <div className={`flex items-center gap-2 px-3 py-2 border-t ${
        vencedor === 'VISITANTE'
          ? 'bg-primary/10 font-semibold'
          : encerrado && vencedor ? 'opacity-40' : ''
      }`}>
        {flagVisitante
          ? <span className={`fi fi-${flagVisitante} text-base shrink-0`} />
          : <span className="text-xs text-muted-foreground shrink-0 w-5 text-center font-mono">{nomeOrigVisitante}</span>
        }
        <span className="flex-1 truncate text-xs">{flagVisitante ? nomeVisitante : ''}</span>
        {encerrado && jogo.resultado && (
          <span className="font-bold tabular-nums text-sm">{jogo.resultado.golsVisitante}</span>
        )}
      </div>

      {/* Pênaltis */}
      {isEmpate && jogo.resultado?.vencedorPenalti && (
        <div className="px-3 py-1 text-[11px] font-semibold border-t text-center text-muted-foreground">
          Pên: {jogo.resultado.vencedorPenalti === 'CASA' ? nomeCasa : nomeVisitante}
        </div>
      )}
    </div>
  )
}

function GrupoCard({ nome, jogos, classificados }: { nome: string; jogos: Jogo[]; classificados: Set<string> }) {
  const times = useMemo(() => {
    const seen = new Set<string>()
    const result: { nomeOrig: string; nomePt: string }[] = []
    for (const jogo of jogos) {
      for (const [orig, rel] of [
        [jogo.timeCasa?.nome ?? jogo.timeCasaRef ?? '?', jogo.timeCasa],
        [jogo.timeVisitante?.nome ?? jogo.timeVisitanteRef ?? '?', jogo.timeVisitante],
      ] as [string, typeof jogo.timeCasa][]) {
        if (!seen.has(orig)) {
          seen.add(orig)
          result.push({ nomeOrig: orig, nomePt: rel ? getNomePt(orig) : orig })
        }
      }
    }
    return result.slice(0, 4)
  }, [jogos])

  // Só marca eliminados quando pelo menos 1 time do grupo está classificado
  const alguemDoGrupoClassificou = times.some(t => classificados.has(t.nomeOrig))

  return (
    <div className="border rounded-lg bg-card p-2.5">
      <p className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wide">
        {nome.replace('Group ', 'Grupo ')}
      </p>
      <div className="flex flex-col gap-1.5">
        {times.map(t => {
          const flag = getBandeira(t.nomeOrig)
          const isClassificado = classificados.has(t.nomeOrig)
          const isEliminado = alguemDoGrupoClassificou && !isClassificado
          return (
            <div
              key={t.nomeOrig}
              className={`flex items-center gap-1.5 ${isEliminado ? 'opacity-35' : ''}`}
            >
              {flag
                ? <span className={`fi fi-${flag} text-sm shrink-0`} />
                : <span className="w-4 h-4 rounded-sm bg-muted shrink-0" />
              }
              <span className={`text-xs truncate ${isEliminado ? 'line-through' : ''}`}>
                {t.nomePt}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ChaveamentoPage() {
  const { data: todosJogos, isLoading } = useJogos()

  // Times que aparecem em algum jogo de mata-mata com equipe definida
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

  const jogosPorFase = useMemo(() => {
    return FASES_ORDEM
      .map(fase => ({
        fase,
        label: FASES_LABEL[fase],
        jogos: (todosJogos?.filter(j => j.fase === fase) ?? [])
          .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()),
      }))
      .filter(r => r.jogos.length > 0)
  }, [todosJogos])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Carregando...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-6">
      <h1 className="text-xl font-bold">Chaveamento</h1>

      {/* ── Grupos ─────────────────────────────────────────────────── */}
      {jogosPorGrupo.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Fase de Grupos
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {jogosPorGrupo.map(([grupo, jogos]) => (
              <GrupoCard key={grupo} nome={grupo} jogos={jogos} classificados={timesClassificados} />
            ))}
          </div>
        </section>
      )}

      {/* ── Bracket por fase ───────────────────────────────────────── */}
      {jogosPorFase.map(({ fase, label, jogos }) => (
        <section key={fase}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            {label}
          </h2>
          <div className={`grid gap-3 ${
            jogos.length === 1  ? 'grid-cols-1 max-w-xs' :
            jogos.length === 2  ? 'grid-cols-2 max-w-sm' :
            jogos.length <= 4   ? 'grid-cols-2 sm:grid-cols-4' :
            jogos.length <= 8   ? 'grid-cols-2 sm:grid-cols-4' :
            'grid-cols-2 sm:grid-cols-4 md:grid-cols-8'
          }`}>
            {jogos.map(jogo => (
              <MatchCard key={jogo.id} jogo={jogo} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
