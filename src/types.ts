/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category =
  | 'PlayStation 5'
  | 'PlayStation 4'
  | 'iPhone 13'
  | 'iPhone 14'
  | 'iPhone 15'
  | 'Samsung S22'
  | 'Samsung S23'
  | 'Samsung S24'
  | 'Makita'
  | 'DeWalt'
  | 'Milwaukee'
  | 'IP kamery'
  | 'Video kukátka'
  | 'Robotické vysavače';

export type Condition =
  | 'nefunkční'
  | 'na opravu'
  | 'vadné'
  | 'netestováno'
  | 'bez zdroje'
  | 'bez nabíječky'
  | 'chybí baterie'
  | 'použité - plně funkční'
  | 'opotřebené';

export interface Listing {
  id: string;
  title: string;
  category: Category;
  price: number; // in CZK
  typicalUsedPrice: number; // in CZK (for profitability reference)
  condition: Condition[];
  score: number;
  sourceUrl: string;
  sourcePlatform: 'Bazoš' | 'Sbazar' | 'FB Marketplace' | 'Aukro';
  scannedAt: string;
  riskFlags: string[]; // reasons why this item is risky
  isRisky: boolean;
  description: string;
  estimatedRepairCost: number; // in CZK
  notes?: string;
}

export interface RepairGuide {
  category: Category;
  commonIssues: {
    issue: string;
    description: string;
    difficulty: 'Nízká' | 'Střední' | 'Vysoká';
    estCost: string;
  }[];
}

export interface DashboardStats {
  totalScanned: number;
  avgScore: number;
  activeOpportunities: number;
  estimatedProfitPool: number;
}
