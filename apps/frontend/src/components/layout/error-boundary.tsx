import { Component, type ErrorInfo, type ReactNode } from 'react'
import * as Sentry from '@sentry/react'
import { ExternalLink } from 'lucide-react'
import { Button } from '../ui/button'
import { URL_ISSUES } from '@/lib/links'

/**
 * Última rede de segurança: só aparece se a própria casca do app falhar.
 * Erros de uma página ficam no limite local de AppLayout (limite-de-erro.tsx).
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { erro: boolean }> {
  state = { erro: false }

  static getDerivedStateFromError() {
    return { erro: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    Sentry.captureException(error, {
      extra: {
        componentStack: info.componentStack,
      },
    })
  }

  render() {
    if (this.state.erro) {
      return (
        <main className="flex min-h-dvh items-center justify-center p-6">
          <div role="alert" className="flex max-w-sm flex-col items-center gap-4 text-center">
            <h1 className="font-display text-4xl font-bold leading-tight">Algo deu errado</h1>
            <p className="text-muted-foreground">
              Tente recarregar a página. Se o problema continuar, relate nas Issues do repositório para que possamos resolver.
            </p>
            <Button className="h-11 cursor-pointer px-4" onClick={() => window.location.reload()}>
              Recarregar a página
            </Button>
            <a
              href={URL_ISSUES}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Relatar o problema nas Issues do GitHub
              <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
