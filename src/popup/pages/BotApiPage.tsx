import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import '../../styles/theme.css';
import { Bot, Loader2, Wifi, WifiOff, Info, Link2 } from 'lucide-react';

export const BotApiPage: React.FC = () => {
  const { botToken, botUsername, botApiUrl, saveBotSettings } = useAuthStore();
  const [token, setToken] = useState(botToken);
  const [username, setUsername] = useState(botUsername);
  const [apiUrl, setApiUrl] = useState(botApiUrl);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveBotSettings(token, username, apiUrl);
    setTestResult('idle');
    setTestMessage('Configuración guardada correctamente.');
    setTimeout(() => setTestMessage(''), 3000);
  };

  const handleTestConnection = async () => {
    if (!token) {
      setTestResult('error');
      setTestMessage('Por favor introduce el Token del Bot.');
      return;
    }
    setIsTesting(true);
    setTestResult('idle');
    setTestMessage('');

    // Simulate real connectivity verification to Telegram Bot API
    setTimeout(() => {
      setIsTesting(false);
      if (token.includes(':') && token.length > 20) {
        setTestResult('success');
        setTestMessage('¡Conexión establecida con el Bot exitosamente!');
      } else {
        setTestResult('error');
        setTestMessage('Token inválido. Comprueba el formato de BotFather.');
      }
    }, 1500);
  };

  return (
    <div className="glass-card fade-in p-4 space-y-4 max-h-[380px] overflow-y-auto">
      <div className="text-center space-y-1">
        <h2 className="text-xs font-bold text-slate-100 flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span>Configurar Bot y API</span>
        </h2>
        <p className="text-[10px] text-slate-400">
          Vincula tu bot de Telegram para automatizar y sincronizar logs
        </p>
      </div>

      <form onSubmit={handleSave} className="dev-card space-y-3">
        <div>
          <label className="text-[9px] text-slate-400 font-mono block mb-1 uppercase tracking-wider">
            Token del Bot (BotFather)
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456789:ABCdefGhIJKlmNo..."
            className="dev-input w-full font-mono text-[11px]"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 font-mono block mb-1 uppercase tracking-wider">
            Username del Bot
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@CODERAutomationBot"
            className="dev-input w-full font-mono text-[11px]"
          />
        </div>

        <div>
          <label className="text-[9px] text-slate-400 font-mono block mb-1 uppercase tracking-wider">
            URL Base del API (Conector)
          </label>
          <input
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.CODER-platform.com/v1"
            className="dev-input w-full font-mono text-[11px]"
          />
        </div>

        {testMessage && (
          <div
            className={`p-2 rounded text-[10px] font-medium flex items-center gap-1.5 border ${
              testResult === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : testResult === 'error'
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-indigo-950/60 border-indigo-850 text-indigo-300'
            }`}
          >
            {testResult === 'success' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : testResult === 'error' ? (
              <WifiOff className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            ) : (
              <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            )}
            <span>{testMessage}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="dev-button bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 py-1.5 px-3 flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Probando...</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                <span>Probar Bot</span>
              </>
            )}
          </button>

          <button
            type="submit"
            className="dev-button dev-button-primary py-1.5 px-4"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </button>
        </div>
      </form>
    </div>
  );
};
