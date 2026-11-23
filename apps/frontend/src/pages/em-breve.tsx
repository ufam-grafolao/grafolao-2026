import { Hourglass } from 'lucide-react'

/** Tela provisória de uma análise de grafo que ainda não foi publicada. */
export default function EmBrevePage({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <div className="flex max-w-[60ch] flex-col gap-4">
      <div>
        <h1 className="text-5xl leading-[0.95] sm:text-6xl">{titulo}</h1>
        {descricao && <p className="mt-2 text-muted-foreground">{descricao}</p>}
      </div>
      <p className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <Hourglass className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        Esta análise está em construção e aparece aqui em breve.
      </p>
    </div>
  )
}
