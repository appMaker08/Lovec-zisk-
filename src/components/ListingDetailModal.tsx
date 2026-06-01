/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ExternalLink, MessageSquare, Flame, AlertOctagon, Settings, ShieldCheck, DollarSign, PenTool, Lightbulb } from 'lucide-react';
import { Listing, RepairGuide } from '../types';
import { formatCZK, REPAIR_GUIDES } from '../utils';

interface ListingDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
  onUpdateNotes: (id: string, notes: string, estimatedRepairCost: number) => void;
}

export default function ListingDetailModal({ listing, onClose, onUpdateNotes }: ListingDetailModalProps) {
  if (!listing) return null;

  const [notes, setNotes] = useState(listing.notes || '');
  const [repairCost, setRepairCost] = useState(listing.estimatedRepairCost || 0);
  const [isSavedMessage, setIsSavedMessage] = useState(false);

  // Find repair guides for this category
  const matchingGuide = REPAIR_GUIDES.find(g => g.category === listing.category);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateNotes(listing.id, notes, repairCost);
    setIsSavedMessage(true);
    setTimeout(() => setIsSavedMessage(false), 2000);
  };

  const calculatedProfit = listing.typicalUsedPrice - listing.price - repairCost;

  return (
    <div id="detail-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div 
        id="detail-modal-content"
        className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100"
      >
        <button
          id="close-detail-modal"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Top Header Section */}
        <div id="detail-badge-container" className="flex flex-wrap gap-2 mb-3 items-center">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {listing.category}
          </span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
            {listing.sourcePlatform}
          </span>
          {listing.score >= 12 && (
            <span className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Flame size={12} />
              Nejlepší nález (+{listing.score} b.)
            </span>
          )}
          {listing.isRisky && (
            <span className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertOctagon size={12} />
              Rizikové
            </span>
          )}
        </div>

        <h2 id="detail-item-title" className="text-xl sm:text-2xl font-black text-white tracking-tight mb-4 pr-10">
          {listing.title}
        </h2>

        {/* Main Financial Overview Cards */}
        <div id="detail-financial-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1">Cena inzerátu</span>
            <span className="text-lg font-black text-slate-200 font-mono">{formatCZK(listing.price)}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1">Odhadovaná oprava</span>
            <span className="text-lg font-black text-indigo-400 font-mono">{formatCZK(repairCost)}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1">Tržní hodnota (OK)</span>
            <span className="text-lg font-black text-slate-300 font-mono">{formatCZK(listing.typicalUsedPrice)}</span>
          </div>

          <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 text-center">
            <span className="text-[10px] text-emerald-500 block uppercase font-bold tracking-wider mb-1">Potenciální Zisk</span>
            <span className={`text-lg font-bold font-mono ${calculatedProfit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {calculatedProfit > 0 ? '+' : ''}{formatCZK(calculatedProfit)}
            </span>
          </div>
        </div>

        {/* Description and Diagnostic Tips */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          
          {/* Left Column - Description */}
          <div className="md:col-span-3 space-y-5">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <MessageSquare size={14} />
                Originální text inzerátu
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line antialiased">
                {listing.description}
              </p>
              
              <div className="mt-5 pt-3 border-t border-slate-850 flex items-center justify-between">
                <span className="text-xs text-slate-500">Skóre kalkulátoru: {listing.score} bodů</span>
                <a 
                  href={listing.sourceUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-400 font-semibold hover:text-indigo-300 hover:underline transition-colors cursor-pointer"
                >
                  Přejít na inzerát
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Risk Warnings Panel */}
            {listing.isRisky && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <AlertOctagon size={16} />
                  Bezpečnostní varování systému
                </div>
                <ul className="text-sm space-y-1.5 list-disc pl-5 text-amber-200">
                  {listing.riskFlags.map((flag, index) => (
                    <li key={index} className="leading-snug">{flag}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {!listing.isRisky && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 flex items-center gap-3">
                <ShieldCheck size={20} className="shrink-0 text-emerald-400" />
                <div className="text-xs">
                  <span className="font-bold uppercase tracking-wider block mb-0.5">Zabezpečená nabídka</span>
                  Nebyly detekovány žádné drahé oxidace desek, chybějící účty nebo pochybné požadavky na platbu předem.
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Repair Guide & Manual Diagnostics */}
          <div className="md:col-span-2 space-y-4">
            {matchingGuide ? (
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 font-bold text-xs uppercase text-slate-300 tracking-wider">
                  <PenTool size={14} className="text-indigo-400" />
                  Expertní diagnostická kuchařka
                </div>
                
                <div className="space-y-3">
                  {matchingGuide.commonIssues.map((issue, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-slate-200">{issue.issue}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          issue.difficulty === 'Nízká' ? 'bg-emerald-500/10 text-emerald-400' :
                          issue.difficulty === 'Střední' ? 'bg-indigo-500/10 text-indigo-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          {issue.difficulty} obtížnost
                        </span>
                      </div>
                      <p className="text-slate-400 leading-normal mb-1">{issue.description}</p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Díly: {issue.estCost}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                <Lightbulb size={24} className="mx-auto text-slate-600 mb-2" />
                K této kategorii není přiřazen specifický vizuální průvodce. Zkontrolujte klasické závady (kabely, napájení).
              </div>
            )}
          </div>
        </div>

        {/* Reseller Interactive Editor Section */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Settings size={14} className="text-indigo-400" />
            Vyjednávání & Plánování marže (Vlastní zápisy)
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Upravit náklady na díly (Kč)</label>
                <input 
                  type="number" 
                  min={0}
                  value={repairCost}
                  onChange={(e) => setRepairCost(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Poznámka k vyjednávání s prodejcem</label>
                <input 
                  type="text" 
                  placeholder="Např. Nabídnut mu 3000 Kč a osobní odběr dnes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500">
                Data jsou lokálně uložena.
              </span>
              <div className="flex items-center gap-3">
                {isSavedMessage && (
                  <span className="text-xs text-emerald-400 font-semibold">Poznámka uložena!</span>
                )}
                <button
                  id="save-notes-btn"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Uložit nastavení marže
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
