import React from 'react';
import { ShieldCheck, Cpu, Crown } from 'lucide-react';
import { useAuthStore, isOwnerId } from '../../stores/useAuthStore';

export const Header: React.FC = () => {
  const { user, signOut } = useAuthStore();

  const isOwner = user?.role === 'owner' || (user?.telegramId ? isOwnerId(user.telegramId) : false);
  const vipText = isOwner ? 'OWNER' : (user?.vipDaysLeft ? `${user.vipDaysLeft}d VIP` : 'VIP');

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[#090d16] border-b border-slate-900/50 w-full select-none">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="font-black text-xl tracking-[0.2em] text-white uppercase font-sans leading-none flex items-center gap-4">
            CODEX(R)
            <div className="flex gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            </div>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest font-semibold mt-1">
            CODEX(R) · VIP SYSTEM
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="flex items-center gap-2 bg-[#1a1e29] border border-emerald-500/30 rounded-full px-3.5 py-1.5 text-[10px] font-bold tracking-wider text-slate-200 uppercase shadow-inner max-w-[220px]">
              {isOwner ? (
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="truncate">{user.name}</span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] px-1.5 py-0.5 rounded font-mono font-extrabold shrink-0">
                {vipText}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="px-3.5 py-1.5 rounded-lg border border-slate-800/80 text-[10px] font-bold tracking-widest uppercase text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            >
              LOGOUT
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 bg-[#1a1e29] px-3.5 py-1.5 rounded-full border border-slate-800/60 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>Invitado</span>
          </div>
        )}
      </div>
    </header>
  );
};
