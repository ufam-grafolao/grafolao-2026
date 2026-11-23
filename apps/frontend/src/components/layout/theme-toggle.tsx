import { Monitor, Moon, Sun } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTema } from '@/hooks/use-tema'
import type { PreferenciaTema } from '@/lib/tema'

const OPCOES: { valor: PreferenciaTema; rotulo: string; icone: typeof Sun }[] = [
  { valor: 'light', rotulo: 'Claro', icone: Sun },
  { valor: 'dark', rotulo: 'Escuro', icone: Moon },
  { valor: 'system', rotulo: 'Seguir o sistema', icone: Monitor },
]

/** Escolha do tema no cabeçalho: claro, escuro ou seguir o sistema (padrão). */
export function ThemeToggle() {
  const { preferencia, resolvido, definirPreferencia } = useTema()
  const atual = OPCOES.find((o) => o.valor === preferencia) ?? OPCOES[2]
  // O ícone mostra o tema na tela; o rótulo diz também qual foi a escolha
  const Icone = resolvido === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Tema: ${atual.rotulo}. Mudar tema`}
        title="Mudar tema"
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-[background-color,color] duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-popup-open:bg-accent data-popup-open:text-accent-foreground"
      >
        <Icone className="size-5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tema</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={preferencia}
            onValueChange={(valor) => definirPreferencia(valor as PreferenciaTema)}
          >
            {OPCOES.map(({ valor, rotulo, icone: IconeOpcao }) => (
              <DropdownMenuRadioItem key={valor} value={valor} className="min-h-11 gap-2.5 px-2.5">
                <IconeOpcao aria-hidden />
                {rotulo}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
