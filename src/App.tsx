/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, 
  AlertTriangle, 
  Search, 
  Plus, 
  TrendingUp, 
  SlidersHorizontal, 
  Eye, 
  Trash2, 
  Play, 
  Pause, 
  Sparkles, 
  Clock, 
  HelpCircle,
  ExternalLink,
  BookOpen,
  Filter,
  CheckCircle2,
  RefreshCw,
  Coins,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Condition, Listing, DashboardStats } from './types';
import { MOCK_LISTINGS, generateRandomScannedListing } from './mockData';
import { formatCZK, formatTimeDistance, calculateListingScore } from './utils';
import AddListingModal from './components/AddListingModal';
import ListingDetailModal from './components/ListingDetailModal';

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

export default function App() {
  // State for all listings in the system
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Vše'>('Vše');
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'date'>('score');

  // Interactive Live Scanner simulator state
  const [isScannerActive, setIsScannerActive] = useState<boolean>(true);
  const [scannerNotification, setScannerNotification] = useState<Listing | null>(null);
  const [toastTimer, setToastTimer] = useState<any>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedListingDetail, setSelectedListingDetail] = useState<Listing | null>(null);

  // Stats computation helper
  const stats = useMemo((): DashboardStats => {
    const active = listings.filter(item => !item.isRisky);
    const totalProfit = active.reduce((sum, item) => {
      const margin = item.typicalUsedPrice - item.price - (item.estimatedRepairCost || 0);
      return sum + (margin > 0 ? margin : 0);
    }, 0);

    const sumScore = listings.reduce((sum, item) => sum + item.score, 0);

    return {
      totalScanned: listings.length,
      avgScore: listings.length ? Math.round((sumScore / listings.length) * 10) / 10 : 0,
      activeOpportunities: active.length,
      estimatedProfitPool: totalProfit
    };
  }, [listings]);

  // Handle automatic simulated listings arrivals
  useEffect(() => {
    let interval: any = null;
    if (isScannerActive) {
      // Generate a new simulated crawled item every 35-45 seconds
      interval = setInterval(() => {
        const newItem = generateRandomScannedListing();
        
        // Add to state
        setListings(prev => [newItem, ...prev]);

        // Push temporary alert notification toast at bottom of page
        setScannerNotification(newItem);
        
        if (toastTimer) clearTimeout(toastTimer);
        const timer = setTimeout(() => {
          setScannerNotification(null);
        }, 8000);
        setToastTimer(timer);

      }, 25000);
    }
    return () => clearInterval(interval);
  }, [isScannerActive, toastTimer]);

  // Direct manual simulator trigger
  const triggerManualSimulation = () => {
    const newItem = generateRandomScannedListing();
    setListings(prev => [newItem, ...prev]);
    setScannerNotification(newItem);
    
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => {
      setScannerNotification(null);
    }, 8000);
    setToastTimer(timer);
  };

  // Add new manual simulated list item
  const handleAddCustomListing = (newListing: Listing) => {
    setListings(prev => [newListing, ...prev]);
  };

  // Delete a listing
  const handleDeleteListing = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setListings(prev => prev.filter(item => item.id !== id));
  };

  // Update specific listing notes & estimated repair budget from detail modal
  const handleUpdateNotesAndCost = (id: string, updatedNotes: string, repairCost: number) => {
    setListings(prev => prev.map(item => {
      if (item.id === id) {
        // Recompute parameters with newly specified cost
        const recomputed = calculateListingScore({
          category: item.category,
          condition: item.condition,
          price: item.price,
          typicalUsedPrice: item.typicalUsedPrice,
          description: `${item.title} ${item.description}`
        });

        return {
          ...item,
          notes: updatedNotes,
          estimatedRepairCost: repairCost,
          score: recomputed.score,
          isRisky: recomputed.isRisky,
          riskFlags: recomputed.riskFlags
        };
      }
      return item;
    }));
    
    // Also update current active detail modal object to prevent drift
    setSelectedListingDetail(prev => {
      if (prev && prev.id === id) {
        const recomputed = calculateListingScore({
          category: prev.category,
          condition: prev.condition,
          price: prev.price,
          typicalUsedPrice: prev.typicalUsedPrice,
          description: `${prev.title} ${prev.description}`
        });
        return {
          ...prev,
          notes: updatedNotes,
          estimatedRepairCost: repairCost,
          score: recomputed.score,
          isRisky: recomputed.isRisky,
          riskFlags: recomputed.riskFlags
        };
      }
      return prev;
    });
  };

  // Filter listings based on category, search bar, and score sliders
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      const matchesCategory = selectedCategory === 'Vše' || item.category === selectedCategory;
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesScore = item.score >= minScore;

      return matchesCategory && matchesSearch && matchesScore;
    });
  }, [listings, selectedCategory, searchTerm, minScore]);

  // Sort filtered listings
  const sortedListings = useMemo(() => {
    const listCopy = [...filteredListings];
    if (sortBy === 'score') {
      return listCopy.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'price') {
      return listCopy.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'date') {
      return listCopy.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
    }
    return listCopy;
  }, [filteredListings, sortBy]);

  // Splitting into lists as requested:
  // "🔥 Nejlepší nálezy" -> Highly profitable deals (e.g. score >= 11 or profit high and not risky)
  const bestFinds = useMemo(() => {
    return sortedListings.filter(item => item.score >= 12 && !item.isRisky);
  }, [sortedListings]);

  // "⚠ Rizikové nabídky" -> Any items labeled isRisky
  const riskyDeals = useMemo(() => {
    return sortedListings.filter(item => item.isRisky);
  }, [sortedListings]);

  // Standard opportunities (Remaining list to keep it transparent)
  const standardDeals = useMemo(() => {
    return sortedListings.filter(item => item.score < 12 && !item.isRisky);
  }, [sortedListings]);

  return (
    <div id="applet-container" className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header Navigation */}
      <header id="applet-header" className="border-b border-slate-900 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Flame size={20} className="text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 id="brand-title" className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 uppercase">
                Lovec Zisku
                <span className="text-[10px] lowercase bg-emerald-500/10 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-500/20">PRO</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Flipping & Repair Finder CZ</p>
            </div>
          </div>

          {/* Scanner Controls inside Header */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isScannerActive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isScannerActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                Skener: {isScannerActive ? 'aktivní' : 'pozastaven'}
              </span>
            </div>

            <button
              id="toggle-scanner-btn"
              onClick={() => setIsScannerActive(!isScannerActive)}
              className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                isScannerActive 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title={isScannerActive ? 'Pozastavit automatické prohledávání' : 'Spustit automatické prohledávání'}
            >
              {isScannerActive ? <Pause size={15} /> : <Play size={15} />}
              <span className="hidden md:inline">{isScannerActive ? 'Zastavit sken' : 'Spustit sken'}</span>
            </button>

            <button
              id="force-alert-btn"
              onClick={triggerManualSimulation}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/15"
              title="Okamžitě prohledat internet a nasimulovat další inzerát"
            >
              <RefreshCw size={13} className="animate-spin-slow" />
              <span className="hidden sm:inline">Naskenovat inzerát</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="applet-main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Statistics Widgets - Bento Row */}
        <div id="stats-dashboard" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900/80 hover:border-slate-800 transition-colors flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <TrendingUp size={22} />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Celkem zpracováno</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">{stats.totalScanned}</span>
            </div>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900/80 hover:border-slate-800 transition-colors flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Flame size={22} />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Průměrné skóre</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{stats.avgScore} <span className="text-xs text-slate-500">/ 15 b</span></span>
            </div>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-900/80 hover:border-slate-800 transition-colors flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertTriangle size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Upozornění / Rizika</span>
              <span className="text-xl sm:text-2xl font-black text-amber-500 font-mono">
                {listings.filter(i => i.isRisky).length} už
              </span>
            </div>
          </div>

          <div className="bg-emerald-500/[0.03] p-5 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/20 transition-colors flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Coins size={22} />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Potenciál čistých marží</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">{formatCZK(stats.estimatedProfitPool)}</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar / Workspace Controls */}
        <div id="filter-controls-card" className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          
          {/* First Row: Search, Score Slide and Add button */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 text-slate-500" size={18} />
              <input
                id="search-input"
                type="text"
                placeholder="Hledat model, závadu nebo text inzerátu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none transition-all placeholder-slate-500"
              />
            </div>

            {/* Score Slider Filter */}
            <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
              <SlidersHorizontal size={16} className="text-slate-500" />
              <span className="text-xs text-slate-400 whitespace-nowrap">Min. skóre:</span>
              <input
                type="range"
                min="0"
                max="15"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-24 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-xs text-white font-mono font-bold w-6 text-right">{minScore}b</span>
            </div>

            {/* Sorting Trigger */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Řadit:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
              >
                <option value="score" className="bg-slate-900">Podle výhodnosti</option>
                <option value="price" className="bg-slate-900">Podle nejnižší ceny</option>
                <option value="date" className="bg-slate-900">Podle stáří</option>
              </select>
            </div>

            {/* Manual Calculator modal trigger */}
            <button
              id="open-calculator-modal"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              <Plus size={16} />
              Kalkulátor & Vklad
            </button>
          </div>

          {/* Second Row: Category Capsules Filter */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Vyhledat podle kategorie:</span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              <button
                key="vse"
                onClick={() => setSelectedCategory('Vše')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedCategory === 'Vše'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Všechny ({listings.length})
              </button>

              {CATEGORIES.map((cat) => {
                const count = listings.filter(i => i.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    {cat} <span className="text-[10px] text-slate-500 font-normal">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 🔥 SECTION 1: NEJLEPŠÍ NÁLEZY                             */}
        {/* ========================================================= */}
        <section id="best-finds-section" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1 px-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
              <Flame size={16} className="text-emerald-400 animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-widest">
                🔥 Nejlepší nálezy
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-bold font-mono bg-slate-900 px-2 py-0.5 rounded-full border border-slate-850">
              {bestFinds.length} příležitostí
            </span>
          </div>

          {bestFinds.length === 0 ? (
            <div className="p-6 bg-slate-900/15 border border-dashed border-slate-900 rounded-2xl text-center text-xs text-slate-500">
              V této vyhledávací skupině momentálně není žádná nabídka splňující super-výhodné skóre (skóre {'>'}= 12 bez rizikových příznaků).
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {bestFinds.map((item) => {
                  const profit = item.typicalUsedPrice - item.price - (item.estimatedRepairCost || 0);
                  return (
                    <motion.div
                      layout
                      key={item.id}
                      onClick={() => setSelectedListingDetail(item)}
                      className="bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-400/60 rounded-xl p-5 shadow-xl hover:shadow-emerald-500/5 transition-all duration-350 cursor-pointer relative overflow-hidden group/card"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      {/* Top Glowing Gradient Cover tag */}
                      <div className="absolute top-0 right-0 h-1 w-24 bg-gradient-to-l from-emerald-500 to-indigo-500"></div>

                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                          <Flame size={13} />
                          Skóre {item.score} b.
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatTimeDistance(item.scannedAt)}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-100 group-hover/card:text-white transition-colors mb-2 line-clamp-2 min-h-[40px]">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                        {item.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-center p-2.5 bg-slate-950/80 rounded-lg border border-slate-850 mb-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Koupit za</span>
                          <span className="font-black text-slate-300 font-mono">{formatCZK(item.price)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-500 block uppercase font-bold tracking-wider">Marže</span>
                          <span className="font-extrabold text-emerald-400 font-mono">+{formatCZK(profit)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-850/60 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                          {item.category}
                        </span>
                        <span className="text-indigo-400 font-bold hover:underline group-hover/card:translate-x-1 duration-150 transition-transform inline-flex items-center gap-0.5">
                          Otevřít diagnostiku →
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* ⚠ SECTION 2: RIZIKOVÉ NABÍDKY                             */}
        {/* ========================================================= */}
        <section id="risky-deals-section" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1 px-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500 flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="text-sm font-black uppercase tracking-widest">
                ⚠ Rizikové nabídky
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-bold font-mono bg-slate-900 px-2 py-0.5 rounded-full border border-slate-850">
              {riskyDeals.length} v seznamu
            </span>
          </div>

          {riskyDeals.length === 0 ? (
            <div className="p-6 bg-slate-900/15 border border-dashed border-slate-900 rounded-2xl text-center text-xs text-slate-500">
              Nebyly nalezeny žádné inzeráty se zvýšeným bezpečnostním rizikem pro tuto filtrační sadu.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {riskyDeals.map((item) => {
                  return (
                    <motion.div
                      layout
                      key={item.id}
                      onClick={() => setSelectedListingDetail(item)}
                      className="bg-slate-900/50 border border-amber-500/30 hover:border-amber-500/60 rounded-xl p-5 shadow-lg transition-all cursor-pointer relative overflow-hidden group/card"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <div className="absolute top-0 right-0 h-1.5 w-full bg-amber-500/20"></div>

                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-widest flex items-center gap-1">
                          <AlertTriangle size={13} />
                          Riziko
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatTimeDistance(item.scannedAt)}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-amber-200 group-hover/card:text-amber-100 transition-colors mb-2 line-clamp-2 min-h-[40px]">
                        {item.title}
                      </h3>

                      {/* Display first risk tag explicitly */}
                      <div className="mb-3.5 mt-0.5">
                        <span className="text-[10px] bg-amber-500/10 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/20">
                          {item.riskFlags[0] || 'Nespecifikované riziko'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between text-xs p-2.5 bg-slate-950/60 rounded-lg border border-slate-850">
                        <span className="text-[11px] text-slate-500">Cena inzerátu:</span>
                        <span className="font-bold text-slate-300 font-mono">{formatCZK(item.price)}</span>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-850/60 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                          {item.category}
                        </span>
                        <span className="text-amber-400 font-bold hover:underline inline-flex items-center gap-0.5">
                          Průzkum hrozeb →
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 📋 SECTION 3: DATAGRID TABULKA VÝSLEDKŮ                   */}
        {/* ========================================================= */}
        <section id="results-table-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 px-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400 flex items-center gap-1.5">
                <SlidersHorizontal size={16} className="text-indigo-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-[#94a3b8]">
                  Datový přehled všech nabídek
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-bold font-mono bg-slate-900 px-2 py-0.5 rounded-full border border-slate-850">
                {filteredListings.length} zobrazeno
              </span>
            </div>

            {/* Quick reset active filters */}
            {(searchTerm || selectedCategory !== 'Vše' || minScore > 0) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('Vše');
                  setMinScore(0);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center gap-1 cursor-pointer"
              >
                Resetovat filtry
              </button>
            )}
          </div>

          {filteredListings.length === 0 ? (
            <div className="p-12 bg-slate-900 border border-slate-850 rounded-2xl text-center text-slate-400 space-y-2">
              <p className="font-bold">Žádné inzeráty neodpovídají nastaveným filtrům.</p>
              <p className="text-xs text-slate-500">Zkuste ve vyhledávači ubrat klíčová slova nebo snížit minimální požadované skóre.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl">
              
              {/* Responsive Table for large screens, List view for tiny mobile targets */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px] hidden md:table">
                  <thead>
                    <tr className="bg-slate-950/60 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850">
                      <th className="py-4 px-5">Název</th>
                      <th className="py-4 px-4 w-28">Kategorie</th>
                      <th className="py-4 px-4 w-28 text-right">Cena</th>
                      <th className="py-4 px-4 w-40">Stav / Indikátor</th>
                      <th className="py-4 px-4 w-36 text-center">Skóre výhodnosti</th>
                      <th className="py-4 px-5 w-24 text-right">Odkazy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedListings.map((item) => {
                      const isHighFind = item.score >= 12 && !item.isRisky;
                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-slate-850/60 hover:bg-slate-850/35 transition-colors cursor-pointer group ${
                            isHighFind ? 'bg-emerald-500/[0.01]' : item.isRisky ? 'bg-amber-500/[0.01]' : ''
                          }`}
                          onClick={() => setSelectedListingDetail(item)}
                        >
                          {/* Title / Main description */}
                          <td className="py-3.5 px-5">
                            <div className="max-w-md">
                              <span className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                                {item.title}
                              </span>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-[10px] bg-slate-950 text-slate-300 font-semibold px-2 py-1 rounded-md border border-slate-850">
                              {item.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className="font-black text-sm text-slate-200 font-mono">
                              {formatCZK(item.price)}
                            </span>
                          </td>

                          {/* Condition pills */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {item.condition.slice(0, 2).map((st) => (
                                <span key={st} className="text-[9px] bg-slate-950 text-slate-400 font-medium px-1.5 py-0.5 rounded">
                                  {st}
                                </span>
                              ))}
                              {item.condition.length > 2 && (
                                <span className="text-[9px] bg-slate-950 text-slate-500 px-1 rounded">
                                  +{item.condition.length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Profitability Score badge */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col items-center">
                              <div className="w-full max-w-[100px] h-1.5 bg-slate-950 rounded-full overflow-hidden mb-1">
                                <div 
                                  className={`h-full ${
                                    item.score >= 12 ? 'bg-emerald-400' :
                                    item.score >= 8 ? 'bg-indigo-400' : 'bg-slate-600'
                                  }`}
                                  style={{ width: `${Math.min((item.score / 15) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <span className={`text-[11px] font-black font-mono ${
                                item.score >= 12 ? 'text-emerald-400' :
                                item.score >= 8 ? 'text-indigo-300' : 'text-slate-400'
                              }`}>
                                {item.score} b.
                              </span>
                            </div>
                          </td>

                          {/* Link and Actions */}
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <button
                                aria-label="Zobrazit inzerát"
                                className="p-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded text-xs font-semibold flex items-center gap-1 transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(item.sourceUrl, '_blank');
                                }}
                              >
                                {item.sourcePlatform}
                                <ExternalLink size={10} />
                              </button>

                              <button
                                id={`delete-listing-${item.id}`}
                                title="Odstranit"
                                onClick={(e) => handleDeleteListing(item.id, e)}
                                className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile list representation for small phones */}
                <div className="grid grid-cols-1 divide-y divide-slate-850 md:hidden">
                  {sortedListings.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 bg-slate-900 active:bg-slate-850 flex flex-col gap-3"
                      onClick={() => setSelectedListingDetail(item)}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
                            {item.category} • {item.sourcePlatform}
                          </span>
                          <span className="font-bold text-sm text-slate-100 block mt-0.5 line-clamp-2">
                            {item.title}
                          </span>
                        </div>

                        <span className={`text-xs font-black font-mono px-2 py-1 rounded shrink-0 ${
                          item.score >= 12 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          item.score >= 8 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.score} b.
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                        <div>
                          <span className="text-[9px] text-slate-500 block">CENA</span>
                          <span className="text-xs font-bold font-mono text-slate-300">{formatCZK(item.price)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">STAV</span>
                          <span className="text-[10px] text-slate-400 truncate block max-w-[120px]">
                            {item.condition.join(', ')}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(item.sourceUrl, '_blank');
                          }}
                          className="bg-indigo-600 px-3 py-1.5 rounded text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                        >
                          Přejít <ExternalLink size={8} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer copyright and diagnostics info */}
      <footer id="applet-footer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-900 text-center space-y-2">
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} <strong>Lovec Zisku CZ</strong>. Všechna práva vyhrazena. 
        </p>
        <p className="text-[10px] text-slate-600 max-w-xl mx-auto leading-relaxed">
          Tento software slouží pro včasnou detekci podhodnoceného zboží. Výpočet skóre výhodnosti se řídí určenou metodikou (značkové faktory, typy poškození a finanční poměry). Nenačítá se z chráněných serverů bez klíče – simulované toky dat generují plně kompatibilní zkušební relace.
        </p>
      </footer>

      {/* Float live notification toast when automatic simulated crawler finds an item */}
      <AnimatePresence>
        {scannerNotification && (
          <motion.div
            id="scanner-toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border-2 border-emerald-500 rounded-xl shadow-2xl overflow-hidden cursor-pointer"
            onClick={() => {
              setSelectedListingDetail(scannerNotification);
              setScannerNotification(null);
            }}
          >
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#10b981] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25 flex items-center gap-1.5">
                  <Flame size={12} className="text-emerald-400" />
                  Skener detekoval inzerát
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setScannerNotification(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-100 line-clamp-1">
                  {scannerNotification.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {scannerNotification.description}
                </p>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Cena</span>
                  <span className="font-black text-rose-400 font-mono">{formatCZK(scannerNotification.price)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500 block uppercase font-bold tracking-wider">Skóre</span>
                  <span className="font-black text-emerald-400 font-mono">+{scannerNotification.score} bodů</span>
                </div>
                <div className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg">
                  Analyzovat
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals Mounting */}
      <AddListingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCustomListing}
      />

      <ListingDetailModal
        listing={selectedListingDetail}
        onClose={() => setSelectedListingDetail(null)}
        onUpdateNotes={handleUpdateNotesAndCost}
      />

    </div>
  );
}
