import { Crown, Shield, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ComunidadeResponse, RoleComunidade } from '@/types/comunidade'

const roleBadge: Record<RoleComunidade, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  DONO:       { label: 'Dono',       variant: 'default'   },
  MODERADOR:  { label: 'Moderador',  variant: 'secondary' },
  MEMBRO:     { label: 'Membro',     variant: 'outline'   },
}

const roleIcon: Record<RoleComunidade, React.ReactNode> = {
  DONO:      <Crown className="h-3 w-3" />,
  MODERADOR: <Shield className="h-3 w-3" />,
  MEMBRO:    null,
}

interface ComunidadeCardProps {
  comunidade: ComunidadeResponse
  meuRole?: RoleComunidade | null
  totalMembros?: number
  onClick: () => void
}

export default function ComunidadeCard({ comunidade, meuRole, totalMembros, onClick }: ComunidadeCardProps) {
  const badge = meuRole ? roleBadge[meuRole] : null

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          {comunidade.avatarUrl ? (
            <img
              src={comunidade.avatarUrl}
              alt={comunidade.nome}
              className="h-10 w-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-lg font-bold text-muted-foreground">
              {comunidade.nome.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">{comunidade.nome}</span>
              {badge && (
                <Badge variant={badge.variant} className="flex items-center gap-1 text-xs shrink-0">
                  {roleIcon[meuRole!]}
                  {badge.label}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs shrink-0">
                {comunidade.tipo === 'PRIVADA' ? '🔒 Privada' : '🌐 Pública'}
              </Badge>
            </div>

            {comunidade.descricao && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {comunidade.descricao}
              </p>
            )}

            {totalMembros !== undefined && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {totalMembros} {totalMembros === 1 ? 'membro' : 'membros'}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}