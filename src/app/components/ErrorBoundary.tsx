import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-8" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-gray-800 mb-2 font-bold">خطای غیرمنتظره</h2>
            <p className="text-gray-500 text-sm mb-6">
              یک خطای داخلی رخ داد. لطفاً صفحه را مجدداً بارگذاری کنید.
            </p>
            <details className="text-left text-xs text-gray-400 bg-gray-50 rounded p-3 mb-4 max-h-32 overflow-auto">
              <summary className="cursor-pointer">جزئیات خطا</summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error?.message}</pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              بارگذاری مجدد
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
