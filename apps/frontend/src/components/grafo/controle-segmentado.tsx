import { useRef, type KeyboardEvent } from 'react'

export interface OpcaoSegmento<T> {
  valor: T
  rotulo: string
  detalhe?: string
}

/**
 * Escolha entre poucas opções exclusivas (radiogroup).
 * Tab entra no item marcado; as setas trocam a opção, como num grupo de rádio nativo.
 */
export function ControleSegmentado<T extends string | number>({
  rotulo,
  opcoes,
  valor,
  onChange,
}: {
  rotulo: string
  opcoes: OpcaoSegmento<T>[]
  valor: T
  onChange: (v: T) => void
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function aoTeclar(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const proximo = (i + delta + opcoes.length) % opcoes.length
    onChange(opcoes[proximo].valor)
    refs.current[proximo]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex rounded-lg bg-muted p-1">
      {opcoes.map((o, i) => {
        const ativo = o.valor === valor
        return (
          <button
            key={String(o.valor)}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={ativo}
            tabIndex={ativo ? 0 : -1}
            onClick={() => onChange(o.valor)}
            onKeyDown={(e) => aoTeclar(e, i)}
            className={`flex min-h-11 cursor-pointer flex-col items-start justify-center rounded-md px-3.5 py-1.5 text-left transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              ativo ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="text-sm font-semibold leading-tight">{o.rotulo}</span>
            {o.detalhe && <span className="text-xs leading-tight">{o.detalhe}</span>}
          </button>
        )
      })}
    </div>
  )
}
