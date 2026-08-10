import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricsGrid } from './components/MetricsGrid';
import { DashboardPage } from './pages/DashboardPage';
import { OptionsPage } from './pages/OptionsPage';
import { LogPage } from './pages/LogPage';
import { AuthPage } from './pages/AuthPage';
import { CreditCard, Sliders, Terminal, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useSessionStore } from '../stores/useSessionStore';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'options' | 'log'>('cards');
  const { user, initializeAuth, isInitializing } = useAuthStore();
  const { setDetectionResult } = useSessionStore();

  useEffect(() => {
    initializeAuth();
    useSessionStore.getState().initializeStore();

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabObj = tabs[0];
        if (activeTabObj?.url) {
          try {
            const urlObj = new URL(activeTabObj.url);
            const domain = urlObj.hostname;

            const isHttp = activeTabObj.url.startsWith('http://') || activeTabObj.url.startsWith('https://');
            chrome.tabs.sendMessage(activeTabObj.id!, { action: 'DETECT_FIELDS' }, (response) => {
              if (chrome.runtime.lastError) {
                const errorMsg = isHttp ? 'Recarga la página (F5)' : 'Página Protegida';
                setDetectionResult(domain || 'Navegador', errorMsg, false);
                return;
              }
              if (response && response.success && response.data) {
                setDetectionResult(domain, response.data.provider.toUpperCase(), response.data.hasCheckout);
              } else {
                setDetectionResult(domain, 'Ninguna', false);
              }
            });
          } catch {
            setDetectionResult('Navegador', 'Página Protegida', false);
          }
        }
      });
    }
  }, []);

  if (isInitializing) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#05070a]">
        <div className="text-center space-y-4 animate-fadeIn">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
          <p className="text-[11px] font-mono text-slate-400 tracking-widest uppercase">Inicializando CODEX(R) SYSTEM...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full min-h-screen text-slate-100 flex flex-col justify-between relative overflow-hidden bg-[#05070a]">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg">
            <AuthPage />
          </div>
        </div>
        <footer className="text-center py-4 relative z-10 border-t border-slate-900">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            CODEX(R) V1.0.1 SYSTEM
          </span>
        </footer>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen text-slate-100 flex flex-col bg-[#05070a] select-none">
      <Header />
      <div className="px-6 pt-4">
        <MetricsGrid />
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 pt-4">
        <nav className="flex items-center gap-1 bg-[#090d16] border border-slate-900/60 p-1 rounded-xl max-w-6xl mx-auto w-full select-none shadow-xl">
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
              activeTab === 'cards'
                ? 'bg-slate-100 text-slate-900 shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>CARDS</span>
          </button>

          <div className="w-px h-6 bg-slate-800/60 mx-1"></div>

          <button
            onClick={() => setActiveTab('options')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
              activeTab === 'options'
                ? 'bg-slate-100 text-slate-900 shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>OPTIONS</span>
          </button>

          <div className="w-px h-6 bg-slate-800/60 mx-1"></div>

          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
              activeTab === 'log'
                ? 'bg-slate-100 text-slate-900 shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>LOG</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <main className="flex-1 pb-8 pt-2">
        {activeTab === 'cards' && <DashboardPage />}
        {activeTab === 'options' && <OptionsPage />}
        {activeTab === 'log' && <LogPage />}
      </main>

      <footer className="text-center py-4 border-t border-slate-900 bg-slate-950 text-[10px] text-slate-500 font-mono">
        CODEX(R) PLATFORM V1.0.1 · STRIPE ENGINE
      </footer>
    </div>
  );
};
