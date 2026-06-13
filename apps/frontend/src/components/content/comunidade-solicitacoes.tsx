import { Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSolicitacoes } from '@/hooks/use-comunidades-solicitacoes'
import { useResponderSolicitacao } from '@/hooks/use-comunidades-mutations'

interface Props {
  comunidadeId: string
}

export default function SolicitacoesComunidade({ comunidadeId }: Props) {
  const { data: solicitacoes, isLoading } = useSolicitacoes(comunidadeId)
  const { mutate: responder, isPending } = useResponderSolicitacao(comunidadeId)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-md" />
        ))}
      </div>
    )
  }

  if (!solicitacoes || solicitacoes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhuma solicitação pendente.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      {solicitacoes.map(s => (
        <div key={s.id} className="flex items-center gap-3 border rounded-md px-3 py-2">
          {s.usuario.avatarUrl ? (
            <img src={s.usuario.avatarUrl} alt={s.usuario.nome} className="h-8 w-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
              {s.usuario.nome.charAt(0).toUpperCase()}
            </div>
          )}

          <span className="flex-1 text-sm font-medium truncate">{s.usuario.nome}</span>

          <div className="flex gap-1 shrink-0">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7 text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => responder({ solicitacaoId: s.id, aceitar: false })}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              className="h-7 w-7"
              disabled={isPending}
              onClick={() => responder({ solicitacaoId: s.id, aceitar: true })}
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}