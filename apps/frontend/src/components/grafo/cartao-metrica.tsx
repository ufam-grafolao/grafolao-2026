import { Skeleton } from '@/components/ui/skeleton'

export interface Metrica {
  rotulo: string
  /** Valor já formatado em pt-BR; `null` mostra o esqueleto de carregamento */
  valor: string | null
  /** Uma linha dizendo o que o número significa */
  explicacao: string
}

/** Número tabular grande com uma linha de explicação. */
export function CartaoMetrica({ rotulo, valor, explicacao }: Metrica) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card px-4 py-3.5">
      <dt className="text-[13px] font-semibold text-muted-foreground">{rotulo}</dt>
      <dd className="mt-1 font-display text-[2.5rem] font-bold leading-none tabular-nums">
        {valor === null ? (
          <>
            <Skeleton className="mt-1 h-9 w-16 rounded" aria-hidden />
            <span className="sr-only">Carregando</span>
          </>
        ) : (
          valor
        )}
      </dd>
      <dd className="mt-2 text-[13px] leading-snug text-muted-foreground">{explicacao}</dd>
    </div>
  )
}

/** Grade de cartões: 2 colunas no celular, 4 no desktop. */
export function GradeMetricas({ metricas }: { metricas: Metrica[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metricas.map((m) => (
        <CartaoMetrica key={m.rotulo} {...m} />
      ))}
    </dl>
  )
}
