import { useState, useMemo } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { useTimes } from '@/hooks/use-palpites-especiais'
import { getNomePt } from '@/lib/nomes-times'
import { getBandeira } from '@/lib/bandeiras'

function FlagImg({ nome, width = 20 }: { nome: string; width?: number }) {
  const code = getBandeira(nome)
  if (!code) return null
  return (
    <img
      src={`https://flagcdn.com/w20/${code}.png`}
      srcSet={`https://flagcdn.com/w40/${code}.png 2x`}
      alt={nome}
      className="shrink-0 rounded-xs"
      style={{ width, height: Math.round(width * 0.75) }}
    />
  )
}

export interface TimeSelecionado {
  id: string
  nome: string
  codigo: string | null
  grupo: string | null
}

interface TimeComboboxProps {
  valorAtual: TimeSelecionado | null
  onSelecionar: (time: TimeSelecionado) => void
  disabled?: boolean
}

export function TimeCombobox({ valorAtual, onSelecionar, disabled }: TimeComboboxProps) {
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const { data: times = [], isLoading } = useTimes()

  const grupos = useMemo(() => {
    const filtrados = busca.trim()
      ? times.filter(t =>
          t.nome.toLowerCase().includes(busca.toLowerCase()) ||
          getNomePt(t.nome).toLowerCase().includes(busca.toLowerCase())
        )
      : times

    const map = new Map<string, typeof filtrados>()
    for (const t of filtrados) {
      const g = t.grupo ?? 'Sem grupo'
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(t)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [times, busca])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" disabled={disabled || isLoading} className="w-full justify-between gap-2">
            <span className="flex items-center gap-2 truncate">
              {valorAtual && <FlagImg nome={valorAtual.nome} width={16} />}
              {valorAtual ? getNomePt(valorAtual.nome) : 'Selecionar time...'}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </Button>
        }
      />
      <PopoverContent className="bg-sidebar w-75 p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar time..." value={busca} onValueChange={setBusca} />
          <CommandList className="max-h-64">
            {grupos.length === 0 && (
              <CommandEmpty className="text-xs text-muted-foreground p-3">
                Nenhum time encontrado.
              </CommandEmpty>
            )}
            {grupos.map(([grupo, lista]) => (
              <CommandGroup key={grupo} heading={`${grupo.replace('Group', 'Grupo ')}`}>
                {lista.map(t => (
                  <CommandItem
                    key={t.id}
                    onSelect={() => { onSelecionar(t); setOpen(false); setBusca('') }}
                    className="cursor-pointer gap-2"
                  >
                    <FlagImg nome={t.nome} width={20} />
                    <span className="flex-1 text-sm">{getNomePt(t.nome)}</span>
                    {t.codigo && (
                      <span className="text-xs text-muted-foreground font-mono">{t.codigo}</span>
                    )}
                    {valorAtual?.id === t.id && <Check className="h-4 w-4 ml-1 text-primary" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
