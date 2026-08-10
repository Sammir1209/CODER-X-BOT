import React, { useState, useEffect, useRef } from 'react';
import '../../styles/theme.css';
import {
  Compass,
  ShieldCheck,
  Zap,
  Globe,
  Play,
  Pause,
  Square,
  SkipForward,
  Terminal,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  Lock,
  Unlock,
} from 'lucide-react';
import { storageGetMultiple } from '../../utils/storageAdapter';
import { STORAGE_KEYS } from '../../utils/constants';
import type { TestCase } from '../../types/testCase';
import type { IdentitySettings, PaymentResultStatus } from '../../types/checkout';
import { DEFAULT_IDENTITY } from '../../types/checkout';
import { ensureCompleteIdentity } from '../../utils/identityGenerator';



export const AiBrowserPage: React.FC = () => {
  const [urlInput, setUrlInput] = useState('https://chatgpt.com');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [addressBarUrl, setAddressBarUrl] = useState('https://chatgpt.com');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Bucle Automation States
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMaskedCard, setCurrentMaskedCard] = useState('—');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Bucle Stats
  const [hits, setHits] = useState(0);
  const [declined, setDeclined] = useState(0);
  const [threeds, setThreeds] = useState(0);

  // References
  const webviewRef = useRef<any>(null);
  const isRunningRef = useRef(isRunning);
  const isPausedRef = useRef(isPaused);
  const currentIndexRef = useRef(currentIndex);
  const cardsRef = useRef<TestCase[]>([]);
  const identityRef = useRef<IdentitySettings>(DEFAULT_IDENTITY);
  const resolveOutcomeRef = useRef<((res: { result: PaymentResultStatus; durationMs: number }) => void) | null>(null);

  // Update refs to avoid closure stale state in event handlers
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  // ─── Initializer & Local Storage Load ─────────────────────────────────────────

  useEffect(() => {
    storageGetMultiple<Record<string, unknown>>([
      STORAGE_KEYS.TEST_CASES,
      STORAGE_KEYS.IDENTITY,
    ]).then((res) => {
      cardsRef.current = (res[STORAGE_KEYS.TEST_CASES] as TestCase[]) || [];
      const loadedId = (res[STORAGE_KEYS.IDENTITY] as IdentitySettings) || DEFAULT_IDENTITY;
      identityRef.current = ensureCompleteIdentity(loadedId);
      addLog(`[SISTEMA] Cargadas ${cardsRef.current.length} tarjetas de prueba.`);
    });
  }, []);

  // ─── Logs & Visual Terminal ──────────────────────────────────────────────────

  const addLog = (text: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev.slice(0, 49)]);
  };

  const handleOptimizeNetwork = () => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    addLog('[OPTIMIZER] Iniciando optimización de red, rotación de MAC y limpieza DNS (UAC)...');

    // Electron-specific network optimization removed; fallback logic retained if needed.
  };

  // ─── IPC Webview Communication ───────────────────────────────────────────────

  const handleWebviewIpcMessage = (event: any) => {
    const { channel, args } = event;
    const data = args ? args[0] : null;

    if (channel === 'CHECKOUT_FIELDS_DETECTED') {
      const fieldCount = data.fields ? data.fields.length : 0;
      console.log(`[CODER] Detected ${fieldCount} fields inside Guest Webview.`);
    } else if (channel === 'PAYMENT_OUTCOME_DETECTED') {
      addLog(`[DETECTOR] Resultado recibido: ${data.result} en ${data.durationMs}ms`);
      if (resolveOutcomeRef.current) {
        resolveOutcomeRef.current(data);
        resolveOutcomeRef.current = null;
      }
    }
  };

  // Attach webview listeners once mounted/navigated
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleNavigate = (e: any) => {
      setAddressBarUrl(e.url);
      setCurrentUrl(e.url);
      try {
        setCanGoBack(webview.canGoBack());
        setCanGoForward(webview.canGoForward());
      } catch (err) {
        // Can fail if webview context is loading
      }
    };

    const handleLoading = () => {
      try {
        setCanGoBack(webview.canGoBack());
        setCanGoForward(webview.canGoForward());
      } catch (err) {
        // Can fail if webview context is loading
      }
    };

    webview.addEventListener('ipc-message', handleWebviewIpcMessage);
    webview.addEventListener('did-navigate', handleNavigate);
    webview.addEventListener('did-navigate-in-page', handleNavigate);
    webview.addEventListener('did-start-navigation', handleNavigate);
    webview.addEventListener('dom-ready', handleLoading);
    webview.addEventListener('did-stop-loading', handleLoading);

    return () => {
      webview.removeEventListener('ipc-message', handleWebviewIpcMessage);
      webview.removeEventListener('did-navigate', handleNavigate);
      webview.removeEventListener('did-navigate-in-page', handleNavigate);
      webview.removeEventListener('did-start-navigation', handleNavigate);
      webview.removeEventListener('dom-ready', handleLoading);
      webview.removeEventListener('did-stop-loading', handleLoading);
    };
  }, [currentUrl]);

  // ─── Browser Controls & Address Bar ──────────────────────────────────────────

  const goBack = () => {
    if (webviewRef.current && webviewRef.current.canGoBack()) {
      webviewRef.current.goBack();
    }
  };

  const goForward = () => {
    if (webviewRef.current && webviewRef.current.canGoForward()) {
      webviewRef.current.goForward();
    }
  };

  const reloadWebview = () => {
    if (webviewRef.current) {
      webviewRef.current.reload();
    }
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigateAddressBar();
    }
  };

  const navigateAddressBar = () => {
    let target = addressBarUrl.trim();
    if (!target) return;

    // Check if it's a search term or a URL
    const isUrl = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(target);
    if (!isUrl && !target.startsWith('http://') && !target.startsWith('https://') && !target.startsWith('localhost:')) {
      target = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
    } else if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }

    setCurrentUrl(target);
    setAddressBarUrl(target);
    addLog(`[NAVEGADOR] Cargando: ${target}`);
  };

  const handleLaunchBrowser = (e: React.FormEvent) => {
    e.preventDefault();
    let target = urlInput.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    setCurrentUrl(target);
    setAddressBarUrl(target);
    addLog(`Navegador Seguro cargado en: ${target}`);
  };

  // ─── Auto Fill & Submit Command senders ──────────────────────────────────────

  const triggerAutofillInWebview = (cardFixture: any) => {
    if (webviewRef.current) {
      webviewRef.current.send('FILL_FORM_FIELDS', {
        card: {
          number: cardFixture.number,
          expiryMonth: cardFixture.expiryMonth,
          expiryYear: cardFixture.expiryYear,
          cvc: cardFixture.cvc,
        },
        identity: identityRef.current,
      });
    }
  };

  const triggerSubmitInWebview = () => {
    if (webviewRef.current) {
      webviewRef.current.send('SUBMIT_FORM_FIELDS');
      webviewRef.current.send('START_OBSERVING_OUTCOME');
    }
  };

  // ─── Core Auto loop Automation ───────────────────────────────────────────────

  const startAutomation = async () => {
    if (isRunning) return;
    if (cardsRef.current.length === 0) {
      addLog('[ERROR] No hay tarjetas para procesar. Importa tarjetas en "Test Cases" primero.');
      return;
    }
    if (!currentUrl || currentUrl.includes('google.com/search') || currentUrl === 'https://www.google.com') {
      addLog('[ADVERTENCIA] Navega a la página del checkout (formulario de pago) antes de iniciar las pruebas.');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    addLog('🚀 Bucle de prueba de escritorio iniciado.');

    // Run loop in background
    runBucleLoop();
  };

  const runBucleLoop = async () => {
    while (isRunningRef.current && currentIndexRef.current < cardsRef.current.length) {
      // Pause check
      while (isPausedRef.current && isRunningRef.current) {
        await sleep(500);
      }
      if (!isRunningRef.current) break;

      const currentCard = cardsRef.current[currentIndexRef.current];
      const masked = maskCard(currentCard.fixture.number);
      setCurrentMaskedCard(masked);

      addLog(`[PRUEBA] Tarjeta ${currentIndexRef.current + 1}/${cardsRef.current.length}: ${masked}`);

      // Step 1: Reload page for clean checkout state (bypass anti-fraud session tracking)
      addLog('[SISTEMA] Recargando checkout para limpiar sesión...');
      if (webviewRef.current) {
        webviewRef.current.src = currentUrl;
      }

      // Wait for did-stop-loading
      await new Promise<void>((resolve) => {
        const onLoaded = () => {
          if (webviewRef.current) {
            webviewRef.current.removeEventListener('did-stop-loading', onLoaded);
          }
          resolve();
        };
        if (webviewRef.current) {
          webviewRef.current.addEventListener('did-stop-loading', onLoaded);
        }
      });

      addLog('[SISTEMA] Página cargada con éxito. Esperando estabilización DOM...');
      // Wait configurable delay
      await sleep((identityRef.current.delay || 2) * 1000);

      // Step 2: Auto Fill (Stage 1)
      addLog('[AUTOFILL] Inyectando detalles de la tarjeta...');
      triggerAutofillInWebview(currentCard.fixture);

      // Wait for billing options to animate/expand if any
      await sleep(1500);

      // Auto Fill (Stage 2 - catch address/city dropdowns)
      triggerAutofillInWebview(currentCard.fixture);

      // Step 3: Click pay & observe
      addLog('[AUTOMATION] Simulando envío del pago...');
      triggerSubmitInWebview();

      // Step 4: Wait for outcome result message from webview preload script
      const outcome = await waitForOutcome();

      // Step 5: Process outcome result
      addLog(`[RESULTADO] Tarjeta ${currentIndexRef.current + 1}: ${outcome.result} (${outcome.durationMs}ms)`);

      if (outcome.result === 'SUCCESS') {
        setHits(h => h + 1);
        addLog(`🎉 ¡HIT detectado con éxito en tarjeta ${masked}! Bucle detenido.`);
        setIsRunning(false);
        break;
      } else if (outcome.result === 'REQUIRES_ACTION') {
        setThreeds(t => t + 1);
        addLog(`⚠️ Desafío 3DS requerido en tarjeta ${masked}. Bucle pausado.`);
        setIsPaused(true);
        break;
      } else {
        // Declined / timeout
        setDeclined(d => d + 1);
        addLog(`❌ Pago declinado para tarjeta ${masked}. Pasando al siguiente...`);
        setCurrentIndex(i => i + 1);
      }

      // Buffer sleep between cards
      await sleep(2000);
    }

    if (currentIndexRef.current >= cardsRef.current.length) {
      addLog('🏁 Todas las tarjetas han sido testeadas.');
      setIsRunning(false);
    }
  };

  const waitForOutcome = (): Promise<{ result: PaymentResultStatus; durationMs: number }> => {
    return new Promise((resolve) => {
      resolveOutcomeRef.current = resolve;
      // Safety timeout fallback
      setTimeout(() => {
        if (resolveOutcomeRef.current === resolve) {
          resolveOutcomeRef.current = null;
          resolve({ result: 'TIMEOUT', durationMs: 25000 });
        }
      }, 26000);
    });
  };

  // ─── Control actions ─────────────────────────────────────────────────────────

  const stopAutomation = () => {
    setIsRunning(false);
    setIsPaused(false);
    addLog('⏹ Bucle de prueba detenido.');
  };

  const pauseAutomation = () => {
    setIsPaused(p => !p);
    addLog(isPaused ? '▶ Bucle reanudado.' : '⏸ Bucle pausado.');
  };

  const skipCard = () => {
    setCurrentIndex(i => i + 1);
    addLog('⏭ Saltando tarjeta actual.');
  };

  // ─── Visual Utilities ────────────────────────────────────────────────────────

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const maskCard = (num: string) => {
    const clean = num.replace(/\D/g, '');
    return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
  };

  return (
    <div className="space-y-6 w-full font-sans text-slate-100 glass-card fade-in">
      {/* Header Title */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-white tracking-wider flex items-center gap-2 uppercase">
            <Compass className="w-5 h-5 text-indigo-400" />
            Navegador IA Automatizado Integrado (Escritorio)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Entorno seguro de ejecución aislada con inyección Shadow DOM y observador de outcomes directo
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Automation Controller */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl h-fit">
          <h3 className="text-xs font-black text-indigo-400 tracking-wider flex items-center gap-2 uppercase border-b border-slate-800 pb-2.5">
            <Globe className="w-4 h-4" /> Bucle de Control
          </h3>

          <form onSubmit={handleLaunchBrowser} className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">URL de Destino:</label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://crunchyroll.com/checkout"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            {!isRunning && (
              <div className="space-y-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4 text-amber-300" /> Iniciar Navegador
                </button>
                <button
                  type="button"
                  onClick={handleOptimizeNetwork}
                  disabled={isOptimizing}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-indigo-450 border border-slate-700 font-extrabold text-xs py-3 rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  {isOptimizing ? 'Optimizando Red...' : 'Optimizar Red (Bypass)'}
                </button>
              </div>
            )}
          </form>

          {/* Running State Board */}
          {isRunning && (
            <div className="bg-slate-950 border border-indigo-500/20 p-4 rounded-xl space-y-3">
              <div>
                <span className="text-[9px] text-indigo-400 uppercase font-black tracking-wider block">Tarjeta de Prueba Activa:</span>
                <span className="text-xs font-mono font-bold text-slate-100 block">{currentMaskedCard}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400 font-bold">Progreso:</span>
                <span className="font-mono text-indigo-400 font-bold">{currentIndex + 1} / {cardsRef.current.length}</span>
              </div>
            </div>
          )}

          {/* Control Actions Row */}
          {currentUrl && (
            <div className="grid grid-cols-2 gap-2">
              {!isRunning ? (
                <button
                  onClick={startAutomation}
                  className="col-span-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 text-white" /> Iniciar Pruebas
                </button>
              ) : (
                <>
                  <button
                    onClick={pauseAutomation}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'Reanudar' : 'Pausar'}
                  </button>
                  <button
                    onClick={skipCard}
                    className="bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <SkipForward className="w-4 h-4" /> Saltar
                  </button>
                  <button
                    onClick={stopAutomation}
                    className="col-span-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Square className="w-3.5 h-3.5" /> Detener Proceso
                  </button>
                </>
              )}
            </div>
          )}

          {/* Local Stats Row */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
              <div className="text-[9px] text-emerald-400 font-bold uppercase">Hits</div>
              <div className="text-sm font-mono font-black text-emerald-400 mt-0.5">{hits}</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
              <div className="text-[9px] text-rose-400 font-bold uppercase">Declines</div>
              <div className="text-sm font-mono font-black text-rose-400 mt-0.5">{declined}</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
              <div className="text-[9px] text-amber-400 font-bold uppercase">3DS</div>
              <div className="text-sm font-mono font-black text-amber-400 mt-0.5">{threeds}</div>
            </div>
          </div>

          {/* Activity Terminal */}
          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Terminal de Log en Vivo
            </span>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 h-44 overflow-y-auto font-mono text-[9px] text-emerald-500/90 space-y-1.5 select-text leading-relaxed">
              {logs.length === 0 ? (
                <span className="text-slate-600 italic block">Esperando ejecución...</span>
              ) : (
                logs.map((log, idx) => <div key={idx}>{log}</div>)
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Secure Guest Webview (Fully functional browser) */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl min-h-[640px] flex flex-col">
          {/* Browser Navigation Bar */}
          <div className="flex items-center gap-2 bg-[#090d16] p-2.5 rounded-xl border border-slate-800 mb-3">
            {/* Nav Controls */}
            <button
              type="button"
              onClick={goBack}
              disabled={!canGoBack}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Atrás"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goForward}
              disabled={!canGoForward}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Adelante"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={reloadWebview}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
              title="Recargar"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Address Input */}
            <div className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              {addressBarUrl.startsWith('https://') ? (
                <span title="Conexión Segura (HTTPS)"><Lock className="w-3.5 h-3.5 text-emerald-400" /></span>
              ) : (
                <span title="Conexión No Cifrada (HTTP)"><Unlock className="w-3.5 h-3.5 text-amber-500" /></span>
              )}
              <input
                type="text"
                value={addressBarUrl}
                onChange={(e) => setAddressBarUrl(e.target.value)}
                onKeyDown={handleAddressKeyDown}
                className="w-full bg-transparent border-none outline-none text-slate-200 font-mono text-[11px]"
                placeholder="Busca en Google o ingresa URL..."
              />
            </div>

            {/* Navigate Trigger */}
            <button
              type="button"
              onClick={navigateAddressBar}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              <span>Ir</span>
            </button>
          </div>

          {/* Viewport */}
          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center relative">
            <webview
              ref={webviewRef}
              src={currentUrl || 'https://www.google.com'}
// preload attribute removed as Electron is no longer used
              style={{ width: '100%', height: '100%', minHeight: '520px' }}
              webpreferences="contextIsolation=no, nodeIntegration=yes"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
