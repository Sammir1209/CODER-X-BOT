import React, { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import '../../styles/theme.css';
import { ShieldCheck, Globe, Trash2, Plus } from 'lucide-react';

export const DomainsPage: React.FC = () => {
  const { allowedDomains, addDomain, removeDomain } = useSessionStore();
  const [newDomain, setNewDomain] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain.trim()) {
      addDomain(newDomain.trim());
      setNewDomain('');
    }
  };

  return (
    <div className="glass-card fade-in p-4 space-y-4">
      <div className="dev-card space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>AUTHORIZED QA DOMAINS ALLOWLIST</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Execution is strictly blocked on domains not present in this allowlist. Standard wildcards (<code className="text-indigo-300">*.staging.com</code>) are supported.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="e.g. *.staging.example.com"
          className="dev-input flex-1"
        />
        <button type="submit" className="dev-button dev-button-primary py-1.5 px-3">
          <Plus className="w-3.5 h-3.5" />
          <span>ADD</span>
        </button>
      </form>

      <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
        {allowedDomains.map((dom) => (
          <div
            key={dom}
            className="flex items-center justify-between p-2 rounded bg-[#0f172a] border border-slate-800 text-xs font-mono"
          >
            <div className="flex items-center gap-2 text-slate-200">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{dom}</span>
            </div>
            {dom !== 'localhost' && dom !== '127.0.0.1' && (
              <button
                onClick={() => removeDomain(dom)}
                className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
