import React, { useState, useEffect } from 'react';
import '../../styles/theme.css';
import { Sliders, Sparkles, Save, Cpu, ShieldCheck, Zap, CheckCircle2, Globe, MapPin, Mail, User, Phone as PhoneIcon, Clock } from 'lucide-react';
import { storageSet, storageGetMultiple } from '../../utils/storageAdapter';
import { STORAGE_KEYS } from '../../utils/constants';
import type { IdentitySettings } from '../../types/checkout';
import { DEFAULT_IDENTITY } from '../../types/checkout';
import { generateRandomIdentity, COUNTRIES_WITH_FLAGS } from '../../utils/identityGenerator';

export const OptionsPage: React.FC = () => {
  // Automation & AI states
  const [autofillEnabled, setAutofillEnabled] = useState(true);
  const [audioNotifications, setAudioNotifications] = useState(true);
  const [suppressSaveCardPrompt, setSuppressSaveCardPrompt] = useState(true);
  const [aiHeuristicMode, setAiHeuristicMode] = useState(true);
  const [aiIframeTraversal, setAiIframeTraversal] = useState(true);
  const [aiCustomFormSolver, setAiCustomFormSolver] = useState(true);
  const [aiScanStatus, setAiScanStatus] = useState<string | null>(null);

  // Randomization states
  const [randomNames, setRandomNames] = useState(false);
  const [randomAddresses, setRandomAddresses] = useState(false);

  // Identity states
  const [email, setEmail] = useState(DEFAULT_IDENTITY.email);
  const [billingName, setBillingName] = useState(DEFAULT_IDENTITY.billingName);
  const [phone, setPhone] = useState(DEFAULT_IDENTITY.phone || '');
  const [address1, setAddress1] = useState(DEFAULT_IDENTITY.address1);
  const [address2, setAddress2] = useState(DEFAULT_IDENTITY.address2 || '');
  const [city, setCity] = useState(DEFAULT_IDENTITY.city);
  const [state, setState] = useState(DEFAULT_IDENTITY.state || '');
  const [country, setCountry] = useState(DEFAULT_IDENTITY.country);
  const [zipCode, setZipCode] = useState(DEFAULT_IDENTITY.zipCode || '');
  const [delay, setDelay] = useState(DEFAULT_IDENTITY.delay);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    storageGetMultiple<Record<string, unknown>>([
      STORAGE_KEYS.AUTOFILL_ENABLED,
      STORAGE_KEYS.AUDIO_NOTIFICATIONS,
      STORAGE_KEYS.SUPPRESS_SAVE_CARD_PROMPT,
      STORAGE_KEYS.AI_HEURISTIC_MODE,
      STORAGE_KEYS.AI_IFRAME_TRAVERSAL,
      STORAGE_KEYS.AI_CUSTOM_FORM_SOLVER,
      STORAGE_KEYS.RANDOM_NAMES,
      STORAGE_KEYS.RANDOM_ADDRESSES,
      STORAGE_KEYS.IDENTITY,
    ]).then((res) => {
      if (res[STORAGE_KEYS.AUTOFILL_ENABLED] !== undefined) setAutofillEnabled(!!res[STORAGE_KEYS.AUTOFILL_ENABLED]);
      if (res[STORAGE_KEYS.AUDIO_NOTIFICATIONS] !== undefined) setAudioNotifications(!!res[STORAGE_KEYS.AUDIO_NOTIFICATIONS]);
      if (res[STORAGE_KEYS.SUPPRESS_SAVE_CARD_PROMPT] !== undefined) setSuppressSaveCardPrompt(!!res[STORAGE_KEYS.SUPPRESS_SAVE_CARD_PROMPT]);
      if (res[STORAGE_KEYS.AI_HEURISTIC_MODE] !== undefined) setAiHeuristicMode(!!res[STORAGE_KEYS.AI_HEURISTIC_MODE]);
      if (res[STORAGE_KEYS.AI_IFRAME_TRAVERSAL] !== undefined) setAiIframeTraversal(!!res[STORAGE_KEYS.AI_IFRAME_TRAVERSAL]);
      if (res[STORAGE_KEYS.AI_CUSTOM_FORM_SOLVER] !== undefined) setAiCustomFormSolver(!!res[STORAGE_KEYS.AI_CUSTOM_FORM_SOLVER]);
      if (res[STORAGE_KEYS.RANDOM_NAMES] !== undefined) setRandomNames(!!res[STORAGE_KEYS.RANDOM_NAMES]);
      if (res[STORAGE_KEYS.RANDOM_ADDRESSES] !== undefined) setRandomAddresses(!!res[STORAGE_KEYS.RANDOM_ADDRESSES]);

      const idObj = res[STORAGE_KEYS.IDENTITY] as IdentitySettings | undefined;
      if (idObj) {
        setEmail(idObj.email || '');
        setBillingName(idObj.billingName || '');
        setPhone(idObj.phone || '');
        setAddress1(idObj.address1 || '');
        setAddress2(idObj.address2 || '');
        setCity(idObj.city || '');
        setState(idObj.state || '');
        setCountry(idObj.country || 'United States');
        setZipCode(idObj.zipCode || '');
        setDelay(idObj.delay ?? DEFAULT_IDENTITY.delay);
      }
    });
  }, []);

  const handleGenerateRandomIdentity = (targetCountry?: string) => {
    const selectedCountry = targetCountry || country || 'United States';
    const randomId = generateRandomIdentity(selectedCountry);
    setEmail(randomId.email);
    setBillingName(randomId.billingName);
    setPhone(randomId.phone || '');
    setAddress1(randomId.address1);
    setAddress2(randomId.address2 || '');
    setCity(randomId.city);
    setState(randomId.state || '');
    setCountry(randomId.country);
    setZipCode(randomId.zipCode || '');
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save identity preferences directly without forced text injection into empty inputs
    const identityToSave: IdentitySettings = {
      email,
      billingName,
      phone,
      address1,
      address2,
      city,
      state,
      country: country || 'United States',
      zipCode,
      delay,
    };

    await storageSet(STORAGE_KEYS.IDENTITY, identityToSave);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, key: string, val: boolean) => {
    setter(val);
    storageSet(key, val);
  };

  const handleTriggerAiFormScan = () => {
    setAiScanStatus('Escaneando pestaña activa con IA Neuronal...');
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'CODEX_AI_SCAN_FORM' }, (res) => {
            if (chrome.runtime.lastError) {
              setAiScanStatus('Abre la página del checkout en Chrome y presiona escanear.');
            } else if (res && res.success) {
              setAiScanStatus(`¡IA detectó ${res.fieldsCount || 0} campos de pago con éxito!`);
            } else {
              setAiScanStatus('Detección IA ejecutada en la página activa.');
            }
          });
        }
      });
    } else {
      setTimeout(() => {
        setAiScanStatus('Motor IA Heurístico activo y listo.');
      }, 1000);
    }
  };

  return (
    <div className="glass-card fade-in flex-1 p-6 space-y-6 w-full max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white tracking-wider flex items-center gap-2 uppercase">
            <Sliders className="w-5 h-5 text-indigo-400" />
            PANEL DE CONFIGURACIÓN & MOTOR IA DE DETECCIÓN
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Gestión inteligente de resolución de formularios de pago, retardos e identidades de prueba (País, Zip, Dirección)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Advanced Engine Controls */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black text-indigo-400 tracking-wider flex items-center gap-2 uppercase">
              <Cpu className="w-4 h-4 text-indigo-400" /> OPTIMIZADOR DE CHECKOUT & ANTI-RADAR
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ULTRA SPEED ACTIVE
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Estado de Inyección & Detección:
                </span>
                <span className="text-[10px] font-bold text-emerald-400 font-mono">100% AUTOMÁTICO E INTEGRADO</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                El motor IA heurístico, el recorrido de iFrames (Stripe, Braintree, Adyen, Xsolla, FastSpring) y la resolución de formularios están totalmente integrados por defecto en segundo plano.
              </p>
            </div>

            <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div>
                <span className="font-extrabold text-slate-200 block">Auto-Click en Captchas ("Soy humano")</span>
                <span className="text-[10px] text-slate-500 font-medium">Auto-seleccionar casilla hCaptcha, reCAPTCHA y Turnstile automáticamente</span>
              </div>
              <input
                type="checkbox"
                checked={aiHeuristicMode}
                onChange={(e) => handleToggle(setAiHeuristicMode, STORAGE_KEYS.CAPTCHA_AUTOCLICK_ENABLED, e.target.checked)}
                className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div>
                <span className="font-extrabold text-slate-200 block">Ofuscación Telemetría Anti-Radar v2</span>
                <span className="text-[10px] text-slate-500 font-medium">Spoof de hardware (CPUs, Memoria, AudioContext y Pantalla) para Stripe Radar</span>
              </div>
              <input
                type="checkbox"
                checked={aiIframeTraversal}
                onChange={(e) => handleToggle(setAiIframeTraversal, STORAGE_KEYS.AI_IFRAME_TRAVERSAL, e.target.checked)}
                className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div>
                <span className="font-extrabold text-slate-200 block">Auto-Envío del Formulario (Instant Submit)</span>
                <span className="text-[10px] text-slate-500 font-medium">Hacer clic en Pagar / Subscribe inmediatamente después de inyectar datos</span>
              </div>
              <input
                type="checkbox"
                checked={aiCustomFormSolver}
                onChange={(e) => handleToggle(setAiCustomFormSolver, STORAGE_KEYS.AI_CUSTOM_FORM_SOLVER, e.target.checked)}
                className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            {/* Gateway Compatibility Matrix */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Pasarelas Soportadas en Tiempo Real:
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">● Stripe</span>
                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40">● Adyen</span>
                <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/40">● Braintree</span>
                <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">● Xsolla</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">● FastSpring</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">● WooCommerce</span>
              </div>
            </div>

            {aiScanStatus && (
              <div className="p-3 bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-[11px] rounded-xl font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {aiScanStatus}
              </div>
            )}

            <button
              type="button"
              onClick={handleTriggerAiFormScan}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300 animate-bounce" /> ESCANEAR Y TESTEAR PAGO EN PESTAÑA ACTIVA
            </button>
          </div>
        </div>

        {/* Section 2: Automation & Identity Settings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black text-indigo-400 tracking-wider flex items-center gap-2 uppercase">
              <Sparkles className="w-4 h-4" /> MOTOR DE INYECCIÓN & DATOS DE IDENTIDAD
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div>
                <span className="font-extrabold text-slate-200 block">Relleno Automático (Autofill)</span>
                <span className="text-[10px] text-slate-500 font-medium">Detectar e inyectar tarjetas al abrir checkouts</span>
              </div>
              <input
                type="checkbox"
                checked={autofillEnabled}
                onChange={(e) => handleToggle(setAutofillEnabled, STORAGE_KEYS.AUTOFILL_ENABLED, e.target.checked)}
                className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div>
                <span className="font-extrabold text-slate-200 block">Notificaciones Sonoras</span>
                <span className="text-[10px] text-slate-500 font-medium">Emitir alerta de audio al detectar cobro exitoso</span>
              </div>
              <input
                type="checkbox"
                checked={audioNotifications}
                onChange={(e) => handleToggle(setAudioNotifications, STORAGE_KEYS.AUDIO_NOTIFICATIONS, e.target.checked)}
                className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div>
                <span className="font-extrabold text-slate-200 block">Bloquear aviso "¿Quieres guardar la tarjeta?"</span>
                <span className="text-[10px] text-slate-500 font-medium">Bloquear la ventana emergente nativa de autofill de Brave / Chrome</span>
              </div>
              <input
                type="checkbox"
                checked={suppressSaveCardPrompt}
                onChange={(e) => handleToggle(setSuppressSaveCardPrompt, STORAGE_KEYS.SUPPRESS_SAVE_CARD_PROMPT, e.target.checked)}
                className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div>
                <span className="font-extrabold text-slate-200 block">Generar Nombres Aleatorios</span>
                <span className="text-[10px] text-slate-500 font-medium">Variar titular de tarjeta en cada intento</span>
              </div>
              <input
                type="checkbox"
                checked={randomNames}
                onChange={(e) => handleToggle(setRandomNames, STORAGE_KEYS.RANDOM_NAMES, e.target.checked)}
                className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div>
                <span className="font-extrabold text-slate-200 block">Direcciones Billing Aleatorias</span>
                <span className="text-[10px] text-slate-500 font-medium">Variar dirección, ciudad y zip code</span>
              </div>
              <input
                type="checkbox"
                checked={randomAddresses}
                onChange={(e) => handleToggle(setRandomAddresses, STORAGE_KEYS.RANDOM_ADDRESSES, e.target.checked)}
                className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
              />
            </label>
          </div>

          <form onSubmit={handleSaveIdentity} className="space-y-3 pt-2 text-xs border-t border-slate-800/80">
            <div className="flex justify-between items-center">
              <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
                Identidad de Facturación Predeterminada
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateRandomIdentity()}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-[10px] font-extrabold text-indigo-300 flex items-center gap-1 transition-all"
                  title="Genera datos reales aleatorios para el país seleccionado"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Random ({country || 'US'})
                </button>
                {saveSuccess && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Guardado
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-indigo-400" /> Nombre Completo:
                </label>
                <input
                  type="text"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mb-1">
                  <Mail className="w-3 h-3 text-indigo-400" /> EMAIL:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mb-1">
                  <PhoneIcon className="w-3 h-3 text-indigo-400" /> TELÉFONO:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="3055550192"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 font-mono placeholder-slate-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mb-1">
                  <Globe className="w-3 h-3 text-indigo-400" /> COUNTRY (PAÍS):
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                >
                  {COUNTRIES_WITH_FLAGS.map((c) => (
                    <option key={c.code} value={c.name} className="bg-slate-900 text-slate-100">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3 text-indigo-400" /> ADDRESS LINE 1:
                </label>
                <input
                  type="text"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mb-1">
                  ADDRESS LINE 2 (OPCIONAL):
                </label>
                <input
                  type="text"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  placeholder="Apt 1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">CITY:</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">ESTADO / PROV.:</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="NY"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">ZIP / POSTAL CODE:</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="10001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-indigo-400" /> Retardo de Inyección entre Tarjetas (segundos):
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value, 10) || 2)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition-all uppercase tracking-wider flex items-center justify-center gap-2">
              <Save className="w-4 h-4 text-white" /> GUARDAR IDENTIDAD Y PARÁMETROS DE FACTURACIÓN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
