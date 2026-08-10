import React, { useEffect, useState } from 'react';
import { getActivityLogs, clearActivityLogs, LogEntry } from '../../utils/activityLogger';
import '../../styles/theme.css';

export const LogPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load initial logs
    getActivityLogs().then(setLogs);

    // Listen for live log events from content script / service worker
    const handleMessage = (message: any) => {
      if (message?.action === 'NEW_ACTIVITY_LOG' && message.payload) {
        setLogs((prev) => [message.payload, ...prev]);
      } else if (message?.action === 'CLEAR_ACTIVITY_LOGS') {
        setLogs([]);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }
    };
  }, []);

  const handleCopyAll = () => {
    if (logs.length === 0) return;
    const text = logs
      .map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.type}] ${l.message} ${l.details ? `— ${l.details}` : ''}`)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = async () => {
    await clearActivityLogs();
    setLogs([]);
  };

  const getBadgeStyle = (type: LogEntry['type']) => {
    switch (type) {
      case 'SUCCESS':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40';
      case 'DECLINED':
        return 'text-rose-400 bg-rose-950/40 border-rose-500/40';
      case 'REQUIRES_ACTION':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/40';
      case 'GATEWAY':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-500/40';
      case 'TRYING':
        return 'text-indigo-400 bg-indigo-950/40 border-indigo-500/40';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  return (
    <div className="glass-card fade-in p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-bold text-white uppercase tracking-widest border-l-2 border-indigo-500 pl-2">
          &gt;_ REAL-TIME ACTIVITY LOG
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyAll}
            className="px-3 py-1 bg-[#0a0d14] border border-slate-800/80 rounded text-[9px] font-bold text-slate-300 uppercase tracking-widest hover:text-white hover:border-slate-700 transition-colors"
          >
            {copied ? '✓ COPIED!' : 'COPY ALL'}
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1 bg-[#0a0d14] border border-rose-900/40 rounded text-[9px] font-bold text-rose-400 uppercase tracking-widest hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
          >
            CLEAR
          </button>
        </div>
      </div>

      <div className="bg-[#05070a] border border-slate-900/80 rounded-xl p-3 h-[420px] overflow-y-auto space-y-2 font-mono text-[10px] shadow-inner select-text">
        {logs.length === 0 ? (
          <div className="text-slate-600 text-center py-16 tracking-widest flex flex-col items-center gap-2">
            <span className="text-xl">⚡</span>
            <span>Awaiting execution...</span>
            <span className="text-[9px] text-slate-700 font-normal">Navega a un checkout y presiona START en el panel para ver logs en vivo.</span>
          </div>
        ) : (
          logs.map((item) => (
            <div
              key={item.id}
              className={`p-2 rounded-lg border text-[10.5px] leading-relaxed transition-all ${getBadgeStyle(item.type)}`}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] opacity-60">[{new Date(item.timestamp).toLocaleTimeString()}]</span>
                  <span className="font-extrabold tracking-wider uppercase text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                    {item.type}
                  </span>
                </div>
                {item.maskedCard && (
                  <span className="text-[9px] font-mono text-slate-400 bg-black/50 px-2 py-0.5 rounded border border-white/5">
                    {item.maskedCard}
                  </span>
                )}
              </div>

              <div className="font-semibold text-slate-200">{item.message}</div>

              {item.details && (
                <div className="text-[9.5px] opacity-80 mt-0.5 font-normal">
                  ↳ {item.details}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
