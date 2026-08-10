import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import '../../styles/theme.css';
import { Globe, ShieldCheck, CheckCircle2, ExternalLink } from 'lucide-react';

export const WebOficialPage: React.FC = () => {
  const { officialWebUrl, saveOfficialWebUrl } = useAuthStore();
  const [url, setUrl] = useState(officialWebUrl);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    // Auto-prepend http/https if missing
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    await saveOfficialWebUrl(formattedUrl);
    setUrl(formattedUrl);
    setFeedbackMessage('URL oficial actualizada.');
    setTimeout(() => setFeedbackMessage(''), 3000);
  };

  const handleOpenWeb = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="glass-card fade-in p-4 space-y-4 max-h-[380px] overflow-y-auto">
      <div className="text-center space-y-1">
        <h2 className="text-xs font-bold text-slate-100 flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span>Web Oficial</span>
        </h2>
        <p className="text-[10px] text-slate-400">
          Enlace de referencia de la plataforma de la extensión
        </p>
      </div>

      <div className="dev-card space-y-4">
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="text-[9px] text-slate-400 font-mono block mb-1 uppercase tracking-wider">
              Enlace de la Web Oficial
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://CODER-platform.com"
              className="dev-input w-full font-mono text-[11px]"
              required
            />
          </div>

          {feedbackMessage && (
            <div className="bg-emerald-950/60 border border-emerald-800 p-2 rounded text-[10px] text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="dev-button dev-button-primary w-full py-2 text-xs"
          >
            <span>Actualizar Dirección</span>
          </button>
        </form>

        <div className="border-t border-slate-800 pt-3 space-y-2">
          <div className="bg-[#090d16] border border-slate-800/80 rounded p-2.5 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="text-[10px] text-slate-400">
              <span className="font-semibold text-slate-200 block">Dominio Protegido</span>
              El dominio configurado es considerado seguro y se habilita para interactuar con la extensión.
            </div>
          </div>

          <button
            onClick={handleOpenWeb}
            disabled={!url}
            className="dev-button bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 w-full py-2 text-xs flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>Visitar Web Oficial</span>
          </button>
        </div>
      </div>
    </div>
  );
};
