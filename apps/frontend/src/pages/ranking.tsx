import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useRankingGeral } from '@/hooks/use-ranking-geral'
import { useAuth } from '@/hooks/use-auth'
import type { EntradaRanking } from '@/types/ranking'

const LIMIT = 20

const posicaoIcon: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function AvatarUsuario({ nome, avatarUrl, className }: { nome: string; avatarUrl: string | null; className: string }) {
  const [erro, setErro] = useState(false)

  if (avatarUrl && !erro) {
    return (
      <img
        src={avatarUrl}
        alt={nome}
        className={className}
        onError={() => setErro(true)}
      />
    )
  }
  return (
    <div className={`bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground ${className}`}>
      {nome.charAt(0).toUpperCase()}
    </div>
  )
}

function RankingRow({ entrada, destaque = false }: { entrada: EntradaRanking; destaque?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 border-b border-border last:border-0 ${
        destaque ? 'bg-primary/9 -mx-4 px-4 rounded-md' : ''
      }`}
    >
      <span className="w-8 text-center text-sm font-semibold text-muted-foreground shrink-0">
        {posicaoIcon[entrada.posicao] ?? entrada.posicao}
      </span>

      <AvatarUsuario nome={entrada.nome} avatarUrl={entrada.avatarUrl} className="h-8 w-8 rounded-full object-cover shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{entrada.nome}</span>
          {destaque && (
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
              você
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {entrada.acertosCompletos} completos · {entrada.acertosParciais} parciais
        </span>
      </div>

      <span className="text-sm font-bold shrink-0">{entrada.totalPontos} pts</span>
    </div>
  )
}

function RankingRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <Skeleton className="h-4 w-6 rounded shrink-0" />
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-36 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
      <Skeleton className="h-4 w-12 rounded shrink-0" />
    </div>
  )
}

function PaginacaoNumerada({
  page,
  totalPages,
  onChange,
  disabled,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
  disabled: boolean
}) {
  function paginas(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const vizinhos = new Set([1, totalPages, page - 1, page, page + 1].filter(p => p >= 1 && p <= totalPages))
    const ordenadas = Array.from(vizinhos).sort((a, b) => a - b)

    const resultado: (number | '...')[] = []
    for (let i = 0; i < ordenadas.length; i++) {
      if (i > 0 && ordenadas[i] - ordenadas[i - 1] > 1) resultado.push('...')
      resultado.push(ordenadas[i])
    }
    return resultado
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page === 1 || disabled}
        className="px-2"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {paginas().map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground select-none">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(p)}
            disabled={disabled}
            className="min-w-8 px-2"
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages || disabled}
        className="px-2"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function RankingPage() {
  const [page, setPage] = useState(1)
  const { usuario } = useAuth()
  const { data, isLoading } = useRankingGeral(page, LIMIT)

  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0
  const minhaEntrada = data?.minhaEntrada ?? null
  const meuId = usuario?.id ?? ''

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Ranking Geral</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Classificação de todos os participantes do bolão.
          {!isLoading && total > 0 && (
            <span className="ml-1">{total} participantes no total.</span>
          )}
        </p>
      </div>

      {/* Minha posição */}
      {isLoading ? (
        <Skeleton className="h-16 rounded-lg" />
      ) : minhaEntrada ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-primary w-10 text-center shrink-0">
            {posicaoIcon[minhaEntrada.posicao] ?? `#${minhaEntrada.posicao}`}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Sua posição</p>
            <p className="text-xs text-muted-foreground">
              {minhaEntrada.acertosCompletos} completos · {minhaEntrada.acertosParciais} parciais
            </p>
          </div>
          <span className="text-lg font-bold text-primary shrink-0">{minhaEntrada.totalPontos} pts</span>
        </div>
      ) : null}

      {/* Lista */}
      <div className="rounded-lg border border-border bg-card px-4 py-2">
        {isLoading ? (
          Array.from({ length: LIMIT }).map((_, i) => <RankingRowSkeleton key={i} />)
        ) : !data || data.data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Nenhum participante com pontuação ainda.
          </p>
        ) : (
          data.data.map(entrada => (
            <RankingRow
              key={entrada.usuarioId}
              entrada={entrada}
              destaque={entrada.usuarioId === meuId}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <PaginacaoNumerada
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  )
}
