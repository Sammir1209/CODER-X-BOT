import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { TestCase } from '../../types/testCase';
import { generateLuhnCard } from '../../utils/cardGenerator';
import '../../styles/theme.css';
import { Sparkles, Save } from 'lucide-react';

const saveToStorage = (key: string, val: any) => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ [key]: val });
  } else {
    localStorage.setItem(key, JSON.stringify(val));
    // Sync with desktop backend server (if available) for Chrome Extension
    fetch('http://127.0.0.1:18080/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: val })
    }).catch(() => {});
  }
};

const getFromStorage = (keys: string[], callback: (res: any) => void) => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(keys, callback);
  } else {
    const res: any = {};
    keys.forEach(k => {
      const v = localStorage.getItem(k);
      if (v !== null) {
        try {
          res[k] = JSON.parse(v);
        } catch (_) {
          res[k] = v;
        }
      }
    });
    callback(res);
  }
};

export function DashboardPage() {
  const { testCases, setTestCases, setSelectedTestCase } = useSessionStore();
  const [activeSourceMode, setActiveSourceMode] = useState<'bin' | 'ccs'>('bin');
  // Estado quitado: activeTab, setActiveTab

  const [binsText, setBinsText] = useState('');
  const [ccText, setCcText] = useState('');
  const [cardQuantity, setCardQuantity] = useState<number>(50);

  // Estados del quick add eliminados

  // Estado eliminado: savedHits

  useEffect(() => {
    getFromStorage(['CODEX_bins', 'CODEX_ccs', 'CODEX_active_source_mode'], (res: any) => {
      if (res.CODEX_bins) setBinsText(res.CODEX_bins);
      if (res.CODEX_ccs) setCcText(res.CODEX_ccs);
      if (res.CODEX_active_source_mode) setActiveSourceMode(res.CODEX_active_source_mode);
    });
  }, []);

  /**
   * Generates a Luhn-valid card number with random future expiry date and random CVV
   */
  const detectBrand = (bin: string) => {
    const clean = bin.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'MASTERCARD';
    if (/^3[47]/.test(clean)) return 'AMEX';
    if (/^6011|^65/.test(clean)) return 'DISCOVER';
    return 'GENERIC';
  };

  /**
   * Switch mode between BIN generator and CCs import
   */
  const handleSwitchMode = (mode: 'bin' | 'ccs') => {
    setActiveSourceMode(mode);
    saveToStorage('CODEX_active_source_mode', mode);
  };

  /**
   * Saves BINs and generates unique Luhn cards with random expiry dates and CVVs
   */
  const handleSaveAndGenerateBins = () => {
    saveToStorage('CODEX_bins', binsText);
    saveToStorage('CODEX_active_source_mode', 'bin');
    const binLines = binsText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    if (binLines.length === 0) {
      alert('Ingresa al menos un BIN válido de 6 dígitos (ejemplo: 402170).');
      return;
    }

    const generatedCases: TestCase[] = [];

    binLines.forEach((binStr) => {
      const brand = detectBrand(binStr);
      for (let i = 0; i < cardQuantity; i++) {
        const card = generateLuhnCard(binStr);
        generatedCases.push({
          id: `bin-gen-${Date.now()}-${binStr}-${i}`,
          name: `[${brand}] ${binStr.slice(0, 6)} •••• ${card.number.slice(-4)}`,
          description: `Exp: ${card.expiryMonth}/${card.expiryYear} | CVC: ${card.cvc}`,
          provider: 'generic',
          environment: 'sandbox',
          expectedResult: 'SUCCESS',
          fixture: {
            number: card.number,
            expiryMonth: card.expiryMonth,
            expiryYear: card.expiryYear,
            cvc: card.cvc,
            cardholderName: 'QA Test User',
            zipCode: '10001',
          },
          createdAt: new Date().toISOString(),
        });
      }
    });

    setTestCases(generatedCases);
    if (generatedCases.length > 0) {
      setSelectedTestCase(generatedCases[0]);
    }
    alert(`Se generaron y cargaron ${generatedCases.length} tarjetas dinámicas con vencimientos y CVVs variados.`);
  };

  /**
   * Import batch CCs manually
   */
  const handleImportBatchCCs = () => {
    const lines = ccText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const updatedCases: TestCase[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(/[|:,]/).map((p) => p.trim());
      if (parts.length >= 3) {
        const number = parts[0];
        const month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        const cvc = parts[3] || '123';

        updatedCases.push({
          id: `manual-import-${Date.now()}-${idx}`,
          name: `CC •••• ${number.slice(-4)} (${month}/${year})`,
          description: `Importada masivamente (CVC: ${cvc})`,
          provider: 'generic',
          environment: 'sandbox',
          expectedResult: 'SUCCESS',
          fixture: {
            number,
            expiryMonth: month,
            expiryYear: year,
            cvc,
            cardholderName: 'QA Test User',
            zipCode: '10001',
          },
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (updatedCases.length > 0) {
      saveToStorage('CODEX_ccs', ccText);
      saveToStorage('CODEX_active_source_mode', 'ccs');
      setTestCases(updatedCases);
      setSelectedTestCase(updatedCases[0]);
      alert(`¡Éxito! Se cargaron ${updatedCases.length} tarjetas personalizadas en CODEX(R).`);
    } else {
      alert('Ingresa tarjetas en formato válido: NUMERO|MM|YYYY|CVC (Ej: 4242424242424242|12|2028|123)');
    }
  };

  // Funciones de tarjetas individuales removidas

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto w-full pb-8">
      {/* Upper Section: Mode Select & Textareas */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
        {/* SELECT MODE Panel */}
        <div className="bg-[#0b0d14] border border-slate-900/60 rounded-xl p-4 shadow-lg flex flex-col h-full">
          <div className="text-[10px] font-bold text-white uppercase tracking-widest border-l-2 border-slate-500 pl-2 mb-4">
            SELECT MODE
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleSwitchMode('bin')}
              className={`flex-1 py-3 px-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 ${
                activeSourceMode === 'bin'
                  ? 'bg-slate-100 text-slate-900'
                  : 'bg-[#05070a] border border-slate-800/60 text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeSourceMode === 'bin' ? 'bg-slate-900' : 'bg-slate-600'}`}></span>
              BIN MODE
            </button>
            <button
              onClick={() => handleSwitchMode('ccs')}
              className={`flex-1 py-3 px-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 ${
                activeSourceMode === 'ccs'
                  ? 'bg-slate-100 text-slate-900'
                  : 'bg-[#05070a] border border-slate-800/60 text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeSourceMode === 'ccs' ? 'bg-slate-900' : 'bg-slate-600'}`}></span>
              CC LIST
            </button>
          </div>
        </div>

        {/* CARD LIST Panel */}
        <div className="bg-[#0b0d14] border border-slate-900/60 rounded-xl p-4 shadow-lg flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[10px] font-bold text-white uppercase tracking-widest border-l-2 border-slate-500 pl-2">
              | CARD LIST
            </div>
            <div className="text-[10px] font-mono text-slate-500 tracking-widest">
              {activeSourceMode === 'bin' ? `${testCases.length} CARDS (BIN MODE)` : `${testCases.length} CARDS (CC LIST)`}
            </div>
          </div>
          
          {activeSourceMode === 'bin' ? (
            <textarea
              rows={8}
              value={binsText}
              onChange={(e) => setBinsText(e.target.value)}
              placeholder="Ingresa tus BINs (ej: 402170)"
              className="w-full bg-[#05070a] border border-slate-800/60 rounded-lg p-3 text-[11px] text-slate-300 font-mono outline-none focus:border-slate-600 transition-all resize-none flex-1 mb-3"
            />
          ) : (
            <textarea
              rows={8}
              value={ccText}
              onChange={(e) => setCcText(e.target.value)}
              placeholder="NUMERO|MM|YYYY|CVC"
              className="w-full bg-[#05070a] border border-slate-800/60 rounded-lg p-3 text-[11px] text-slate-300 font-mono outline-none focus:border-slate-600 transition-all resize-none flex-1 mb-3"
            />
          )}

          {activeSourceMode === 'bin' && (
            <select
              value={cardQuantity}
              onChange={(e) => setCardQuantity(Number(e.target.value))}
              className="w-full bg-[#05070a] border border-slate-800/60 rounded-lg p-2.5 text-[10px] text-slate-300 font-bold outline-none mb-3"
            >
              <option value={10}>10 Tarjetas</option>
              <option value={50}>50 Tarjetas (Recomendado)</option>
              <option value={100}>100 Tarjetas</option>
              <option value={500}>500 Tarjetas</option>
            </select>
          )}

          <button
            onClick={activeSourceMode === 'bin' ? handleSaveAndGenerateBins : handleImportBatchCCs}
            className="w-full bg-slate-100 hover:bg-white text-slate-900 font-black text-[10px] py-3 rounded-lg shadow-md transition-all uppercase tracking-widest flex items-center justify-center gap-2 mb-4"
          >
            <Save className="w-3.5 h-3.5" /> SAVE CARDS
          </button>

          {/* Loop Control */}
          <div className="flex items-center justify-between bg-[#05070a] border border-slate-800/60 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <div className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">LOOP CARD LIST</div>
                <div className="text-[9px] text-slate-500 font-mono">Restart from card 1 when list ends</div>
              </div>
            </div>
            {/* iOS Style Toggle Mock */}
            <div className="w-9 h-5 bg-slate-100 rounded-full relative cursor-pointer shadow-inner">
              <div className="w-4 h-4 bg-slate-900 rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
