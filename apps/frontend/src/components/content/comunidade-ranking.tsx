import { Crown, Shield, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useRankingComunidade } from '@/hooks/use-comunidades-ranking'
import type { Fase, RankingMembro, RoleComunidade } from '@/types/comunidade'

const FASE_LABEL: Record<Fase, string> = {
  GRUPOS:         'das fases de grupos',
  ROUND_OF_32:    'das pré-oitavas',
  ROUND_OF_16:    'das oitavas de final',
  QUARTAS:        'das quartas de final',
  SEMIFINAL:      'das semifinais',
  TERCEIRO_LUGAR: 'da disputa de 3º lugar',
  FINAL:          'da final',
}

function AvatarUsuario({ nome, avatarUrl }: { nome: string; avatarUrl: string | null }) {
  const [erro, setErro] = useState(false)

  if (avatarUrl && !erro) {
    return (
      <img
        src={avatarUrl}
        alt={nome}
        className="h-7 w-7 rounded-full object-cover shrink-0"
        onError={() => setErro(true)}
      />
    )
  }
  return (
    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
      {nome.charAt(0).toUpperCase()}
    </div>
  )
}

const roleIcon: Record<RoleComunidade, React.ReactNode> = {
  DONO:      <Crown className="h-3 w-3 text-yellow-500" />,
  MODERADOR: <Shield className="h-3 w-3 text-blue-500" />,
  MEMBRO:    null,
}

const posicaoIcon: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

function RankingRow({ membro }: { membro: RankingMembro }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <span className="w-7 text-center text-sm font-semibold text-muted-foreground shrink-0">
        {posicaoIcon[membro.posicao] ?? membro.posicao}
      </span>

      <AvatarUsuario nome={membro.nome} avatarUrl={membro.avatarUrl} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{membro.nome}</span>
          {roleIcon[membro.role]}
        </div>
        <span className="text-xs text-muted-foreground">
          {membro.pontosPalpites} pontos
        </span>
      </div>

      <span className="text-sm font-bold shrink-0">{membro.totalPontos} pts</span>
    </div>
  )
}

interface Props {
  comunidadeId: string
  rankingFaseInicio?: Fase | null
}

export default function RankingComunidade({ comunidadeId, rankingFaseInicio }: Props) {
  const { data: ranking, isLoading } = useRankingComunidade(comunidadeId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-md" />
        ))}
      </div>
    )
  }

  if (!ranking || ranking.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum membro com pontuação ainda.
      </p>
    )
  }

  return (
    <div className="mt-2">
      {rankingFaseInicio && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 border border-border rounded-md px-3 py-2 mb-3">
          <RotateCcw className="h-3 w-3 shrink-0" />
          <span>Pontuação contada a partir <strong className="text-foreground">{FASE_LABEL[rankingFaseInicio]}</strong></span>
        </div>
      )}
      {ranking.map(m => (
        <RankingRow key={m.usuarioId} membro={m} />
      ))}
    </div>
  )
}