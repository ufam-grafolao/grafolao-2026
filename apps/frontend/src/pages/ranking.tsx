import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRankingGeral } from '@/hooks/use-ranking-geral'
import { useAuth } from '@/hooks/use-auth'
import type { EntradaRanking } from '@/types/ranking'

const LIMIT = 20

function AvatarUsuario({ nome, avatarUrl, className }: { nome: string; avatarUrl: string | null; className: string }) {
  const [erro, setErro] = useState(false)

  if (avatarUrl && !erro) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={className}
        onError={() => setErro(true)}
      />
    )
  }
  return (
    <div aria-hidden="true" className={`bg-secondary text-secondary-foreground flex items-center justify-center text-[13px] font-semibold ${className}`}>
      {nome.charAt(0).toUpperCase()}
    </div>
  )
}

// Direção A (Placar): tabela com numerais condensados; pódio marcado por barra amarela lateral.
function RankingRow({ entrada, destaque = false, sortBy = 'pontos' }: { entrada: EntradaRanking; destaque?: boolean; sortBy?: 'pontos' | 'acertos' }) {
  const podio = entrada.posicao <= 3
  const porAcertos = sortBy === 'acertos'
  return (
    <tr className={`h-14 border-b border-border last:border-0 ${destaque ? 'bg-secondary' : ''}`}>
      <td className={`w-12 sm:w-16 pl-3 pr-1 sm:pl-4 font-display text-[1.75rem] font-bold leading-none tabular-nums ${podio ? 'shadow-[inset_5px_0_0_0_var(--gold)]' : ''}`}>
        {entrada.posicao}
      </td>
      <td className="px-2 sm:px-3 max-w-0 w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <AvatarUsuario nome={entrada.nome} avatarUrl={entrada.avatarUrl} className="h-8 w-8 rounded-full object-cover shrink-0 hidden min-[420px]:flex" />
          <span className="text-sm font-medium truncate">{entrada.nome}</span>
          {destaque && (
            <span className="text-xs font-semibold text-primary-foreground bg-primary px-2 py-0.5 rounded-full shrink-0">
              você
            </span>
          )}
        </div>
      </td>
      <td className={`px-2 sm:px-3 text-right tabular-nums ${porAcertos ? 'font-display text-[1.625rem] font-bold leading-none' : 'text-sm'}`}>
        {entrada.acertosCompletos}
      </td>
      <td className="px-2 sm:px-3 text-right tabular-nums text-sm hidden sm:table-cell">
        {entrada.acertosParciais}
      </td>
      <td className={`pl-2 pr-3 sm:pr-4 text-right tabular-nums ${porAcertos ? 'text-sm' : 'font-display text-[1.625rem] font-bold leading-none'}`}>
        {entrada.totalPontos}
      </td>
    </tr>
  )
}

function RankingRowSkeleton() {
  return (
    <tr className="h-14 border-b border-border last:border-0">
      <td className="pl-4"><Skeleton className="h-6 w-6 rounded" /></td>
      <td className="px-3"><Skeleton className="h-4 w-32 rounded" /></td>
      <td className="px-3"><Skeleton className="h-4 w-8 rounded ml-auto" /></td>
      <td className="px-3 hidden sm:table-cell"><Skeleton className="h-4 w-8 rounded ml-auto" /></td>
      <td className="pr-4"><Skeleton className="h-6 w-10 rounded ml-auto" /></td>
    </tr>
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
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page === 1 || disabled}
        className="h-11 min-w-11 px-2 border-input"
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
            className="h-11 min-w-11 px-2 border-input"
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
        className="h-11 min-w-11 px-2 border-input"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function RankingLista({ sortBy }: { sortBy: 'pontos' | 'acertos' }) {
  const [page, setPage] = useState(1)
  const { usuario } = useAuth()
  const { data, isLoading } = useRankingGeral(page, LIMIT, sortBy)

  const totalPages = data?.totalPages ?? 1
  const minhaEntrada = data?.minhaEntrada ?? null
  const meuId = usuario?.id ?? ''

  return (
    <div className="flex flex-col gap-4">
      {/* Minha posição */}
      {isLoading ? (
        <Skeleton className="h-[4.5rem] rounded-md" />
      ) : minhaEntrada ? (
        <div className="rounded-md bg-gold text-gold-foreground px-4 py-3 flex items-center gap-4">
          <span className="font-display text-5xl font-bold leading-none shrink-0">
            {minhaEntrada.posicao}º
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Sua posição</p>
            <p className="text-sm">
              {minhaEntrada.acertosCompletos} acertos completos · {minhaEntrada.acertosParciais} parciais
            </p>
          </div>
          <span className="font-display text-4xl font-bold leading-none shrink-0">
            {sortBy === 'acertos' ? minhaEntrada.acertosCompletos : minhaEntrada.totalPontos}
            <small className="font-sans text-sm font-semibold ml-1">{sortBy === 'acertos' ? 'completos' : 'pontos'}</small>
          </span>
        </div>
      ) : null}

      {/* Tabela */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Página {page} de {totalPages}</p>
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-background border-b border-input text-left text-[13px] font-semibold text-muted-foreground h-10">
                <th scope="col" className="pl-3 sm:pl-4 pr-1 font-semibold">Pos.</th>
                <th scope="col" className="px-2 sm:px-3 font-semibold">Participante</th>
                <th scope="col" className="px-2 sm:px-3 text-right font-semibold" aria-sort={sortBy === 'acertos' ? 'descending' : undefined}>Completos</th>
                <th scope="col" className="px-2 sm:px-3 text-right font-semibold hidden sm:table-cell">Parciais</th>
                <th scope="col" className="pl-2 pr-3 sm:pr-4 text-right font-semibold" aria-sort={sortBy === 'pontos' ? 'descending' : undefined}>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: LIMIT }).map((_, i) => <RankingRowSkeleton key={i} />)
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-sm text-muted-foreground text-center py-12">
                    Nenhum participante com pontuação ainda.
                  </td>
                </tr>
              ) : (
                data.data.map(entrada => (
                  <RankingRow
                    key={entrada.usuarioId}
                    entrada={entrada}
                    destaque={entrada.usuarioId === meuId}
                    sortBy={sortBy}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
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

export default function RankingPage() {
  return (
    <div className="flex flex-col gap-6 max-w-[60rem]">
      <div>
        <h1 className="text-5xl sm:text-6xl leading-[0.95]">Ranking geral</h1>
        <p className="text-muted-foreground mt-2 max-w-[60ch]">
          Classificação de todos os participantes do bolão.
        </p>
      </div>

      <Tabs defaultValue="pontos">
        <TabsList variant="line" className="h-11 border-b border-border w-full justify-start rounded-none">
          <TabsTrigger value="pontos" className="h-11 flex-none px-4 text-[15px]">Por pontos</TabsTrigger>
          <TabsTrigger value="acertos" className="h-11 flex-none px-4 text-[15px]">Por acertos completos</TabsTrigger>
        </TabsList>

        <TabsContent value="pontos" className="mt-4">
          <RankingLista sortBy="pontos" />
        </TabsContent>

        <TabsContent value="acertos" className="mt-4">
          <RankingLista sortBy="acertos" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
