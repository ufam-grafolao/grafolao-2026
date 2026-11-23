import { Component, type ErrorInfo, type ReactNode } from 'react'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'

interface LimiteProps {
  children: ReactNode
  /** O que mostrar no lugar do conteúdo que falhou; `tentarDeNovo` limpa o erro e refaz as consultas */
  fallback: (tentarDeNovo: () => void) => ReactNode
  onReset: () => void
}

class Limite extends Component<LimiteProps, { erro: boolean }> {
  state = { erro: false }

  static getDerivedStateFromError() {
    return { erro: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
  }

  tentarDeNovo = () => {
    this.props.onReset()
    this.setState({ erro: false })
  }

  render() {
    return this.state.erro ? this.props.fallback(this.tentarDeNovo) : this.props.children
  }
}

/**
 * Limite de erro local: uma falha (inclusive de consulta à API, que usa throwOnError)
 * aparece só na região envolvida, sem derrubar o app. Reporta ao Sentry.
 */
export function LimiteDeErro({ children, fallback }: Omit<LimiteProps, 'onReset'>) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <Limite onReset={reset} fallback={fallback}>
          {children}
        </Limite>
      )}
    </QueryErrorResetBoundary>
  )
}
