import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging on mobile
    try {
      localStorage.setItem('lastError', JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Failed to save error to localStorage:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <div className="text-red-500 text-6xl mb-4 text-center">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              应用出错了
            </h1>
            <p className="text-gray-600 mb-4 text-center">
              很抱歉，应用遇到了一个错误
            </p>

            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                查看错误详情
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono overflow-auto">
                <p className="text-red-600 font-semibold mb-2">
                  {this.state.error?.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="whitespace-pre-wrap text-gray-700">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </details>

            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                重新加载应用
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600"
              >
                清除数据并重启
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              如果问题持续存在，请尝试更新浏览器或清除浏览器缓存
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
