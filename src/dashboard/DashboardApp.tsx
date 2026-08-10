import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Folder,
  CreditCard,
  History,
  BarChart3,
  Globe,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Save,
  User,
  Mail,
  Phone as PhoneIcon,
  MapPin,
  Sparkles,
  Compass,
} from 'lucide-react';
import { storageGet, storageSet } from '../utils/storageAdapter';
import { STORAGE_KEYS } from '../utils/constants';
import type { IdentitySettings } from '../types/checkout';
import { DEFAULT_IDENTITY } from '../types/checkout';
import { generateRandomIdentity, ensureCompleteIdentity } from '../utils/identityGenerator';
import { AiBrowserPage } from '../popup/pages/AiBrowserPage';

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Spain',
  'Mexico',
  'Colombia',
  'Argentina',
  'Chile',
  'Brazil',
  'Peru',
  'Germany',
  'France',
  'Italy',
  'Australia',
];

export const DashboardApp: React.FC = () => {
  const [activeNav, setActiveNav] = useState<
    'overview' | 'projects' | 'testcases' | 'sessions' | 'domains' | 'settings' | 'aibrowser'
  >('overview');

  // Identity state for desktop app settings
  const [identity, setIdentity] = useState<IdentitySettings>(DEFAULT_IDENTITY);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    storageGet<IdentitySettings>(STORAGE_KEYS.IDENTITY).then((data) => {
      if (data) {
        setIdentity({
          ...DEFAULT_IDENTITY,
          ...data,
        });
      }
    });
  }, []);

  const handleGenerateRandomIdentity = (countryOverride?: string) => {
    const targetCountry = countryOverride || identity.country || 'United States';
    const randomData = generateRandomIdentity(targetCountry);
    setIdentity(randomData);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const completeIdentity = ensureCompleteIdentity(identity);
    setIdentity(completeIdentity);
    await storageSet(STORAGE_KEYS.IDENTITY, completeIdentity);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans flex select-none">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col justify-between p-4">
        <div className="space-y-6">
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wider uppercase">CODEX(R)</h1>
              <div className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>QA PLATFORM</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveNav('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeNav === 'overview'
                  ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveNav('projects')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeNav === 'projects'
                  ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>Projects</span>
            </button>

            <button
              onClick={() => setActiveNav('testcases')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeNav === 'testcases'
                  ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Test Cases</span>
            </button>

            <button
              onClick={() => setActiveNav('sessions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeNav === 'sessions'
                  ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Registro Eventos</span>
            </button>

            <button
              onClick={() => setActiveNav('domains')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeNav === 'domains'
                  ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Authorized Domains</span>
            </button>

            <button
              onClick={() => setActiveNav('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeNav === 'settings'
                  ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings & Identity</span>
            </button>
          </nav>
        </div>

        {/* User Footer */}
        <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>qa-engineer@CODER.dev</span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-indigo-400">PRO</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        {activeNav === 'aibrowser' ? (
          <AiBrowserPage />
        ) : activeNav === 'settings' ? (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">
                  CONFIGURACIÓN DE IDENTIDAD Y FACTURACIÓN
                </h2>
                <p className="text-xs text-slate-400">
                  Parámetros predeterminados para auto-relleno en formularios de pago (País, Zip Code, Dirección, Teléfono)
                </p>
              </div>
              {savedSuccess && (
                <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-800 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold">
                  <CheckCircle2 className="w-4 h-4" /> ¡Configuración Guardada!
                </div>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                    Datos de Facturación Predeterminados (Billing Profile)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateRandomIdentity()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-xs font-extrabold text-indigo-300 flex items-center gap-1.5 transition-all"
                  title="Genera datos reales aleatorios para el país seleccionado"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Generar Random ({identity.country || 'US'})
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mb-1.5">
                    <User className="w-4 h-4 text-indigo-400" /> Nombre Completo:
                  </label>
                  <input
                    type="text"
                    value={identity.billingName}
                    onChange={(e) => setIdentity({ ...identity, billingName: e.target.value })}
                    className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mb-1.5">
                    <Mail className="w-4 h-4 text-indigo-400" /> Correo Electrónico:
                  </label>
                  <input
                    type="email"
                    value={identity.email}
                    onChange={(e) => setIdentity({ ...identity, email: e.target.value })}
                    className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mb-1.5">
                    <PhoneIcon className="w-4 h-4 text-indigo-400" /> Teléfono:
                  </label>
                  <input
                    type="text"
                    value={identity.phone || ''}
                    onChange={(e) => setIdentity({ ...identity, phone: e.target.value })}
                    placeholder="9145550192"
                    className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs text-slate-100 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mb-1.5">
                    <Globe className="w-4 h-4 text-indigo-400" /> País:
                  </label>
                  <select
                    value={identity.country}
                    onChange={(e) => setIdentity({ ...identity, country: e.target.value })}
                    className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-4 h-4 text-indigo-400" /> Calle / Dirección Línea 1:
                  </label>
                  <input
                    type="text"
                    value={identity.address1}
                    onChange={(e) => setIdentity({ ...identity, address1: e.target.value })}
                    className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold mb-1.5 block">
                    Dirección Línea 2 (Apto / Suite):
                  </label>
                  <input
                    type="text"
                    value={identity.address2 || ''}
                    onChange={(e) => setIdentity({ ...identity, address2: e.target.value })}
                    placeholder="Apt 4B"
                    className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Ciudad:</label>
                  <input
                    type="text"
                    value={identity.city}
                    onChange={(e) => setIdentity({ ...identity, city: e.target.value })}
                    className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Estado / Provincia:</label>
                  <input
                    type="text"
                    value={identity.state || ''}
                    onChange={(e) => setIdentity({ ...identity, state: e.target.value })}
                    placeholder="IL, NY, etc."
                    className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1.5">Código Postal (Zip):</label>
                  <input
                    type="text"
                    value={identity.zipCode || ''}
                    onChange={(e) => setIdentity({ ...identity, zipCode: e.target.value })}
                    placeholder="10001"
                    className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1.5">
                  Retardo de Inyección entre Tarjetas (segundos):
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={identity.delay}
                  onChange={(e) => setIdentity({ ...identity, delay: parseInt(e.target.value, 10) || 2 })}
                  className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg transition-all uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Guardar Configuración de Identidad
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Header Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">QA AUTOMATION PLATFORM</h2>
                <p className="text-xs text-slate-400">Real-time payment checkout metrics & session results analytics</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-3 py-1.5 rounded-lg font-bold">
                  ● TEST MODE ACTIVE
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl space-y-1">
                <div className="text-xs text-slate-400 uppercase font-mono">TOTAL TESTS</div>
                <div className="text-2xl font-bold font-mono text-slate-100">1,248</div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <TrendingUp className="w-3 h-3" /> +12.4% vs last week
                </div>
              </div>

              <div className="bg-[#0f172a] border border-emerald-900/50 p-4 rounded-xl space-y-1">
                <div className="text-xs text-emerald-400 uppercase font-mono">SUCCESS (HITS)</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">934</div>
                <div className="text-[11px] text-slate-400 font-mono">74.8% Success Rate</div>
              </div>

              <div className="bg-[#0f172a] border border-rose-900/50 p-4 rounded-xl space-y-1">
                <div className="text-xs text-rose-400 uppercase font-mono">DECLINED</div>
                <div className="text-2xl font-bold font-mono text-rose-400">231</div>
                <div className="text-[11px] text-slate-400 font-mono">18.5% Decline Rate</div>
              </div>

              <div className="bg-[#0f172a] border border-amber-900/50 p-4 rounded-xl space-y-1">
                <div className="text-xs text-amber-400 uppercase font-mono">ERRORS / 3DS</div>
                <div className="text-2xl font-bold font-mono text-amber-400">83</div>
                <div className="text-[11px] text-slate-400 font-mono">6.7% Action Required</div>
              </div>

              <div className="bg-[#0f172a] border border-cyan-900/50 p-4 rounded-xl space-y-1">
                <div className="text-xs text-cyan-400 uppercase font-mono">AVG DURATION</div>
                <div className="text-2xl font-bold font-mono text-cyan-400">3.42s</div>
                <div className="text-[11px] text-slate-400 font-mono">Fast Execution</div>
              </div>
            </div>

            {/* Recent Sessions List */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  <span>RECENT TEST SESSIONS</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">Showing last 4 runs</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 bg-[#090d16] border border-slate-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">SUCCESS_TEST (Stripe Sandbox)</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <span>localhost:3000</span>
                    <span className="text-emerald-400">3.21s</span>
                    <span>14:32:01</span>
                  </div>
                </div>

                <div className="p-3 bg-[#090d16] border border-slate-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span className="font-semibold text-slate-200">DECLINED_TEST (Card Refused)</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <span>localhost:3000</span>
                    <span className="text-rose-400">2.98s</span>
                    <span>14:30:45</span>
                  </div>
                </div>

                <div className="p-3 bg-[#090d16] border border-slate-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-slate-200">THREE_DS_TEST (3DS Challenge)</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400">
                    <span>staging.example.com</span>
                    <span className="text-amber-400">8.11s</span>
                    <span>14:27:12</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
