import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft, Copy, Trash2, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useComunidadeDetalhes } from '@/hooks/use-comunidades-detalhes'
import { useSolicitacoes } from '@/hooks/use-comunidades-solicitacoes'
import { useAlterarTipoComunidade, useDeletarComunidade, useEntrarComunidade } from '@/hooks/use-comunidades-mutations'
import RankingComunidade from '@/components/content/comunidade-ranking'
import MembrosComunidade from '@/components/content/comunidade-membros'
import SolicitacoesComunidade from '@/components/content/comunidade-solicitacoes'
import { useToast } from '@/lib/toast'
import { useAuth } from '@/hooks/use-auth'

export default function ComunidadeDetalhePage() {
  const { comunidadeId } = useParams<{ comunidadeId: string }>()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { confirm, toast } = useToast()

  const { data: comunidade, isLoading, isError } = useComunidadeDetalhes(comunidadeId ?? null)
  const { data: solicitacoes } = useSolicitacoes(
    comunidade?.meuRole && ['DONO', 'MODERADOR'].includes(comunidade.meuRole) ? comunidadeId ?? null : null
  )
  const { mutate: deletar, isPending: deletando } = useDeletarComunidade()
  const { mutate: alterarTipo, isPending: alterando } = useAlterarTipoComunidade(comunidade?.id ?? '')
  const { mutate: entrar, isPending: entrando } = useEntrarComunidade()

  const podeDeletar = comunidade?.meuRole === 'DONO'
  const podeAlterar = comunidade?.meuRole === 'DONO'
  const naoEMembro = !comunidade?.meuRole
  const podeVerSolicitacoes =
    comunidade?.tipo === 'PRIVADA' &&
    comunidade?.meuRole &&
    ['DONO', 'MODERADOR'].includes(comunidade.meuRole)

  const pendentes = solicitacoes?.length ?? 0

  function handleCopiarCodigo() {
    if (comunidade?.codigoCovite) {
      navigator.clipboard.writeText(comunidade.codigoCovite)
      toast('success', 'Código copiado!')
    }
  }

  function handleDeletar() {
    if (!comunidadeId) return
    confirm(
      'Deletar comunidade?',
      'Essa ação não pode ser desfeita.',
      () => deletar(comunidadeId, { onSuccess: () => navigate('/comunidades') })
    )
  }

  if (isError) return <Navigate to="/comunidades" replace />

  return (
    <div className="flex flex-col gap-6 w-full">
      <Button variant="ghost" size="sm" className="w-fit -ml-2" onClick={() => navigate('/comunidades')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Comunidades
      </Button>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-60 w-full rounded-md" />
        </div>
      ) : comunidade ? (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

          {/* Coluna esquerda — info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {comunidade.avatarUrl ? (
                <img src={comunidade.avatarUrl} alt={comunidade.nome} className="h-16 w-16 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground shrink-0">
                  {comunidade.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-semibold leading-tight">{comunidade.nome}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {comunidade.tipo === 'PRIVADA' ? '🔒 Privada' : '🌐 Pública'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{comunidade._count.membros} membros</span>
                </div>
              </div>
            </div>

            {comunidade.descricao && (
              <p className="text-sm text-muted-foreground">{comunidade.descricao}</p>
            )}

            {podeAlterar && (
              <button
                onClick={() => alterarTipo(comunidade.tipo === 'PUBLICA' ? 'PRIVADA' : 'PUBLICA')}
                disabled={alterando}
                className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors w-fit"
              >
                {alterando
                  ? <Loader2 className="h-3 w-3 animate-spin inline" />
                  : comunidade.tipo === 'PUBLICA' ? 'Tornar privada' : 'Tornar pública'
                }
              </button>
            )}

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
              <Button onClick={() => entrar({ comunidadeId: comunidade.id, body: {} })} disabled={entrando}>
                {entrando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Entrar na comunidade
              </Button>
            )}

            {podeDeletar && (
              <div className="border-t border-border pt-4 mt-auto">
                <Button variant="destructive" size="sm" className="w-full" disabled={deletando} onClick={handleDeletar}>
                  {deletando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar comunidade
                </Button>
              </div>
            )}
          </div>

          {/* Coluna direita — tabs */}
          <div className="min-w-0">
            <Tabs defaultValue="ranking" className="w-full">
              <TabsList variant="line">
                <TabsTrigger value="ranking">Ranking</TabsTrigger>
                <TabsTrigger value="membros">Membros</TabsTrigger>
                {podeVerSolicitacoes && (
                  <TabsTrigger value="solicitacoes">
                    Solicitações
                    {pendentes > 0 && (
                      <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                        {pendentes}
                      </span>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="ranking" className="mt-4">
                <RankingComunidade comunidadeId={comunidade.id} />
              </TabsContent>

              <TabsContent value="membros" className="mt-4">
                <MembrosComunidade
                  membros={comunidade.membros}
                  meuRole={comunidade.meuRole ?? 'MEMBRO'}
                  comunidadeId={comunidade.id}
                  meuId={usuario?.id ?? ''}
                />
              </TabsContent>

              {podeVerSolicitacoes && (
                <TabsContent value="solicitacoes" className="mt-4">
                  <SolicitacoesComunidade comunidadeId={comunidade.id} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-16">Comunidade não encontrada.</p>
      )}
    </div>
  )
}