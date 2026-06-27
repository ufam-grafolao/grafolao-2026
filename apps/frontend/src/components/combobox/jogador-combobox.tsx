import { useState } from 'react'
import { Check, Search } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { useBuscarJogadores } from '@/hooks/use-jogadores'
import type { JogadorBusca } from '@/types/jogadores'
import { getBandeira } from '@/lib/bandeiras'

function FlagImg({ timeNome }: { timeNome: string }) {
  const code = getBandeira(timeNome)
  if (!code) return null
  return (
    <img
      src={`https://flagcdn.com/w20/${code}.png`}
      srcSet={`https://flagcdn.com/w40/${code}.png 2x`}
      alt={timeNome}
      className="shrink-0 rounded-xs"
      style={{ width: 16, height: 12 }}
    />
  )
}

interface JogadorComboboxProps {
  valorAtual: { id: string; name: string; timeNome: string } | null
  onSelecionar: (jogador: JogadorBusca) => void
  disabled?: boolean
}

export function JogadorCombobox({ valorAtual, onSelecionar, disabled }: JogadorComboboxProps) {
  const [open, setOpen] = useState(false)
  const [termo, setTermo] = useState('')
  const { data: resultados, isLoading } = useBuscarJogadores(termo)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" disabled={disabled} className="w-full justify-start gap-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            {valorAtual ? (
              <span className="flex items-center gap-1.5 truncate">
                {valorAtual.name}
                <FlagImg timeNome={valorAtual.timeNome} />
              </span>
            ) : 'Buscar jogador...'}
          </Button>
        }
      />
      <PopoverContent className="bg-sidebar w-[320px] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Digite o nome do jogador..." value={termo} onValueChange={setTermo} />
          <CommandList>
            {termo.trim().length < 2 ? (
              <p className="text-xs text-muted-foreground p-3">Digite ao menos 2 letras.</p>
            ) : isLoading ? (
              <p className="text-xs text-muted-foreground p-3">Buscando...</p>
            ) : (
              <CommandEmpty className="text-xs text-muted-foreground p-3">
                Esse jogador não está disputando a Copa do Mundo 2026.
              </CommandEmpty>
            )}
            {resultados?.map(j => (
              <CommandItem
                key={j.id}
                onSelect={() => { onSelecionar(j); setOpen(false) }}
                className="cursor-pointer gap-2"
              >
                {j.fotoUrl && <img src={j.fotoUrl} alt={j.name} className="h-6 w-6 rounded-full object-cover shrink-0" />}
                <span className="flex-1 text-sm truncate">{j.name}</span>
                <FlagImg timeNome={j.timeNome} />
                {valorAtual?.id === j.id && <Check className="h-4 w-4 ml-1 shrink-0" />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
