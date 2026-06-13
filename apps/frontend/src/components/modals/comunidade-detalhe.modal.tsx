import { useState } from 'react'
import { Copy, Trash2, Loader2, Bell } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useComunidadeDetalhes } from '@/hooks/use-comunidades-detalhes'
import { useSolicitacoes } from '@/hooks/use-comunidades-solicitacoes'
import { useAlterarTipoComunidade, useDeletarComunidade, useEntrarComunidade } from '@/hooks/use-comunidades-mutations'
import RankingComunidade from '../content/comunidade-ranking'
import MembrosComunidade from '../content/comunidade-membros'
import SolicitacoesComunidade from '../content/comunidade-solicitacoes'
import { useToast } from '@/lib/toast'

interface Props {
  comunidadeId: string | null
  meuId: string
  onClose: () => void
}

export default function ComunidadeDetalheModal({ comunidadeId, meuId, onClose }: Props) {
  const open = !!comunidadeId

  const { confirm } = useToast()

  const { data: comunidade, isLoading } = useComunidadeDetalhes(comunidadeId)
  const { data: solicitacoes } = useSolicitacoes(
    comunidade?.meuRole && ['DONO', 'MODERADOR'].includes(comunidade.meuRole) ? comunidadeId : null
  )
  const { mutate: deletar, isPending: deletando } = useDeletarComunidade()
  const { mutate: alterarTipo, isPending: alterando } = useAlterarTipoComunidade(comunidade?.id ?? '')
  const podeAlterar = comunidade?.meuRole === 'DONO'

  const naoEMembro = !comunidade?.meuRole
  const { mutate: entrar, isPending: entrando } = useEntrarComunidade()

  const podeDeletar = comunidade?.meuRole === 'DONO'
  const podeVerSolicitacoes =
    comunidade?.tipo === 'PRIVADA' &&
    comunidade?.meuRole &&
    ['DONO', 'MODERADOR'].includes(comunidade.meuRole)

  const pendentes = solicitacoes?.length ?? 0

  function handleCopiarCodigo() {
    if (comunidade?.codigoCovite) {
      navigator.clipboard.writeText(comunidade.codigoCovite)
    }
  }

  function handleDeletar() {
    if (!comunidadeId) return
    confirm(
      'Deletar comunidade?',
      'Essa ação não pode ser desfeita.',
      () => {
        deletar(comunidadeId, { onSuccess: onClose });
        onClose()
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-3 mt-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-60 w-full rounded-md" />
          </div>
        ) : comunidade ? (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                {comunidade.avatarUrl ? (
                  <img src={comunidade.avatarUrl} alt={comunidade.nome} className="h-10 w-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground shrink-0">
                    {comunidade.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-base leading-tight">{comunidade.nome}</DialogTitle>
                  {comunidade.descricao && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{comunidade.descricao}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {comunidade.tipo === 'PRIVADA' ? '🔒 Privada' : '🌐 Pública'}
                    </Badge>
                    {podeAlterar && (
                      <button
                        onClick={() => alterarTipo(comunidade.tipo === 'PUBLICA' ? 'PRIVADA' : 'PUBLICA')}
                        disabled={alterando}
                        className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                      >
                        {alterando ? <Loader2 className="h-3 w-3 animate-spin inline" /> : (
                          comunidade.tipo === 'PUBLICA' ? 'Tornar privada' : 'Tornar pública'
                        )}
                      </button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {comunidade._count.membros} membros
                    </span>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Código de convite */}
            {comunidade.codigoCovite && comunidade.meuRole && ['DONO', 'MODERADOR'].includes(comunidade.meuRole) && (
              <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 text-xs">
                <span className="text-muted-foreground">Código:</span>
                <span className="font-mono font-semibold tracking-widest flex-1">{comunidade.codigoCovite}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopiarCodigo}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}

            {naoEMembro && comunidade.tipo === 'PUBLICA' && (
              <Button
                className="w-full"
                onClick={() => entrar({ comunidadeId: comunidade.id, body: {} }, { onSuccess: onClose })}
                disabled={entrando}
              >
                {entrando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Entrar na comunidade
              </Button>
            )}

            <Tabs defaultValue="ranking" className="w-full">
              <TabsList variant="line">
                <TabsTrigger value="ranking">Ranking</TabsTrigger>
                <TabsTrigger value="membros">Membros</TabsTrigger>
                {podeVerSolicitacoes && (
                  <TabsTrigger value="solicitacoes" className="relative">
                    Solicitações
                    {pendentes > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {pendentes}
                      </span>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="ranking" className="mt-3">
                <RankingComunidade comunidadeId={comunidade.id} />
              </TabsContent>

              <TabsContent value="membros" className="mt-3">
                <MembrosComunidade
                  membros={comunidade.membros}
                  meuRole={comunidade.meuRole ?? 'MEMBRO'}
                  comunidadeId={comunidade.id}
                  meuId={meuId}
                />
              </TabsContent>

              {podeVerSolicitacoes && (
                <TabsContent value="solicitacoes" className="mt-3">
                  <SolicitacoesComunidade comunidadeId={comunidade.id} />
                </TabsContent>
              )}
            </Tabs>

            {podeDeletar && (
              <div className="border-t border-border pt-3 mt-1">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={deletando}
                  onClick={handleDeletar}
                >
                  {deletando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar comunidade
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Comunidade não encontrada.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}