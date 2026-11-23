import { useEffect, useState, type ReactNode, type Ref, type RefObject } from 'react'
import { Info, LocateFixed, Maximize2, Minimize2, Minus, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COR_GRAFO } from '@/lib/grafo-visual'

/**
 * Campo escuro onde o grafo é desenhado. É escuro nos dois temas;
 * no tema escuro do app, um contorno (4,0:1) o separa do fundo.
 */
export function PainelGrafo({
  children,
  className,
  ref,
}: {
  children: ReactNode
  className?: string
  ref?: Ref<HTMLDivElement>
}) {
  return (
    <div ref={ref} className={cn('relative overflow-hidden rounded-xl border border-grafo-contorno bg-grafo-fundo', className)}>
      {children}
    </div>
  )
}

const BOTAO_CONTROLE =
  'grid size-11 cursor-pointer place-items-center text-grafo-texto transition-[background-color] duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-gold active:bg-white/15'

/** Zoom, centralizar e tela cheia, flutuando no canto do painel. */
export function ControlesGrafo({
  onAproximar,
  onAfastar,
  onCentralizar,
  alvoTelaCheia,
}: {
  onAproximar: () => void
  onAfastar: () => void
  onCentralizar: () => void
  /** Elemento que vai para tela cheia (normalmente o painel inteiro, com controles e legenda) */
  alvoTelaCheia?: RefObject<HTMLElement | null>
}) {
  const [telaCheia, setTelaCheia] = useState(false)

  useEffect(() => {
    const aoMudar = () => setTelaCheia(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', aoMudar)
    return () => document.removeEventListener('fullscreenchange', aoMudar)
  }, [])

  // Safari do iPhone não tem tela cheia para <div>: o botão nem aparece
  const podeTelaCheia = !!alvoTelaCheia && typeof document !== 'undefined' && document.fullscreenEnabled

  function alternarTelaCheia() {
    if (!document.fullscreenElement) alvoTelaCheia?.current?.requestFullscreen()
    else document.exitFullscreen()
  }

  return (
    <div
      role="toolbar"
      aria-label="Controles do grafo"
      aria-orientation="vertical"
      className="vidro-grafo absolute right-3 top-3 z-10 flex flex-col divide-y divide-white/15 overflow-hidden rounded-lg"
    >
      <button type="button" className={BOTAO_CONTROLE} onClick={onAproximar} aria-label="Aproximar" title="Aproximar">
        <Plus className="size-4" aria-hidden />
      </button>
      <button type="button" className={BOTAO_CONTROLE} onClick={onAfastar} aria-label="Afastar" title="Afastar">
        <Minus className="size-4" aria-hidden />
      </button>
      <button type="button" className={BOTAO_CONTROLE} onClick={onCentralizar} aria-label="Centralizar o grafo" title="Centralizar">
        <LocateFixed className="size-4" aria-hidden />
      </button>
      {podeTelaCheia && (
        <button
          type="button"
          className={BOTAO_CONTROLE}
          onClick={alternarTelaCheia}
          aria-label={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
          title={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
        >
          {telaCheia ? <Minimize2 className="size-4" aria-hidden /> : <Maximize2 className="size-4" aria-hidden />}
        </button>
      )}
    </div>
  )
}

export interface ItemLegenda {
  marca: ReactNode
  texto: ReactNode
}

/** "Como ler": legenda recolhível no canto inferior do painel. Começa aberta no desktop. */
export function LegendaGrafo({ itens, dica }: { itens: ItemLegenda[]; dica?: string }) {
  const [aberta, setAberta] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768)

  return (
    <div className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)]">
      {aberta ? (
        <div className="vidro-grafo rounded-lg px-3.5 py-3 text-[13px] leading-snug text-grafo-texto">
          <div className="mb-2 flex items-center justify-between gap-6">
            <p className="font-semibold">Como ler</p>
            <button
              type="button"
              onClick={() => setAberta(false)}
              className="-m-2.5 grid size-11 cursor-pointer place-items-center rounded-md text-grafo-texto-2 hover:text-grafo-texto focus-visible:outline-2 focus-visible:outline-gold"
              aria-label="Recolher a legenda"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <ul className="grid gap-1.5 text-grafo-texto-2">
            {itens.map((item, i) => (
              <li key={i} className="flex items-center gap-2.5">
                {item.marca}
                <span>{item.texto}</span>
              </li>
            ))}
          </ul>
          {dica && <p className="mt-2.5 border-t border-white/15 pt-2 text-grafo-texto-2">{dica}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAberta(true)}
          className="vidro-grafo flex h-11 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-[13px] font-semibold text-grafo-texto focus-visible:outline-2 focus-visible:outline-gold"
        >
          <Info className="size-4" aria-hidden />
          Como ler
        </button>
      )}
    </div>
  )
}

// ─── Marcas da legenda (decorativas: o texto ao lado diz o que são)

export function MarcaNo({ cor = COR_GRAFO.no, tamanho = 'size-3' }: { cor?: string; tamanho?: string }) {
  return <span className={cn('shrink-0 rounded-full', tamanho)} style={{ backgroundColor: cor }} aria-hidden />
}

/** Dois círculos de tamanhos diferentes: "o tamanho do nó significa algo". */
export function MarcaTamanho({ cor = COR_GRAFO.no }: { cor?: string }) {
  return (
    <span className="flex w-3 shrink-0 items-end justify-center gap-px" aria-hidden>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: cor }} />
      <span className="size-2.5 rounded-full" style={{ backgroundColor: cor }} />
    </span>
  )
}

export function MarcaSeta({ cor }: { cor: string }) {
  return (
    <svg width="14" height="8" viewBox="0 0 14 8" className="shrink-0" aria-hidden>
      <path d="M0 4h10" stroke={cor} strokeWidth="2" />
      <path d="M9 0.5 13.5 4 9 7.5z" fill={cor} />
    </svg>
  )
}

export function MarcaLinha({ cor }: { cor: string }) {
  return (
    <svg width="14" height="8" viewBox="0 0 14 8" className="shrink-0" aria-hidden>
      <path d="M0 4h14" stroke={cor} strokeWidth="2" />
    </svg>
  )
}
