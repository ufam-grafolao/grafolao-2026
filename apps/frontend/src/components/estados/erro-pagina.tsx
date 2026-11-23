import { ExternalLink, RotateCw, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { URL_ISSUES } from '@/lib/links'

/**
 * Erro de uma página inteira, mostrado dentro da casca (menu e cabeçalho continuam).
 * Tem o único <h1> da tela, porque o conteúdo da página não chegou a ser exibido.
 */
export function ErroPagina({ onTentarDeNovo }: { onTentarDeNovo: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-xl flex-col items-start gap-4 py-8 sm:py-16">
      <span className="grid size-11 place-items-center rounded-full bg-secondary text-secondary-foreground" aria-hidden>
        <Unplug className="size-5" />
      </span>
      <div>
        <h1 className="text-4xl leading-tight">Não foi possível abrir esta página</h1>
        <p className="mt-2 text-muted-foreground">
          Pode ser uma instabilidade passageira no servidor. Tente de novo em alguns segundos; o resto do app continua funcionando.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="h-11 px-4" onClick={onTentarDeNovo}>
          <RotateCw aria-hidden /> Tentar de novo
        </Button>
        <Button variant="outline" className="h-11 border-input px-4" onClick={() => window.location.reload()}>
          Recarregar a página
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Se continuar acontecendo,{' '}
        <a
          href={URL_ISSUES}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          relate o problema nas Issues do GitHub
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
        .
      </p>
    </div>
  )
}
