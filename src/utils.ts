/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Listing, Category, Condition, RepairGuide } from './types';

/**
 * Calculates the profitability score and risk flags based on listing details.
 */
export function calculateListingScore(item: {
  category: Category;
  condition: Condition[];
  price: number;
  typicalUsedPrice: number;
  description: string;
}): { score: number; riskFlags: string[]; isRisky: boolean } {
  let score = 0;
  const riskFlags: string[] = [];

  // --- Core Condition Points (+5, +3, +2) ---
  const conditions = item.condition || [];
  
  const hasLevel5 = conditions.some(c => c === 'nefunkční' || c === 'na opravu' || c === 'vadné');
  const hasLevel3 = conditions.some(c => c === 'netestováno' || c === 'bez zdroje');
  const hasLevel2 = conditions.some(c => c === 'bez nabíječky' || c === 'chybí baterie');

  if (hasLevel5) score += 5;
  if (hasLevel3) score += 3;
  if (hasLevel2) score += 2;

  // --- High-demand Category Points (+5) ---
  const highDemandCategories: Category[] = [
    'PlayStation 5',
    'iPhone 13',
    'iPhone 14',
    'iPhone 15',
    'Samsung S22',
    'Samsung S23',
    'Samsung S24',
    'Makita',
    'DeWalt',
    'Milwaukee'
  ];

  if (highDemandCategories.includes(item.category)) {
    score += 5;
  }

  // --- Extra Smart Metric: Price Evaluation Bonus (+1 to +5) ---
  // If price is heavily undervalued compared to typical used working price
  const ratio = item.price / item.typicalUsedPrice;
  if (ratio <= 0.25) {
    score += 5; // Dirt cheap, massive potential margin
  } else if (ratio <= 0.45) {
    score += 3; // Highly undervalued
  } else if (ratio <= 0.65) {
    score += 1; // Mildly undervalued
  }

  // --- Risk Analysis based on keywords ---
  const descLower = (item.description || '').toLowerCase();
  
  if (descLower.includes('icloud') || descLower.includes('blokov') || descLower.includes('zámek') || descLower.includes('nepřihlášen')) {
    riskFlags.push('Pravděpodobný iCloud / Google účet blokován');
  }
  if (descLower.includes('voda') || descLower.includes('vytopen') || descLower.includes('bazen') || descLower.includes('káva') || descLower.includes('polité')) {
    riskFlags.push('Vysoké riziko poškození vodou / oxidací');
  }
  if (descLower.includes(' deska') || descLower.includes('základní deska') || descLower.includes('motherboard')) {
    riskFlags.push('Vadná základní deska (extrémně náročná oprava)');
  }
  if (descLower.includes('pošta předem') || descLower.includes('peníze předem') || descLower.includes('zaloha predem')) {
    riskFlags.push('Vyžadována platba předem - Možný podvod');
  }
  if (descLower.includes('fake') || descLower.includes('replika') || descLower.includes('neoriginál')) {
    riskFlags.push('Podezření na neoriginální kus / repliku');
  }
  if (item.price < 900 && (item.category === 'PlayStation 5' || item.category === 'iPhone 15')) {
    riskFlags.push('Podezřele nízká cena - možný podvodník');
  }

  const isRisky = riskFlags.length > 0;

  return {
    score,
    riskFlags,
    isRisky
  };
}

/**
 * Returns Czech currency formatted string.
 */
export function formatCZK(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formats time distance in Czech.
 */
export function formatTimeDistance(isoString: string): string {
  try {
    const past = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'před chvílí';
    if (diffMins < 60) return `před ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `před ${diffHours} hod`;
    const diffDays = Math.floor(diffHours / 24);
    return `před ${diffDays} d`;
  } catch {
    return 'dnes';
  }
}

/**
 * Technical Guides for quick diagnostics & fixing.
 */
export const REPAIR_GUIDES: RepairGuide[] = [
  {
    category: 'PlayStation 5',
    commonIssues: [
      {
        issue: 'Poškozený HDMI port',
        description: 'Konzole svítí bíle, ale na TV není obraz. Vyžaduje mikropájení nového HDMI konektoru.',
        difficulty: 'Střední',
        estCost: '400 - 800 Kč (náhradní díl)'
      },
      {
        issue: 'Vadný tekutý kov / přehřívání',
        description: 'Vypíná se po 10-15 minutách hraní bez chybové hlášky. Potřeba rozetřít či doplnit tekutý kov.',
        difficulty: 'Střední',
        estCost: '300 Kč'
      },
      {
        issue: 'Zablokovaná mechanika',
        description: 'Nechce brát nebo vyhazovat disky. Často jen vypadlá pružinka nebo cizí předmět vložený dětmi.',
        difficulty: 'Nízká',
        estCost: '0 Kč (vyčištění)'
      }
    ]
  },
  {
    category: 'iPhone 15',
    commonIssues: [
      {
        issue: 'Prasklé zadní sklo',
        description: 'Díky nové konstrukci u iP15 se zadní sklo mění mnohem snadněji než u starších generací.',
        difficulty: 'Nízká',
        estCost: '800 - 1500 Kč za díl'
      },
      {
        issue: 'Nefunkční nabíjení USB-C',
        description: 'Znečištěný port (prach z kapes) nebo poškozený flex konektor. Prach lze vyčistit párátkem zdarma.',
        difficulty: 'Nízká',
        estCost: '0 - 400 Kč'
      }
    ]
  },
  {
    category: 'Robotické vysavače',
    commonIssues: [
      {
        issue: 'Chyba Lidar senzoru (Error 1)',
        description: 'Kupole nahoře se netočí. Většinou prasklý hnací gumičkový řemínek nebo spálený motorek lidaru.',
        difficulty: 'Nízká',
        estCost: '100 - 300 Kč'
      },
      {
        issue: 'Slabá baterie',
        description: 'Vysavač se po chvíli vrací do doku nebo vynechává. Snadná výměna akumulátoru vespod přístroje.',
        difficulty: 'Nízká',
        estCost: '600 - 1200 Kč'
      }
    ]
  },
  {
    category: 'Makita',
    commonIssues: [
      {
        issue: 'Opotřebované uhlíky v motorku',
        description: 'Nářadí jiskří nebo se nerozběhne vůbec. Práce na 10 minut s obyčejným šroubovákem.',
        difficulty: 'Nízká',
        estCost: '100 - 180 Kč'
      },
      {
        issue: 'Zničená převodovka rázového utahováku',
        description: 'Motor točí, ale hřídel nepřenáší rány nebo prokluzuje. Výměna převodového bloku.',
        difficulty: 'Střední',
        estCost: '400 - 900 Kč'
      }
    ]
  }
];
