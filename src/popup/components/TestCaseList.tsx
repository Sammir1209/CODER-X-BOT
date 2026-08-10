import React, { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { Plus, Check, CreditCard, Upload } from 'lucide-react';

export const TestCaseList: React.FC = () => {
  const { testCases, selectedTestCase, setSelectedTestCase, importRawFixtures } = useSessionStore();
  const [showImportModal, setShowImportModal] = useState(false);
  const [rawText, setRawText] = useState('');
  const [importCount, setImportCount] = useState<number | null>(null);

  const handleImport = () => {
    if (!rawText.trim()) return;
    const count = importRawFixtures(rawText);
    setImportCount(count);
    setTimeout(() => {
      setImportCount(null);
      setShowImportModal(false);
      setRawText('');
    }, 1200);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
          <span>TEST CASES & FIXTURES ({testCases.length})</span>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="dev-button dev-button-primary text-[11px] py-1 px-2.5"
        >
          <Upload className="w-3 h-3" />
          <span>IMPORT FIXTURES</span>
        </button>
      </div>

      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {testCases.map((tc) => {
          const isSelected = selectedTestCase?.id === tc.id;
          return (
            <div
              key={tc.id}
              onClick={() => setSelectedTestCase(tc)}
              className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/60 text-slate-100 shadow-sm'
                  : 'bg-[#0f172a] border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs">{tc.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      tc.expectedResult === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : tc.expectedResult === 'DECLINED'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                    }`}
                  >
                    {tc.expectedResult}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  •••• {tc.fixture.number.slice(-4)} | {tc.fixture.expiryMonth}/{tc.fixture.expiryYear.slice(-2)} | CVC {tc.fixture.cvc}
                </div>
              </div>

              {isSelected && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-700 rounded-lg p-4 w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-400" />
                IMPORT TEST FIXTURES
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Paste test fixtures (Format: <code className="text-indigo-300">PAN|MM|YYYY|CVC</code>):
            </p>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="5549006001718414|06|2028|394&#10;5549006001715808|06|2028|215&#10;5549006001710361|06|2028|492"
              className="w-full h-28 bg-[#090d16] border border-slate-700 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />

            {importCount !== null && (
              <div className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 p-2 rounded text-center">
                ✓ Successfully imported {importCount} test fixtures!
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="dev-button dev-button-danger py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="dev-button dev-button-primary py-1.5 px-3"
              >
                Save Fixtures
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
