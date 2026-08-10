import React from 'react';
import { useSessionStore } from '../../stores/useSessionStore';

export const MetricsGrid: React.FC = () => {
  const { stats } = useSessionStore();

  const successRate =
    stats.totalRuns > 0 ? Math.round((stats.successCount / stats.totalRuns) * 100) : 0;

  return (
    <div className="bg-[#0b0d14] border border-slate-900/60 rounded-xl flex items-center justify-between p-4 shadow-lg shadow-black/50">
      <div className="flex-1 text-center border-r border-slate-800/60">
        <div className="text-2xl font-black text-white font-mono tracking-widest">{stats.totalRuns}</div>
        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">TRIES</div>
      </div>

      <div className="flex-1 text-center border-r border-slate-800/60">
        <div className="text-2xl font-black text-emerald-500 font-mono tracking-widest">{stats.successCount}</div>
        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">HITS</div>
      </div>

      <div className="flex-1 text-center border-r border-slate-800/60">
        <div className="text-2xl font-black text-rose-500 font-mono tracking-widest">{stats.declinedCount}</div>
        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">DECLINES</div>
      </div>

      <div className="flex-1 text-center">
        <div className="text-2xl font-black text-white font-mono tracking-widest">{successRate}%</div>
        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">RATE</div>
      </div>
    </div>
  );
};
