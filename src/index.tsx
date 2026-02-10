import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import reportWebVitals from './reportWebVitals';

// 添加控制台日志显示（用于调试）
try {
  const isDebug = new URLSearchParams(window.location.search).get('debug') === 'true';
  if (isDebug) {
    const logs: Array<{ type: string; message: string }> = [];
    const originalLog = console.log;

    console.log = (...args: any[]) => {
      originalLog(...args);
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      logs.push({ type: 'log', message: msg });
      if (logs.length > 50) logs.shift();

      let panel = document.getElementById('debug-panel') as HTMLElement;
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;bottom:10px;background:#000;color:#0f0;padding:10px;font:12px monospace;z-index:999999;overflow:auto';
        const btn = document.createElement('button');
        btn.textContent = '关闭';
        btn.style.cssText = 'position:fixed;top:15px;right:15px;z-index:1000000';
        btn.onclick = () => panel.remove();
        document.body.appendChild(btn);
        document.body.appendChild(panel);
      }

      panel.innerHTML = logs.map(l => `[${l.type}] ${l.message}`).join('\n');
    };
    console.log('🔍 调试模式已启用');
  }
} catch (e) {
  console.error('Debug setup error:', e);
}

// Add global error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  try {
    localStorage.setItem('lastGlobalError', JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.toString(),
      timestamp: new Date().toISOString(),
    }));
  } catch (e) {
    console.error('Failed to save global error:', e);
  }
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  try {
    localStorage.setItem('lastPromiseRejection', JSON.stringify({
      reason: event.reason?.toString(),
      promise: event.promise?.toString(),
      timestamp: new Date().toISOString(),
    }));
  } catch (e) {
    console.error('Failed to save promise rejection:', e);
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
