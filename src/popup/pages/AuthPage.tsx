import React, { useState } from 'react';
import { useAuthStore, OWNER_CONTACT_LINK } from '../../stores/useAuthStore';
import '../../styles/theme.css';
import { ShieldCheck, Bot, Send, ExternalLink, AlertCircle, Key, Loader2, ArrowLeft, CheckCircle2, Lock, MessageSquare, UserCheck, RefreshCw } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { 
    verifyTelegramIdAndPlan,
    verifyTelegramOtp, 
    activeOtp,
    telegramUserInfo,
    error, 
    isLoading 
  } = useAuthStore();

  const [step, setStep] = useState<'telegram_id' | 'no_plan' | 'enter_code'>('telegram_id');
  const [telegramId, setTelegramId] = useState('');
  const [code, setCode] = useState('');
  const [vipLabel, setVipLabel] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleVerifyId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId.trim()) return;
    setValidationError(null);

    const result = await verifyTelegramIdAndPlan(telegramId.trim());
    setVipLabel(result.label);

    if (result.hasPlan) {
      setStep('enter_code');
    } else {
      setStep('no_plan');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setValidationError(null);

    await verifyTelegramOtp(telegramId.trim(), code.trim());
  };

  const handleBack = () => {
    setStep('telegram_id');
    setCode('');
    setValidationError(null);
  };

  return (
    <div className="glass-card fade-in flex-1 flex flex-col justify-center p-8 max-w-lg mx-auto w-full">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full"></div>

      {/* Brand Header */}
      <div className="text-center space-y-3 relative z-10 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400 shadow-[0_0_35px_rgba(99,102,241,0.25)]">
          <ShieldCheck className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-widest uppercase font-sans">
            CODEX(R) <span className="text-indigo-400">SYSTEM</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5 font-medium">
            <Bot className="w-4 h-4 text-indigo-400" />
            Autenticación por Telegram Bot (@CodexrOutBot)
          </p>
        </div>
      </div>

      {/* Direct Telegram Bot Banner */}
      <div className="bg-slate-900/90 border border-indigo-500/30 p-4 rounded-2xl mb-5 text-center space-y-2 shadow-xl relative z-10">
        <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
          Paso previo requerido:
        </span>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Abre el Bot en Telegram, presiona <code className="text-indigo-300 font-mono font-bold">START</code> para vincular tu ID y activar tu membresía.
        </p>
        <a
          href="https://t.me/CodexrOutBot"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all uppercase tracking-wider mt-1"
        >
          <Send className="w-4 h-4" /> ABRIR @CodexrOutBot <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Error alert */}
      {(error || validationError) && (
        <div className="bg-rose-950/60 border border-rose-800/60 p-3.5 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 mb-4 shadow-lg animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{validationError || error}</span>
        </div>
      )}

      {/* STEP 1: Enter Telegram ID */}
      {step === 'telegram_id' && (
        <form onSubmit={handleVerifyId} className="space-y-5 relative z-10 bg-slate-900/90 backdrop-blur-2xl border border-slate-800 p-6 rounded-2xl shadow-2xl">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 tracking-wider uppercase flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              Ingresa tu ID de Telegram
            </label>
            <input
              type="text"
              required
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="Ej. 7794982496"
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-3.5 text-sm text-slate-100 placeholder:text-slate-600 font-mono transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !telegramId.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'VERIFICAR ID & PLAN VIP'}
          </button>
        </form>
      )}

      {/* STEP 2: NO ACTIVE VIP PLAN SCREEN */}
      {step === 'no_plan' && (
        <div className="space-y-5 relative z-10 bg-slate-900/90 backdrop-blur-2xl border border-rose-900/60 p-6 rounded-2xl shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-black text-rose-400 tracking-wider flex items-center gap-1.5 uppercase">
              <Lock className="w-4 h-4 text-rose-400" /> ACCESO RESTRINGIDO — SIN PLAN VIP
            </span>
            <button type="button" onClick={handleBack} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </button>
          </div>

          {telegramUserInfo && (
            <div className="bg-slate-950 border border-rose-950 p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-300 font-black text-base shrink-0">
                {telegramUserInfo.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-100 truncate">{telegramUserInfo.name}</p>
                <p className="text-[10px] text-rose-400 font-mono">{telegramUserInfo.username} · ID: {telegramId}</p>
              </div>
            </div>
          )}

          <div className="bg-rose-950/30 border border-rose-900/40 p-4 rounded-xl space-y-2 text-center">
            <p className="text-xs font-bold text-rose-200">
              Tu cuenta no cuenta con un Plan VIP activo.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Para ingresar al panel de la extensión CODEX(R) y recibir tus códigos OTP de verificación, debes adquirir o renovar tu membresía VIP con el administrador.
            </p>
          </div>

          {/* Action buttons requested by user */}
          <div className="space-y-2.5 pt-1">
            <a
              href={OWNER_CONTACT_LINK}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-indigo-200" /> CONTACTAR ADMINISTRADOR
            </a>

            <a
              href="https://t.me/CodexrOutBot"
              target="_blank"
              rel="noreferrer"
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3 rounded-xl border border-slate-700 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-slate-400" /> VER MI PERFIL EN BOT TELEGRAM
            </a>

            <button
              type="button"
              onClick={handleBack}
              className="w-full text-slate-500 hover:text-slate-300 font-semibold text-[11px] py-2 flex items-center justify-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Intentar con otro ID de Telegram
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Enter OTP */}
      {step === 'enter_code' && (
        <form onSubmit={handleVerifyCode} className="space-y-4 relative z-10 bg-slate-900/90 backdrop-blur-2xl border border-slate-800 p-6 rounded-2xl shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2">
            <span className="text-xs font-black text-emerald-400 tracking-wider flex items-center gap-1.5 uppercase">
              <CheckCircle2 className="w-4 h-4" /> ID Verificado — Ingresar OTP
            </span>
            <button type="button" onClick={handleBack} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </button>
          </div>

          {/* Telegram user info & VIP Badge preview */}
          {telegramUserInfo && (
            <div className="bg-emerald-950/40 border border-emerald-700/40 p-3.5 rounded-xl flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-full bg-emerald-700/30 border border-emerald-600/40 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">
                {telegramUserInfo.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-black text-emerald-300 uppercase tracking-wider truncate">{telegramUserInfo.name}</p>
                <p className="text-[10px] text-emerald-500 font-mono font-bold">
                  {telegramUserInfo.username} · <span className="text-emerald-400">{vipLabel}</span>
                </p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-center space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">
              El Bot <code className="text-emerald-400 font-mono font-bold">@CodexrOutBot</code> ha enviado el código a tu chat de Telegram.
            </span>
          </div>

          {activeOtp && (
            <div className="bg-indigo-950/70 border border-indigo-500/40 p-3 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Código OTP Enviado (Dev preview):</span>
              <span className="font-mono text-2xl font-black text-indigo-400 tracking-widest">{activeOtp}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Código OTP (6 dígitos):</label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="w-full bg-slate-950 border border-emerald-500/40 focus:border-emerald-400 rounded-xl px-4 py-3.5 text-center text-xl font-mono font-black tracking-widest text-emerald-400 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length < 6}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'VERIFICAR CÓDIGO Y ENTRAR'}
          </button>
        </form>
      )}

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-600 font-mono mt-4">
        CODEX(R) PLATFORM V1.1 · @CodexrOutBot INTEGRATED
      </div>
    </div>
  );
};
