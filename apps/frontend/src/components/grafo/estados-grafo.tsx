import type { ReactNode } from 'react'
import { ExternalLink, RotateCw, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LimiteDeErro } from '@/components/layout/limite-de-erro'
import { COR_GRAFO } from '@/lib/grafo-visual'
import { URL_ISSUES } from '@/lib/links'

/** Painel carregando: o mesmo fundo escuro, sem salto quando o grafo chega. */
export function PainelCarregando({ mensagem = 'Montando o grafo…' }: { mensagem?: string }) {
  return (
    <div className="grid h-full place-items-center bg-grafo-fundo" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="relative size-24" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="absolute size-3 rounded-full opacity-60 motion-safe:animate-pulse"
              style={{
                backgroundColor: COR_GRAFO.no,
                left: `${50 + 38 * Math.cos((i / 6) * Math.PI * 2)}%`,
                top: `${50 + 38 * Math.sin((i / 6) * Math.PI * 2)}%`,
                transform: 'translate(-50%, -50%)',
                animationDelay: `${i * 120}ms`,
              }}
            />
          ))}
          <span className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/80" />
        </div>
        <p className="text-sm text-grafo-texto-2">{mensagem}</p>
      </div>
    </div>
  )
}

/** Painel vazio: diz por que está vazio e, quando houver, oferece o próximo passo. */
export function PainelVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string
  descricao: string
  acao?: { rotulo: string; onClick: () => void }
}) {
  return (
    <div className="grid h-full place-items-center bg-grafo-fundo p-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-3">
        <h2 className="font-display text-3xl font-bold leading-tight text-grafo-texto">{titulo}</h2>
        <p className="text-grafo-texto-2">{descricao}</p>
        {acao && (
          <Button
            onClick={acao.onClick}
            className="mt-1 h-11 bg-gold px-4 text-gold-foreground hover:bg-gold/90 focus-visible:ring-gold/50"
          >
            {acao.rotulo}
          </Button>
        )}
      </div>
    </div>
  )
}

/** Erro de carregamento de uma tela de grafo, dentro da página (o título da página continua acima). */
export function ErroGrafo({ titulo, onTentarDeNovo }: { titulo: string; onTentarDeNovo: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6 sm:p-8">
      <span className="grid size-11 place-items-center rounded-full bg-secondary text-secondary-foreground" aria-hidden>
        <Unplug className="size-5" />
      </span>
      <div>
        <h2 className="font-display text-3xl font-bold leading-tight">{titulo}</h2>
        <p className="mt-1 max-w-[60ch] text-muted-foreground">
          O servidor não respondeu agora. Tente de novo em alguns segundos.
        </p>
      </div>
      <Button className="h-11 px-4" onClick={onTentarDeNovo}>
        <RotateCw aria-hidden /> Tentar de novo
      </Button>
      <a
        href={URL_ISSUES}
        target="_blank"
        rel="noreferrer"
        className="-my-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Relatar o problema nas Issues do GitHub
        <ExternalLink className="size-3.5" aria-hidden />
        <span className="sr-only">(abre em nova aba)</span>
      </a>
    </div>
  )
}

/** Limite de erro da área de dados de uma tela de grafo: cabeçalho e filtros continuam na tela. */
export function LimiteDeErroGrafo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <LimiteDeErro fallback={(tentarDeNovo) => <ErroGrafo titulo={titulo} onTentarDeNovo={tentarDeNovo} />}>
      {children}
    </LimiteDeErro>
  )
}
