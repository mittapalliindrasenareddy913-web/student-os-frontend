import React from 'react';
import { AlertTriangle, RotateCcw, Home, MessageSquare } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  handleReportError = () => {
    alert("Error reported successfully to Student OS team! 🚀");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#090514] text-white relative overflow-hidden">
          {/* Background decorative blobs */}
          <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="w-full max-w-md z-10 space-y-6 text-center p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md shadow-2xl">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10 animate-pulse">
                <AlertTriangle size={32} />
              </div>
              <h1 className="text-xl font-black tracking-tight uppercase text-red-400">Something went wrong</h1>
              <p className="text-xs text-text-secondary leading-relaxed">
                An unexpected error occurred while rendering this screen. Rest assured, our team has been notified.
              </p>
            </div>

            {/* Error Message Details */}
            {this.state.error && (
              <div className="p-3 bg-black/45 border border-white/5 rounded-xl text-left">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1">Error Details</p>
                <p className="text-[10px] text-white/70 font-mono break-all line-clamp-3">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 pt-2">
              <button
                onClick={this.handleRetry}
                className="h-11 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[.98] shadow-lg shadow-purple-600/20"
              >
                <RotateCcw size={14} />
                <span>Retry</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={this.handleGoHome}
                  className="h-10 bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Home size={13} />
                  <span>Go Home</span>
                </button>
                <button
                  onClick={this.handleReportError}
                  className="h-10 bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <MessageSquare size={13} />
                  <span>Report Error</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
