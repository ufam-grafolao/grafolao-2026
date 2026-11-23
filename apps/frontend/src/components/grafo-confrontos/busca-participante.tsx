import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import type { NoGrafo } from '@/types/grafo-confrontos'

/** Busca por nome entre os nós do grafo; ao escolher, a página seleciona e centraliza a câmera. */
export function BuscaParticipante({ nos, onEscolher }: { nos: NoGrafo[]; onEscolher: (no: NoGrafo) => void }) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')

  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return termo ? nos.filter((n) => n.nome.toLowerCase().includes(termo)) : nos
  }, [nos, busca])

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={nos.length === 0}
            className="h-11 w-full justify-start gap-2.5 border-input bg-card px-3.5 font-normal text-muted-foreground sm:w-72"
          >
            <Search aria-hidden />
            Buscar participante
          </Button>
        }
      />
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Nome do participante" value={busca} onValueChange={setBusca} />
          <CommandList className="max-h-72 overscroll-contain">
            <CommandEmpty className="p-3 text-sm text-muted-foreground">Ninguém com esse nome no recorte.</CommandEmpty>
            {resultados.map((no) => (
              <CommandItem
                key={no.id}
                value={no.id}
                onSelect={() => {
                  onEscolher(no)
                  setAberto(false)
                  setBusca('')
                }}
                className="min-h-11 cursor-pointer gap-3"
              >
                <span className="w-7 text-right font-display text-lg font-bold tabular-nums">{no.posicao}</span>
                <span className="flex-1 truncate text-sm">{no.nome}</span>
                {no.posicao <= 5 && <span className="size-2 rounded-full bg-gold" aria-label="Top 5" />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
