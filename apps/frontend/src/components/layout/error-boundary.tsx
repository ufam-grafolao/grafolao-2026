import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '../ui/button'
import * as Sentry from '@sentry/react'

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { erro: boolean }
> {
  state = { erro: false }

  static getDerivedStateFromError() {
    return { erro: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    Sentry.captureException(error, {
      extra: {
        componentStack: info.componentStack,
      },
    })
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center">
            <p className="text-4xl">😕</p>
            <p className="text-lg font-semibold">Algo deu errado</p>
            <p className="text-sm text-muted-foreground">
              Tente recarregar a página. Se o problema persistir, entre em contato para que possamos resolver:
            </p>
            <Button className="cursor-pointer" onClick={() => window.location.reload()}>
              Recarregar página
            </Button>
            <div className="text-xs text-muted-foreground flex flex-col gap-1 border border-border rounded-lg px-4 py-3 w-full">
              <span className="font-medium text-foreground mb-1">Reportar problema</span>
              <a href="tel:+5592982502998" className="hover:text-foreground transition-colors">(92) 98250-2998</a>
              <a href="mailto:samueldavi.0907@gmail.com" className="hover:text-foreground transition-colors">samueldavi.0907@gmail.com</a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}