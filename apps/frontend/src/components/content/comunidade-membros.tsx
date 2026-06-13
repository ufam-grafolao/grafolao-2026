import { Crown, Shield, MoreVertical, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useExpulsarMembro, usePromoverMembro, useSairComunidade } from '@/hooks/use-comunidades-mutations'
import type { MembroResponse, RoleComunidade } from '@/types/comunidade'

const roleBadge: Record<RoleComunidade, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  DONO:      { label: 'Dono',      variant: 'default'   },
  MODERADOR: { label: 'Moderador', variant: 'secondary' },
  MEMBRO:    { label: 'Membro',    variant: 'outline'   },
}

interface MembroRowProps {
  membro: MembroResponse
  meuRole: RoleComunidade
  comunidadeId: string
  meuId: string
  onSair: () => void
}

function MembroRow({ membro, meuRole, comunidadeId, meuId, onSair }: MembroRowProps) {
  const { mutate: expulsar, isPending: expulsando } = useExpulsarMembro(comunidadeId)
  const { mutate: promover, isPending: promovendo } = usePromoverMembro(comunidadeId)

  const ehEuMesmo = membro.usuarioId === meuId
  const podeMexer =
    !ehEuMesmo &&
    (meuRole === 'DONO' ||
      (meuRole === 'MODERADOR' && membro.role === 'MEMBRO'))

  const podePromover = meuRole === 'DONO' && membro.role !== 'DONO'
  const podeExpulsar = podeMexer

  const badge = roleBadge[membro.role]

  return (
    <div className="flex justify-between items-center gap-3 py-2 border-b border-border w-full last:border-0">
      <div className='flex gap-3 items-center'>
        {membro.usuario.avatarUrl ? (
          <img
            src={membro.usuario.avatarUrl}
            alt={membro.usuario.nome}
            className="h-8 w-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
            {membro.usuario.nome.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{membro.usuario.nome}</span>
          </div>
        </div>
      </div>

      <div className='flex gap-3'>
        {ehEuMesmo && membro.role !== 'DONO' && (
          <button
            onClick={onSair}
            className="cursor-pointer text-center text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            Sair
          </button>
        )}
        {(podeExpulsar || podePromover) && (
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={expulsando || promovendo}
              className="inline-flex items-center justify-center h-7 w-7 shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {(expulsando || promovendo) ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <MoreVertical className="h-3 w-3" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {podePromover && membro.role === 'MEMBRO' && (
                <DropdownMenuItem onClick={() => promover({ usuarioId: membro.usuarioId, role: 'MODERADOR' })}>
                  <Shield className="h-3.5 w-3.5 mr-2" />
                  Tornar moderador
                </DropdownMenuItem>
              )}
              {podePromover && membro.role === 'MODERADOR' && (
                <DropdownMenuItem onClick={() => promover({ usuarioId: membro.usuarioId, role: 'MEMBRO' })}>
                  Rebaixar a membro
                </DropdownMenuItem>
              )}
              {podeExpulsar && (
                <>
                  {podePromover && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => expulsar(membro.usuarioId)}
                  >
                    Expulsar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Badge variant={badge.variant} className="text-xs shrink-0 min-w-24">{badge.label}</Badge>
      </div>
    </div>
  )
}

interface Props {
  membros: MembroResponse[]
  meuRole: RoleComunidade
  comunidadeId: string
  meuId: string
}

export default function MembrosComunidade({ membros, meuRole, comunidadeId, meuId }: Props) {

  const { mutate: sair, isPending: saindo } = useSairComunidade()

  if (membros.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhum membro.</p>
  }

  return (
    <div className="mt-2">
      {membros.map(m => (
        <MembroRow
          key={m.usuarioId}
          membro={m}
          meuRole={meuRole}
          comunidadeId={comunidadeId}
          meuId={meuId}
          onSair={() => {
            if (meuRole === 'DONO') {
              alert('Você não pode sair de uma comunidade que criou.')
              return
            }
            sair(comunidadeId)
          }}
        />
      ))}
    </div>
  )
}