import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, AlertTriangle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useConfigPalpitesEspeciais,
  useMeusPalpitesEspeciais,
  useSalvarPalpiteEspecial,
} from '@/hooks/use-palpites-especiais'
import { JogadorCombobox } from '@/components/combobox/jogador-combobox'
import { TimeCombobox, type TimeSelecionado } from '@/components/combobox/time-combobox'
import type { TipoPalpiteEspecial, PalpiteEspecialResponse } from '@/types/palpites-especiais'
import type { JogadorBusca } from '@/types/jogadores'
import { getBandeira } from '@/lib/bandeiras'
import { getNomePt } from '@/lib/nomes-times'

// ─────────────────────────────────────────────────────────────
// Configuração dos tipos
// ─────────────────────────────────────────────────────────────

const MAX_EDICOES = 2

const TIPOS_CONFIG: Record<TipoPalpiteEspecial, {
  emoji: string
  label: string
  pontos: number
  usaTime: boolean
  descricao: string
}> = {
  CAMPEAO:        { emoji: '🏆', label: 'Campeão',       pontos: 35, usaTime: true,  descricao: 'Time que vai levantar a taça' },
  VICE:           { emoji: '🥈', label: 'Vice-Campeão',  pontos: 25, usaTime: true,  descricao: 'Finalista que perde a decisão' },
  TERCEIRO_LUGAR: { emoji: '🥉', label: '3º Lugar',      pontos: 18, usaTime: true,  descricao: 'Vencedor da disputa de 3º lugar' },
  ARTILHEIRO:     { emoji: '⚽', label: 'Artilheiro',    pontos: 30, usaTime: false, descricao: 'Jogador com mais gols no torneio' },
  MVP:            { emoji: '⭐', label: 'MVP',            pontos: 35, usaTime: false, descricao: 'Melhor jogador do torneio' },
}

const ORDEM: TipoPalpiteEspecial[] = ['CAMPEAO', 'VICE', 'TERCEIRO_LUGAR', 'ARTILHEIRO', 'MVP']

// ─────────────────────────────────────────────────────────────
// Aviso de prazo
// ─────────────────────────────────────────────────────────────

function AvisoPrazo({ prazo }: { prazo: Date }) {
  const agora = new Date()
  const encerrado = agora >= prazo
  const horasRestantes = Math.max(0, Math.floor((prazo.getTime() - agora.getTime()) / 3600000))
  const minutosRestantes = Math.max(0, Math.floor((prazo.getTime() - agora.getTime()) / 60000) % 60)
  const prazoFormatado = prazo.toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Manaus',
  })

  if (encerrado) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <XCircle className="h-4 w-4 shrink-0" />
        <span>Prazo encerrado — os palpites especiais não podem mais ser alterados.</span>
      </div>
    )
  }

  const urgente = horasRestantes < 6
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
      urgente
        ? 'border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
    }`}>
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        Prazo: <strong>{prazoFormatado} (horário de Manaus)</strong>
        {urgente && ` — faltam ${horasRestantes}h ${minutosRestantes}min!`}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Card de palpite especial
// ─────────────────────────────────────────────────────────────

interface CardPalpiteProps {
  tipo: TipoPalpiteEspecial
  palpite: PalpiteEspecialResponse
  prazoEncerrado: boolean
}

function CardPalpite({ tipo, palpite, prazoEncerrado }: CardPalpiteProps) {
  const config = TIPOS_CONFIG[tipo]
  const salvar = useSalvarPalpiteEspecial()

  const [timeSelecionado, setTimeSelecionado] = useState<TimeSelecionado | null>(
    palpite.timeId ? { id: palpite.timeId, nome: palpite.timeNome ?? '', codigo: palpite.timeCodigo, grupo: null } : null
  )
  const [jogadorSelecionado, setJogadorSelecionado] = useState<JogadorBusca | null>(
    palpite.jogadorId ? { id: palpite.jogadorId, name: palpite.jogadorNome ?? '', timeNome: palpite.jogadorTimeNome ?? '', timeCodigo: null, fotoUrl: palpite.jogadorFotoUrl } : null
  )

  const edicoesUsadas = palpite.totalEdicoes
  const temPalpite = !!(palpite.timeId || palpite.jogadorId)
  const edicoesRestantes = temPalpite ? MAX_EDICOES - edicoesUsadas : MAX_EDICOES
  const bloqueado = prazoEncerrado || (temPalpite && edicoesRestantes <= 0)

  function handleSalvar() {
    if (config.usaTime && !timeSelecionado) return
    if (!config.usaTime && !jogadorSelecionado) return

    salvar.mutate({
      tipo,
      timeId: config.usaTime ? timeSelecionado!.id : undefined,
      jogadorId: !config.usaTime ? jogadorSelecionado!.id : undefined,
    })
  }

  const palpiteAtualNome = config.usaTime
    ? palpite.timeNome
    : palpite.jogadorNome

  const statusIcon = palpite.acertou === true
    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
    : palpite.acertou === false
      ? <XCircle className="h-4 w-4 text-destructive shrink-0" />
      : temPalpite
        ? <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        : null

  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors ${
      palpite.acertou === true
        ? 'border-emerald-500/40 bg-emerald-500/5'
        : palpite.acertou === false
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-border bg-card'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{config.emoji}</span>
          <div>
            <p className="font-semibold text-sm">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.descricao}</p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5">
          +{config.pontos} pts
        </span>
      </div>

      {/* Palpite atual */}
      {temPalpite && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
          {statusIcon}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {config.usaTime && palpite.timeNome && (() => {
              const code = getBandeira(palpite.timeNome)
              return code ? (
                <img
                  src={`https://flagcdn.com/w20/${code}.png`}
                  srcSet={`https://flagcdn.com/w40/${code}.png 2x`}
                  alt={palpite.timeNome}
                  width={20}
                  height={15}
                  className="shrink-0 rounded-xs"
                />
              ) : null
            })()}
            {!config.usaTime && palpite.jogadorFotoUrl && (
              <img src={palpite.jogadorFotoUrl} alt={palpite.jogadorNome ?? ''} className="h-5 w-5 rounded-full object-cover shrink-0" />
            )}
            <span className="text-sm font-medium truncate">
              {config.usaTime ? getNomePt(palpiteAtualNome ?? '') : palpiteAtualNome}
            </span>
            {!config.usaTime && palpite.jogadorTimeNome && (() => {
              const code = getBandeira(palpite.jogadorTimeNome)
              return code ? (
                <img
                  src={`https://flagcdn.com/w20/${code}.png`}
                  srcSet={`https://flagcdn.com/w40/${code}.png 2x`}
                  alt={palpite.jogadorTimeNome}
                  className="shrink-0 rounded-xs"
                  style={{ width: 16, height: 12 }}
                />
              ) : null
            })()}
          </div>
          {palpite.acertou === true && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              +{palpite.pontos} pts
            </span>
          )}
        </div>
      )}

      {/* Edições restantes */}
      {!prazoEncerrado && (
        <div className="flex items-center gap-1.5">
          {Array.from({ length: MAX_EDICOES }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < edicoesRestantes ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1 shrink-0">
            {edicoesRestantes === 0
              ? 'Sem edições'
              : `${edicoesRestantes} ${edicoesRestantes === 1 ? 'edição' : 'edições'} restante${edicoesRestantes === 1 ? '' : 's'}`}
          </span>
        </div>
      )}

      {/* Seletor */}
      {!bloqueado && (
        <div className="flex flex-col gap-2 pt-1">
          {config.usaTime ? (
            <TimeCombobox
              valorAtual={timeSelecionado}
              onSelecionar={setTimeSelecionado}
              disabled={salvar.isPending}
            />
          ) : (
            <JogadorCombobox
              valorAtual={jogadorSelecionado}
              onSelecionar={setJogadorSelecionado}
              disabled={salvar.isPending}
            />
          )}
          <Button
            size="sm"
            onClick={handleSalvar}
            disabled={
              salvar.isPending ||
              (config.usaTime ? !timeSelecionado : !jogadorSelecionado)
            }
            className="w-full"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            {temPalpite ? 'Atualizar palpite' : 'Salvar palpite'}
          </Button>
          {salvar.isError && (
            <p className="text-xs text-destructive text-center">
              {(salvar.error as { message?: string })?.message ?? 'Erro ao salvar. Tente novamente.'}
            </p>
          )}
        </div>
      )}

      {bloqueado && !prazoEncerrado && edicoesRestantes <= 0 && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          Limite de edições atingido.
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────

export default function PalpitesEspeciaisPage() {
  const { data: palpites, isLoading } = useMeusPalpitesEspeciais()
  const { data: config } = useConfigPalpitesEspeciais()

  const prazo = config ? new Date(config.prazo) : new Date('2026-06-28T14:59:00-04:00')
  const prazoEncerrado = new Date() >= prazo

  const porTipo = new Map(palpites?.map(p => [p.tipo, p]) ?? [])

  const pontosGanhos = palpites?.reduce((acc, p) => acc + (p.acertou === true ? p.pontos : 0), 0) ?? 0
  const acertos = palpites?.filter(p => p.acertou === true).length ?? 0
  const comPalpite = palpites?.filter(p => p.timeId || p.jogadorId).length ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Palpites Especiais</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Preveja os destaques da Copa do Mundo 2026 e acumule pontos bônus.
        </p>
      </div>

      <AvisoPrazo prazo={prazo} />

      {/* Resumo de pontos */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">Palpitados</p>
            <p className="text-xl font-bold">{comPalpite}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">Acertos</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{acertos}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">Pontos ganhos</p>
            <p className="text-xl font-bold text-primary">{pontosGanhos}</p>
          </div>
        </div>
      )}

      {/* Grid de cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Times */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Palpites de time</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['CAMPEAO', 'VICE', 'TERCEIRO_LUGAR'] as TipoPalpiteEspecial[]).map(tipo => {
                const palpite = porTipo.get(tipo) ?? {
                  tipo, timeId: null, timeNome: null, timeCodigo: null,
                  jogadorId: null, jogadorNome: null, jogadorTimeNome: null, jogadorFotoUrl: null,
                  totalEdicoes: 0, pontos: 0, acertou: null,
                }
                return (
                  <CardPalpite key={tipo} tipo={tipo} palpite={palpite} prazoEncerrado={prazoEncerrado} />
                )
              })}
            </div>
          </div>

          {/* Jogadores */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Palpites de jogador</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['ARTILHEIRO', 'MVP'] as TipoPalpiteEspecial[]).map(tipo => {
                const palpite = porTipo.get(tipo) ?? {
                  tipo, timeId: null, timeNome: null, timeCodigo: null,
                  jogadorId: null, jogadorNome: null, jogadorTimeNome: null, jogadorFotoUrl: null,
                  totalEdicoes: 0, pontos: 0, acertou: null,
                }
                return (
                  <CardPalpite key={tipo} tipo={tipo} palpite={palpite} prazoEncerrado={prazoEncerrado} />
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Tabela de pontuação */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold mb-3">Pontuação em caso de acerto</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left pb-2 font-medium">Palpite</th>
                <th className="text-center pb-2 font-medium">Pontos</th>
                <th className="text-left pb-2 font-medium hidden sm:table-cell">Justificativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ORDEM.map(tipo => {
                const cfg = TIPOS_CONFIG[tipo]
                const justificativas: Record<TipoPalpiteEspecial, string> = {
                  CAMPEAO:        '48 seleções tornam o acerto mais difícil que nas edições anteriores',
                  MVP:            '5 pts a mais que o artilheiro — mais subjetivo e imprevisível',
                  ARTILHEIRO:     '120+ candidatos plausíveis entre os 48 times',
                  VICE:           'Levemente abaixo do campeão, mantendo a proporção',
                  TERCEIRO_LUGAR: 'Mais "fácil" dos especiais, mas ainda desafiador',
                }
                return (
                  <tr key={tipo} className="text-sm">
                    <td className="py-2.5 pr-4">
                      <span className="mr-1.5">{cfg.emoji}</span>
                      {cfg.label}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="font-bold text-primary">{cfg.pontos} pts</span>
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                      {justificativas[tipo]}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Cada palpite pode ser editado até <strong>2 vezes</strong> antes do prazo.
        </p>
      </div>
    </div>
  )
}
