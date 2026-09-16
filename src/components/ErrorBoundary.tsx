import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled render error, recovering:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center gap-4 bg-[#1e293b] text-white p-6 text-center select-none">
          <h1 className="text-2xl sm:text-3xl game-font">OPS, ALGO TRAVOU</h1>
          <p className="text-white/60 text-xs sm:text-sm max-w-sm">
            Ocorreu um erro inesperado. Recarregue a página para continuar jogando.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black game-font text-xs sm:text-sm px-6 py-3 rounded-xl transition-colors"
          >
            RECARREGAR
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
