import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 px-6 py-12">
          <div className="mx-auto max-w-xl rounded-[32px] border border-white/70 bg-white p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#36ADAA]">Recovery Mode</p>
            <h1 className="mt-3 font-display text-3xl font-extrabold text-slate-900">Something went off-track.</h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Refresh the page to re-enter the LMS shell. Your backend lesson-planner logic has not been modified.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
