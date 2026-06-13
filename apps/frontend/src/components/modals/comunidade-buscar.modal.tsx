import { useState } from 'react'
import { Search, Loader2, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useBuscarComunidades } from '@/hooks/use-comunidades-buscar'
import { useEntrarComunidade, useSolicitarEntrada } from '@/hooks/use-comunidades-mutations'
import type { ComunidadeComContagem } from '@/types/comunidade'

interface Props {
  open: boolean
  onClose: () => void
}

export default function BuscarComunidadeModal({ open, onClose }: Props) {
  const [codigoInput, setCodigoInput] = useState('')
  const [alvo, setAlvo] = useState<ComunidadeComContagem | null>(null)

  const { data: resultados, isFetching, busca, setBusca } = useBuscarComunidades()
  const { mutate: entrar, isPending: entrando, error: erroEntrar, reset: resetEntrar } = useEntrarComunidade()
  const { mutate: solicitar, isPending: solicitando, error: erroSolicitar, reset: resetSolicitar } = useSolicitarEntrada()

  function handleClose() {
    setBusca('')
    setCodigoInput('')
    setAlvo(null)
    resetEntrar()
    resetSolicitar()
    onClose()
  }

  function handleEscolher(c: ComunidadeComContagem) {
    if (c.membros.length > 0) return
    setAlvo(c)
    setCodigoInput('')
    resetEntrar()
    resetSolicitar()
  }

  function handleEntrar() {
    if (!alvo) return

    if (alvo.tipo === 'PUBLICA') {
      entrar({ comunidadeId: alvo.id, body: {} }, { onSuccess: handleClose })
    } else {
      solicitar(alvo.id, { onSuccess: handleClose })
    }
  }

  const jaMembro = alvo && alvo.membros.length > 0
  const erro = erroEntrar ?? erroSolicitar

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Entrar em uma comunidade</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input

              placeholder="Buscar pelo nome ou código..."
              className="pl-9"
              value={busca}
              onChange={e => { setBusca(e.target.value); setAlvo(null) }}
            />
          </div>

          {isFetching && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isFetching && resultados && resultados.length === 0 && busca.trim().length >= 2 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma comunidade encontrada.
            </p>
          )}

          {!isFetching && resultados && resultados.length > 0 && !alvo && (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {resultados.map(c => {
                const jaMembro = c.membros.length > 0
                return (
                  <button
                    key={c.id}
                    onClick={() => handleEscolher(c)}
                    disabled={jaMembro}
                    className="flex items-center gap-3 px-3 py-2 rounded-md border text-left hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 font-bold text-sm text-muted-foreground">
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{c.nome}</span>
                        <Badge variant="outline" className="text-xs">
                          {c.tipo === 'PRIVADA' ? '🔒' : '🌐'}
                        </Badge>
                        {jaMembro && <Badge variant="secondary" className="text-xs">Já membro</Badge>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Users className="h-3 w-3" />
                        {c._count.membros} membros
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {alvo && !jaMembro && (
            <div className="flex flex-col gap-3 border rounded-md p-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground shrink-0">
                  {alvo.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{alvo.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {alvo.tipo === 'PRIVADA' ? '🔒 Privada' : '🌐 Pública'} · {alvo._count.membros} membros
                  </p>
                </div>
              </div>

              {alvo.tipo === 'PRIVADA' && (
                <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
                  Esta é uma comunidade privada. Sua solicitação será enviada para aprovação dos moderadores.
                </p>
              )}

              {erro && (
                <p className="text-xs text-destructive">
                  {erro instanceof Error ? erro.message : 'Erro ao processar'}
                </p>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setAlvo(null)}>
                  Voltar
                </Button>
                <Button size="sm" onClick={handleEntrar} disabled={entrando || solicitando}>
                  {(entrando || solicitando) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {alvo.tipo === 'PRIVADA' ? 'Solicitar entrada' : 'Entrar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}