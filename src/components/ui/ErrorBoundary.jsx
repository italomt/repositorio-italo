import { Component } from 'react'
import * as Sentry from '../../lib/sentry'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { erro: null }
  }

  static getDerivedStateFromError(erro) {
    return { erro }
  }

  componentDidCatch(erro, info) {
    console.error('[ErrorBoundary]', erro, info)
    Sentry.captureException(erro, { contexts: { react: { componentStack: info?.componentStack } } })
  }

  handleReset = () => {
    Sentry.captureEvent({ message: 'error_boundary_retry', level: 'info' })
    this.setState({ erro: null })
  }

  render() {
    if (this.state.erro) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-card p-6">
          <div className="max-w-md text-center">
            <p className="text-[18px] font-bold text-red mb-2">Erro inesperado</p>
            <p className="text-[14px] text-muted mb-4">{this.state.erro?.message || 'Algo deu errado.'}</p>
            <button
              onClick={this.handleReset}
              className="tap-scale px-6 py-2.5 rounded-full bg-blue text-white text-[14px] font-semibold"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
