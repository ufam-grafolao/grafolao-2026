import { Component, ReactNode } from 'react'
import { Button } from '../ui/button'

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { erro: boolean }
> {
  state = { erro: false }

  static getDerivedStateFromError() {
    return { erro: true }
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-4">
          <p className="text-lg font-medium">Algo deu errado 😕</p>
          <Button
            className="text-sm cursor-pointer"
            onClick={() => window.location.reload()}
          >
            Recarregar página
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}