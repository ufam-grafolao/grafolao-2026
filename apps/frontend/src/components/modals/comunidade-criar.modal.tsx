import { useState } from 'react'
import { Globe2, Loader2, Lock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { useCriarComunidade } from '@/hooks/use-comunidades-mutations'
import type { TipoComunidade } from '@/types/comunidade'
import { cn } from '@/lib/utils'

const tipoConfig = {
  PUBLICA: {
    icon: <Globe2 className="size-4 text-emerald-400" />,
    bg: "bg-emerald-500/10",
    label: "Pública",
    desc: "Qualquer um pode entrar",
  },
  PRIVADA: {
    icon: <Lock className="size-4 text-pink-400" />,
    bg: "bg-pink-500/10",
    label: "Privada",
    desc: "Entrada por solicitação",
  },
} as const;

interface Props {
  open: boolean
  onClose: () => void
}

export default function CriarComunidadeModal({ open, onClose }: Props) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState<TipoComunidade>('PUBLICA')

  const { mutate, isPending, reset } = useCriarComunidade()

  function handleClose() {
    setNome('')
    setDescricao('')
    setTipo('PUBLICA')
    reset()
    onClose()
  }

  function handleSubmit() {
    if (nome.trim().length < 3) return
    mutate(
      { nome: nome.trim(), descricao: descricao.trim() || undefined, tipo },
      { onSuccess: handleClose }
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="bg-sidebar max-w-md">
        <DialogHeader>
          <DialogTitle>Criar grupo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Nome do grupo"
              value={nome}
              onChange={e => setNome(e.target.value)}
              maxLength={50}
            />
            <span className="text-xs text-muted-foreground text-right">{nome.length}/50</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">Descrição <span className="text-muted-foreground">(opcional)</span></Label>
            <Textarea
              id="descricao"
              placeholder="Fale um pouco sobre o grupo..."
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <span className="text-xs text-muted-foreground text-right">{descricao.length}/200</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoComunidade)}>
              <SelectTrigger className="w-full">
                <div className="cursor-pointer flex items-center gap-2.5">
                  <div className={cn("flex size-6 items-center justify-center rounded-md", tipoConfig[tipo].bg)}>
                    {tipoConfig[tipo].icon}
                  </div>
                  <span>{tipoConfig[tipo].label}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(tipoConfig) as [TipoComunidade, typeof tipoConfig[TipoComunidade]][]).map(
                  ([value, { icon, bg, label, desc }]) => (
                    <SelectItem key={value} value={value}>
                      <div className={cn("flex size-7 items-center justify-center rounded-md", bg)}>
                        {icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground">{desc}</span>
                      </div>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {tipo === 'PRIVADA' && (
            <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
              Um código de convite será gerado automaticamente. Você e os moderadores poderão aceitar ou recusar solicitações de entrada.
            </p>
          )}

          <div className="flex gap-2 justify-end mt-1">
            <Button variant="outline" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || nome.trim().length < 3}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}