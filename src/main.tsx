// Safe localStorage polyfill to prevent SecurityError / Access Denied exceptions in sandboxed iframes
try {
  const testKey = '__storage_test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  const mockStorage: Record<string, string> = {};
  const storageMock = {
    getItem: (key: string): string | null => {
      return key in mockStorage ? mockStorage[key] : null;
    },
    setItem: (key: string, value: string): void => {
      mockStorage[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete mockStorage[key];
    },
    clear: (): void => {
      for (const key in mockStorage) {
        delete mockStorage[key];
      }
    },
    key: (index: number): string | null => {
      const keys = Object.keys(mockStorage);
      return keys[index] || null;
    },
    get length(): number {
      return Object.keys(mockStorage).length;
    }
  };

  try {
    Object.defineProperty(window, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true
    });
  } catch (err) {
    // Fallback if property is not configurable
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Initialize Theme from localStorage immediately on startup
try {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
} catch (e) {
  document.documentElement.classList.add('light');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
