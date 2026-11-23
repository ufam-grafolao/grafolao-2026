import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Detalhes no celular: gaveta inferior em meia altura e não modal.
 * O grafo continua visível e tocável acima dela, então o foco animado do nó
 * escolhido fica à vista e tocar em outro nó troca o conteúdo sem fechar.
 * Esc ou o botão fecham; ao fechar, o foco do teclado volta para onde estava.
 */
export function GavetaDetalhes({
  aberta,
  onFechar,
  titulo,
  children,
}: {
  aberta: boolean
  onFechar: () => void
  /** Nome da região para leitores de tela (ex.: "Detalhes do participante") */
  titulo: string
  children: ReactNode
}) {
  const regiaoRef = useRef<HTMLElement>(null)
  const focoAnterior = useRef<HTMLElement | null>(null)
  const onFecharRef = useRef(onFechar)

  useEffect(() => {
    onFecharRef.current = onFechar
  }, [onFechar])

  useEffect(() => {
    if (!aberta) return
    focoAnterior.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    // Depois do toque, o navegador ainda dispara os eventos de mouse de compatibilidade,
    // que tiram o foco; por isso o foco vai para a gaveta no próximo ciclo.
    const espera = window.setTimeout(() => regiaoRef.current?.focus({ preventScroll: true }), 0)

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onFecharRef.current()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => {
      window.clearTimeout(espera)
      window.removeEventListener('keydown', aoTeclar)
      const anterior = focoAnterior.current
      if (anterior?.isConnected && anterior !== document.body) anterior.focus({ preventScroll: true })
    }
  }, [aberta])

  return createPortal(
    <section
      ref={regiaoRef}
      aria-label={titulo}
      tabIndex={-1}
      inert={!aberta}
      data-aberta={aberta}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex h-[min(50dvh,28rem)] flex-col rounded-t-2xl border-t border-border bg-card text-card-foreground shadow-[0_-8px_32px_rgb(0_0_0/0.22)] outline-none',
        'transition-[translate,visibility] duration-300 ease-gaveta motion-reduce:transition-none',
        aberta ? 'visible translate-y-0' : 'invisible translate-y-full',
      )}
    >
      <div className="relative flex shrink-0 items-center justify-center pt-2">
        <span className="h-1 w-10 rounded-full bg-border" aria-hidden />
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-2 top-1 grid size-11 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          aria-label="Fechar detalhes"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">{children}</div>
    </section>,
    document.body,
  )
}
