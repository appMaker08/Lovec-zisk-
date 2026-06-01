/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calculator, ShieldCheck, AlertTriangle, PlusCircle } from 'lucide-react';
import { Category, Condition, Listing } from '../types';
import { calculateListingScore, formatCZK } from '../utils';

interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (listing: Listing) => void;
}

const CATEGORIES: Category[] = [
  'PlayStation 5',
  'PlayStation 4',
  'iPhone 13',
  'iPhone 14',
  'iPhone 15',
  'Samsung S22',
  'Samsung S23',
  'Samsung S24',
  'Makita',
  'DeWalt',
  'Milwaukee',
  'IP kamery',
  'Video kukátka',
  'Robotické vysavače'
];

const AVAILABLE_CONDITIONS: { value: Condition; label: string; points: string }[] = [
  { value: 'nefunkční', label: 'Nefunkční (vada)', points: '+5 b' },
  { value: 'na opravu', label: 'Na opravu', points: '+5 b' },
  { value: 'vadné', label: 'Vadné / Poškozené', points: '+5 b' },
  { value: 'netestováno', label: 'Netestováno', points: '+3 b' },
  { value: 'bez zdroje', label: 'Bez zdroje / PoE adaptéru', points: '+3 b' },
  { value: 'bez nabíječky', label: 'Bez nabíječky', points: '+2 b' },
  { value: 'chybí baterie', label: 'Chybí baterie / akumulátor', points: '+2 b' },
  { value: 'použité - plně funkční', label: 'Použité - plně funkční', points: '0 b' },
  { value: 'opotřebené', label: 'Kosmeticky opotřebené', points: '0 b' }
];

const PLATFORMS = ['Bazoš', 'Sbazar', 'FB Marketplace', 'Aukro'] as const;

export default function AddListingModal({ isOpen, onClose, onAdd }: AddListingModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('PlayStation 5');
  const [price, setPrice] = useState<number>(3000);
  const [typicalPrice, setTypicalPrice] = useState<number>(8500);
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>(['na opravu']);
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<'Bazoš' | 'Sbazar' | 'FB Marketplace' | 'Aukro'>('Bazoš');
  const [repairCost, setRepairCost] = useState<number>(500);
  const [personalNote, setPersonalNote] = useState('');

  // Live scoring preview
  const [scorePreview, setScorePreview] = useState({ score: 0, riskFlags: [] as string[], isRisky: false });

  useEffect(() => {
    const res = calculateListingScore({
      category,
      condition: selectedConditions,
      price,
      typicalUsedPrice: typicalPrice,
      description: `${title} ${description}`
    });
    setScorePreview(res);
  }, [category, selectedConditions, price, typicalPrice, title, description]);

  if (!isOpen) return null;

  const handleConditionToggle = (cond: Condition) => {
    if (selectedConditions.includes(cond)) {
      setSelectedConditions(selectedConditions.filter(c => c !== cond));
    } else {
      setSelectedConditions([...selectedConditions, cond]);
    }
  };

  const handleSuggestMarketPrice = (cat: Category) => {
    // Fill realistic market and repair prices based on selected category
    switch (cat) {
      case 'PlayStation 5':
        setTypicalPrice(9000);
        setRepairCost(1000);
        break;
      case 'PlayStation 4':
        setTypicalPrice(4500);
        setRepairCost(400);
        break;
      case 'iPhone 15':
        setTypicalPrice(20000);
        setRepairCost(3500);
        break;
      case 'iPhone 14':
        setTypicalPrice(15000);
        setRepairCost(2500);
        break;
      case 'iPhone 13':
        setTypicalPrice(11000);
        setRepairCost(1800);
        break;
      case 'Samsung S24':
        setTypicalPrice(18000);
        setRepairCost(4000);
        break;
      case 'Samsung S23':
        setTypicalPrice(13000);
        setRepairCost(2000);
        break;
      case 'Samsung S22':
        setTypicalPrice(8000);
        setRepairCost(1500);
        break;
      case 'Makita':
        setTypicalPrice(2800);
        setRepairCost(300);
        break;
      case 'DeWalt':
        setTypicalPrice(3200);
        setRepairCost(400);
        break;
      case 'Milwaukee':
        setTypicalPrice(5500);
        setRepairCost(890);
        break;
      case 'Robotické vysavače':
        setTypicalPrice(8000);
        setRepairCost(600);
        break;
      case 'IP kamery':
        setTypicalPrice(2200);
        setRepairCost(200);
        break;
      case 'Video kukátka':
        setTypicalPrice(2500);
        setRepairCost(300);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newListing: Listing = {
      id: `custom-${Date.now()}`,
      title,
      category,
      price,
      typicalUsedPrice: typicalPrice,
      condition: selectedConditions,
      score: scorePreview.score,
      sourcePlatform: platform,
      scannedAt: new Date().toISOString(),
      isRisky: scorePreview.isRisky,
      riskFlags: scorePreview.riskFlags,
      description: description || 'Zadán uživatelský popis k ruční analýze.',
      estimatedRepairCost: repairCost,
      notes: personalNote || 'Ručně přidaná nabídka do kalkulátoru.',
      sourceUrl: `https://www.google.cz/search?q=${encodeURIComponent(title + ' ' + platform)}`
    };

    onAdd(newListing);
    onClose();

    // Reset input states
    setTitle('');
    setDescription('');
    setSelectedConditions(['na opravu']);
    setPersonalNote('');
  };

  const estimatedProfit = typicalPrice - price - repairCost;

  return (
    <div id="add-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="add-modal-content"
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100"
      >
        <button
          id="close-add-modal"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Calculator size={24} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Kalkulátor & Ruční vložení
            </h2>
            <p className="text-sm text-slate-400">
              Otestujte skóre nabídky před koupí nebo přidejte vlastní nález do systému
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Controls - 2 cols on wide screens */}
          <div className="lg:col-span-2 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Název nabídky / Inzerátu *
              </label>
              <input
                type="text"
                required
                placeholder="Např. PlayStation 5 - vadný diskový slot"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Kategorie
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const cat = e.target.value as Category;
                    setCategory(cat);
                    handleSuggestMarketPrice(cat);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 focus:outline-none transition-colors"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Zdrojový bazar
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-100 focus:outline-none transition-colors"
                >
                  {PLATFORMS.map((plat) => (
                    <option key={plat} value={plat}>
                      {plat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nákupní cena inzerátu
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-lg pl-3 pr-10 py-2.5 text-slate-100 font-mono focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-sm">Kč</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Odhad ceny opravy / dílů
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={repairCost}
                    onChange={(e) => setRepairCost(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-lg pl-3 pr-10 py-2.5 text-slate-100 font-mono focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-sm">Kč</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  Plná prodejní cena
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={typicalPrice}
                    onChange={(e) => setTypicalPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-lg pl-3 pr-10 py-2.5 text-slate-100 font-mono focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-sm">Kč</span>
                </div>
              </div>
            </div>

            {/* Condition multi-select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Stav produktu (Vyberte jeden či více bodovaných faktorů)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_CONDITIONS.map((cond) => {
                  const isSelected = selectedConditions.includes(cond.value);
                  return (
                    <button
                      key={cond.value}
                      type="button"
                      onClick={() => handleConditionToggle(cond.value)}
                      className={`flex flex-col text-left p-2.5 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span className="font-medium text-slate-200">{cond.label}</span>
                      <span className="text-[10px] mt-0.5 text-indigo-400 font-mono font-semibold">{cond.points}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Text inzerátu / Popis závady (Skener analyzuje klíčová rizika)
              </label>
              <textarea
                rows={3}
                placeholder="Vložte text inzerátu... (např. 'nejde zapnout, poškozená vodou, platba předem')"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl p-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Personal tracker note */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Interní poznámka k plánu opravy
              </label>
              <input
                type="text"
                placeholder="Např. Objednat displej z AliExpressu za 40 dolarů"
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Right Column - Realtime Calculator Results */}
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
              <h3 className="text-sm font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Calculator size={16} className="text-emerald-400" />
                Live Výpočet & Analýza
              </h3>

              {/* Profit Indicator */}
              <div className="text-center p-4 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Předpokládaný hrubý zisk</span>
                <span className={`text-2xl font-black font-mono ${estimatedProfit > 3000 ? 'text-emerald-400' : estimatedProfit > 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                  {estimatedProfit > 0 ? '+' : ''}{formatCZK(estimatedProfit)}
                </span>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                  <span>Prodej: {formatCZK(typicalPrice)}</span>
                  <span>- Náklady: {formatCZK(price + repairCost)}</span>
                </div>
              </div>

              {/* Score Indicator */}
              <div className="flex items-center justify-between p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block">Skóre výhodnosti</span>
                  <span className="text-2xl font-black font-mono text-cyan-400">{scorePreview.score} b.</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Úroveň</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    scorePreview.score >= 12 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : scorePreview.score >= 8 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {scorePreview.score >= 12 ? 'Vynikající' : scorePreview.score >= 8 ? 'Výhodné' : 'Standard'}
                  </span>
                </div>
              </div>

              {/* Risk Detector status */}
              <div className={`p-4 rounded-xl border ${
                scorePreview.isRisky 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' 
                  : 'bg-emerald-500/5 border-emerald-500/10 text-slate-400'
              }`}>
                <div className="flex items-center gap-2 mb-2 font-semibold text-xs uppercase tracking-wider">
                  {scorePreview.isRisky ? (
                    <>
                      <AlertTriangle size={16} className="text-amber-500" />
                      <span className="text-amber-400">Detekováno riziko</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <span className="text-emerald-400">Bezpečná nabídka</span>
                    </>
                  )}
                </div>
                {scorePreview.isRisky ? (
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-amber-300">
                    {scorePreview.riskFlags.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs">
                    Popis neobsahuje známé podvodné obraty, blokované účty nebo kritické hardwarové vady.
                  </p>
                )}
              </div>

              {/* Add checklist guides */}
              <div className="text-xs text-slate-500 space-y-1.5 border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span>+5b za žádanou značku:</span>
                  <span className="font-mono text-slate-300">PS5, Apple, Samsung, profi nářadí</span>
                </div>
                <div className="flex justify-between">
                  <span>+5b za nefunkčnost:</span>
                  <span className="font-mono text-slate-300">na opravu, vadné</span>
                </div>
                <div className="flex justify-between">
                  <span>+3b za neprověření:</span>
                  <span className="font-mono text-slate-300">netestováno, chybí zdroj</span>
                </div>
              </div>
            </div>

            <button
              id="submit-manually-btn"
              type="submit"
              disabled={!title.trim()}
              className={`w-full py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                title.trim()
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/15 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <PlusCircle size={18} />
              Vložit do trackeru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
