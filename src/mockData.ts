/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Listing } from './types';
import { calculateListingScore } from './utils';

const INITIAL_RAW_LISTINGS = [
  {
    id: 'l-1',
    title: 'PlayStation 5 s mechanikou - svítí modře, nespustí se obraz',
    category: 'PlayStation 5' as const,
    price: 3600,
    typicalUsedPrice: 9000,
    condition: ['na opravu', 'nefunkční'] as any[],
    sourcePlatform: 'Bazoš' as const,
    scannedAt: new Date(Date.now() - 4 * 60000).toISOString(), // 4 mins ago
    description: 'Prodám PlayStation 5 s Blu-ray mechanikou. Konzole při zapnutí pouze modře bliká a obraz na televizi nenaskočí. Asi chyba HDMI portu nebo grafiky, nevím. Prodávám samotnou konzoli bez kabely a ovladače. Pouze osobní předání v Brně.',
    estimatedRepairCost: 800,
    notes: 'Pravděpodobně vadný HDMI enkoder čip (Panasonic) nebo jen urvaný HDMI port. Snadné mikropájení s vysokým ziskem!'
  },
  {
    id: 'l-2',
    title: 'iPhone 14 Pro 128GB - po pádu nejde zapnout, rozbitá záda',
    category: 'iPhone 14' as const,
    price: 5500,
    typicalUsedPrice: 16500,
    condition: ['nefunkční', 'na opravu', 'vadné'] as any[],
    sourcePlatform: 'FB Marketplace' as const,
    scannedAt: new Date(Date.now() - 12 * 60000).toISOString(), // 12 mins ago
    description: 'Prodám iPhone 14 Pro 128GB. Telefon spadl na dlažbu, zadní sklo je úplně na kaši, displej vizuálně vypadá OK, ale telefon vůbec nereaguje na nabíječku ani PC. iCloud je můj a odhlásím přes web po prodeji.',
    estimatedRepairCost: 3500,
    notes: 'Vynikající marže. Displej může být funkční. Chce to otestovat napětí na desce, možná jen utržený flex baterie nebo zkrat na nabíjecím obvodu.'
  },
  {
    id: 'l-3',
    title: 'Makita DDF484 aku šroubovák - jiskří z motoru pod zátěží',
    category: 'Makita' as const,
    price: 800,
    typicalUsedPrice: 2800,
    condition: ['vadné', 'na opravu'] as any[],
    sourcePlatform: 'Sbazar' as const,
    scannedAt: new Date(Date.now() - 17 * 60000).toISOString(),
    description: 'Aku vrtačka Makita DDF484. Plně funkční až na to, že při zátěži z ní vyskakují jiskry a smrdí po spálenině. Bez baterky a kufru, jen samotné tělo wrty.',
    estimatedRepairCost: 200,
    notes: 'Klasická banalita - opotřebované uhlíky nebo zanesený komutátor. Uhlíky stojí cca 150 Kč a výměna trvá 10 minut.'
  },
  {
    id: 'l-4',
    title: 'Samsung Galaxy S23 Ultra - zapomněl jsem heslo na účet',
    category: 'Samsung S23' as const,
    price: 4000,
    typicalUsedPrice: 15000,
    condition: ['použité - plně funkční', 'netestováno'] as any[],
    sourcePlatform: 'Bazoš' as const,
    scannedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    description: 'Dobrý den, prodávám Samsung S23 v hezkém stavu. Jenže jsem zapomněl přístupové heslo ke svému účtu Google / Samsung a nejde to obnovit. Prodávám tak jak leží pro někoho kdo tomu rozumí. Pošlete peníze předem na účet a já to hned odešlu poštou.',
    estimatedRepairCost: 0,
    notes: 'Kritické: Platba předem + zapomenuté heslo značí zcizené zařízení nebo podvodníka. Ruce pryč!'
  },
  {
    id: 'l-5',
    title: 'DeWalt DCD791 aku vrtačka a rázový utahovák - chybí baterie',
    category: 'DeWalt' as const,
    price: 1800,
    typicalUsedPrice: 4800,
    condition: ['chybí baterie', 'bez nabíječky'] as any[],
    sourcePlatform: 'Aukro' as const,
    scannedAt: new Date(Date.now() - 34 * 60000).toISOString(),
    description: 'Nabízím set nářadí DeWalt (vrtačka dcd791 a utahovák bity). Je to dovezené ze stavby v Německu, funkční ale nemám k tomu baterie ani nabíječku na vyzkoušení, proto prodávám bez jakékoliv záruky a levně.',
    estimatedRepairCost: 1100,
    notes: 'Pokud je to funkční, dokoupení neoriginální baterie z Číny za 600 Kč udělá z tohoto setu zlatý důl na další prodej.'
  },
  {
    id: 'l-6',
    title: 'Xiaomi Roborock S7 - chyba čidla Lidar a netočí se kartáč',
    category: 'Robotické vysavače' as const,
    price: 2500,
    typicalUsedPrice: 8500,
    condition: ['na opravu', 'vadné'] as any[],
    sourcePlatform: 'Sbazar' as const,
    scannedAt: new Date(Date.now() - 48 * 60000).toISOString(),
    description: 'Robotický vysavač Roborock S7. Hlásí chybu Error 1 (Lidar se netočí). Jinak se normálně zapne a nabíjí v doku. Plasty jsou poškrábané, ale nic hrozného. Prodám včetně dokovací stanice.',
    estimatedRepairCost: 350,
    notes: 'Lidar motorek na AliExpressu stojí 80 Kč, případně stačí vyměnit křemíkový řemínek. Velmi populární vysavač s rychlým prodejem.'
  },
  {
    id: 'l-7',
    title: 'iPhone 15 Pro Max 256GB - nalezen po spláchnutí ve vodě',
    category: 'iPhone 15' as const,
    price: 10000,
    typicalUsedPrice: 26000,
    condition: ['nefunkční', 'vadné'] as any[],
    sourcePlatform: 'FB Marketplace' as const,
    scannedAt: new Date(Date.now() - 62 * 60000).toISOString(),
    description: 'Prodám iPhone 15 Pro Max. Spadl do bazénu a ležel tam do druhého dne. Vůbec se nezapne, prach u nabíječky rezaví. Displej nemá žádnou prasklinu. Prodávám s krabičkou na náhradní díly bez záruky.',
    estimatedRepairCost: 12000,
    notes: 'Vysoké riziko oxidace celé základní desky. Displej i baterie budou nejspíš zničené zkratem ze slané či bazénové vody.'
  },
  {
    id: 'l-8',
    title: 'IP kamera Reolink RLC-810A - bez napájecího zdroje',
    category: 'IP kamery' as const,
    price: 600,
    typicalUsedPrice: 1900,
    condition: ['bez zdroje', 'netestováno'] as any[],
    sourcePlatform: 'Bazoš' as const,
    scannedAt: new Date(Date.now() - 80 * 60000).toISOString(),
    description: 'Prodám kvalitní venkovní 4K kameru Reolink. Kamera fungovala do poslední chvíle na firmě, teď se stěhovali a zapomněli mi k tomu dát napájecí PoE adaptér / zdroj. Takže prodávám bez zdroje, nemám jak otestovat.',
    estimatedRepairCost: 250,
    notes: 'PoE kamery se napájí přes síťový kabel ze switche nebo injektoru. Pokud má kupující vlastní PoE switch, kamera bude na 95 % okamžitě fungovat.'
  },
  {
    id: 'l-9',
    title: 'Video kukátko Ring Door View Cam - chybí dobíjecí baterie',
    category: 'Video kukátka' as const,
    price: 500,
    typicalUsedPrice: 2400,
    condition: ['chybí baterie'] as any[],
    sourcePlatform: 'Aukro' as const,
    scannedAt: new Date(Date.now() - 95 * 60000).toISOString(),
    description: 'Chytré kukátko na dveře s kamerou Ring. Bohužel mi při stěhování vypadla speciální baterie a ztratila se. Bez baterie nejde vyzkoušet, ale je jako nové, čočka nepoškrábaná.',
    estimatedRepairCost: 600,
    notes: 'Baterie pro Ring se dá snadno dokoupit na CZ e-shopech nebo Amazonu za cca 550 Kč. Zákazníci tato kukátka vyhledávají pro bezpečnost bytů.'
  },
  {
    id: 'l-10',
    title: 'Samsung Galaxy S24+ 256GB - prasklý vnitřní displej',
    category: 'Samsung S24' as const,
    price: 6000,
    typicalUsedPrice: 19500,
    condition: ['na opravu', 'vadné'] as any[],
    sourcePlatform: 'Bazoš' as const,
    scannedAt: new Date(Date.now() - 110 * 60000).toISOString(),
    description: 'Prodám vlajkovou loď Samsung Galaxy S24 Plus. Telefon je plně funkční po hmatu (vibruje, vyzvání), ale displej je pod sklem vyteklý takovým tím černým flekem a nesvítí. Sklo samotné není prasklé. Prodám samotný mobil.',
    estimatedRepairCost: 6500,
    notes: 'Výměna AMOLED displeje S24+ vyžaduje originální díl, který stojí cca 6000 Kč. Zisk po opravě a prodeji za 18500 Kč je kolem 6000 Kč čistého!'
  },
  {
    id: 'l-11',
    title: 'PlayStation 4 Pro 1TB - extrémní hluk, vypíná se',
    category: 'PlayStation 4' as const,
    price: 1900,
    typicalUsedPrice: 4800,
    condition: ['na opravu', 'vadné'] as any[],
    sourcePlatform: 'Sbazar' as const,
    scannedAt: new Date(Date.now() - 130 * 60000).toISOString(),
    description: 'Dobrý den, prodám PS4 Pro. Konzole funguje, ale hučí jako tryskáč a po cca půl hodině hraní se ukáže zpráva o přehřátí a vypne se. S ovladačem a dvěma hrama (Fifa, NHL).',
    estimatedRepairCost: 150,
    notes: 'Typický problém PS4 Pro s vyschlou teplovodivou pastou. Stačí vyčistit od prachu a aplikovat kvalitní pastu (MX-4/MX-6) za 150 Kč. Zvládne každý kutil.'
  },
  {
    id: 'l-12',
    title: 'iPhone 13 128GB - poškozený konektor displeje na desce',
    category: 'iPhone 13' as const,
    price: 3200,
    typicalUsedPrice: 9500,
    condition: ['vadné', 'na opravu'] as any[],
    sourcePlatform: 'Bazoš' as const,
    scannedAt: new Date(Date.now() - 150 * 60000).toISOString(),
    description: 'Prodám iPhone 13. Kamarád se mi v tom vrtal a pokoušel se vyměnit displej svépomocí. Bohužel utrhl nebo promáčkl nějaké piny na konektoru displeje na desce. Telefon jinak s novým displejem blikne, ale neukáže nic.',
    estimatedRepairCost: 2000,
    notes: 'Náročnější mikropájení FPC konektoru. Opravna mobilů si za to vezme kolem 1500–2000 Kč. Skvělá příležitost, pokud máte horkovzdušnou stanici.'
  },
  {
    id: 'l-13',
    title: 'Samsung S22 - rozbitý foťák, zaostření skáče a bzučí',
    category: 'Samsung S22' as const,
    price: 2600,
    typicalUsedPrice: 7000,
    condition: ['vadné', 'na opravu'] as any[],
    sourcePlatform: 'FB Marketplace' as const,
    scannedAt: new Date(Date.now() - 180 * 60000).toISOString(),
    description: 'Samsung S22. Telefon je v pořádku, displej super, ale hlavní kamera při zapnutí bzučí, obraz se šíleně třepe a nezaostří. Ostatní čočky jsou v pohodě.',
    estimatedRepairCost: 1200,
    notes: 'Poškozený optický stabilizátor (OIS) v modulu kamery, nejčastěji z držáku na motorku. Výměna celého kamerového modulu za cca 1200 Kč vrátí mobilu 100% stav.'
  },
  {
    id: 'l-14',
    title: 'Milwaukee heavy-duty rázový utahovák M18 - netočí',
    category: 'Milwaukee' as const,
    price: 2100,
    typicalUsedPrice: 6500,
    condition: ['nefunkční', 'na opravu'] as any[],
    sourcePlatform: 'Aukro' as const,
    scannedAt: new Date(Date.now() - 210 * 60000).toISOString(),
    description: 'Profesionální utahovák Milwaukee M18 Fuel. Po stisknutí spouště jen blikne LED světlo dole, ale brushless motor se nerozběhne. Vizuálně velmi málo jetý.',
    estimatedRepairCost: 1500,
    notes: 'Možná spálená řídící jednotka (ESC), popřípadě jen vadný kontakt spouštěče. U Milwaukee jsou díly drahé, ale výsledný prodej má obrovskou marži.'
  }
];

export const MOCK_LISTINGS: Listing[] = INITIAL_RAW_LISTINGS.map(item => {
  const result = calculateListingScore(item);
  return {
    ...item,
    score: result.score,
    riskFlags: result.riskFlags,
    isRisky: result.isRisky,
    sourceUrl: `https://www.google.cz/search?q=${encodeURIComponent(item.title + ' ' + item.sourcePlatform)}`
  } as Listing;
});

/**
 * Generates a new simulated incoming listing for live scanner simulation!
 */
export function generateRandomScannedListing(): Listing {
  const titles = [
    {
      title: 'iPhone 15 Pro 128GB - rozbitý displej, záda bez škrábance',
      category: 'iPhone 15' as const,
      price: 9000,
      typicalUsedPrice: 22000,
      condition: ['na opravu', 'vadné'] as any[],
      description: 'Zadní část absolutně jako nová. Používán v pouzdru. Bohužel mi vypadl z kapsy na beton a přední displej je úplně černý a sklo popraskané. Mobil vibruje a vyzvání, iCloud odhlásím.',
      notes: 'Super zisk! Výměna displeje na iPhone 15 je poměrně rychlá a hodnota telefonu zůstane vysoká.'
    },
    {
      title: 'PlayStation 5 digital - bez ovládače, po zapnutí pípne a zhasne',
      category: 'PlayStation 5' as const,
      price: 2400,
      typicalUsedPrice: 8000,
      condition: ['nefunkční', 'na opravu'] as any[],
      description: 'Digital verze bez mechaniky. Zapnu tlačítkem, pípne, modrá dioda blikne na sekundu a hned se celá konzole vypne. Musí se odpojit ze zásuvky aby šla zkusit znovu. Bez záruky na díly.',
      notes: 'Zkrat na 12V větvi nebo vadný napájecí zdroj (PSU). Náhradní zdroj stojí 800 Kč. Velký potenciál.'
    },
    {
      title: 'Makita DHP482 příklepovka bez baterky - netestovaná dárce',
      category: 'Makita' as const,
      price: 490,
      typicalUsedPrice: 1800,
      condition: ['netestováno', 'chybí baterie'] as any[],
      description: 'Vrtačka nalezená při generálním úklidu dílny po dědovi. Nemáme žádnou zelenou nebo tyrkysovou baterii na vyzkoušení, ležela v regále několik let. Proto prodávám jako nefunkční / netestované.',
      notes: 'Vysoce pravděpodobné, že je plně funkční, jen zaprášená. Sběratelé nářadí po tom okamžitě skočí.'
    },
    {
      title: 'Samsung S23 256GB - kompletně zablokovaný na starého majitele',
      category: 'Samsung S23' as const,
      price: 1800,
      typicalUsedPrice: 11000,
      condition: ['netestováno', 'vadné'] as any[],
      description: 'Prodám Samsung S23, telefon nejde zprovoznit. Zůstane svítit obrazovka zabezpečení a vyžaduje to PIN původního majitele od kterého jsem telefon zakoupil na bazaru a už nebere telefon. Peníze posílejte na dobírku.',
      notes: 'Stoprocentně kradené nebo pochybné zboží. FRP zámek se těžko legálně obchází.'
    },
    {
      title: 'DeWalt DCD701 - nefunkční spoušť, občas vynechává',
      category: 'DeWalt' as const,
      price: 600,
      typicalUsedPrice: 2200,
      condition: ['vadné', 'na opravu'] as any[],
      description: 'Menší šroubovák DeWalt. Někdy sepne hned, někdy musím spoušť zmáčknout pětkrát. Unavené kontakty ve vypínači. Jinak motoricky super.',
      notes: 'Oprava spínače / vyčištění kontaktů nebo výměna kabeláže. Díl vyjde na 250 Kč.'
    }
  ];

  const randomItem = titles[Math.floor(Math.random() * titles.length)];
  const platforms = ['Bazoš', 'Sbazar', 'FB Marketplace', 'Aukro'] as const;
  const platform = platforms[Math.floor(Math.random() * platforms.length)];
  
  const scoreResult = calculateListingScore({
    category: randomItem.category,
    condition: randomItem.condition,
    price: randomItem.price,
    typicalUsedPrice: randomItem.typicalUsedPrice,
    description: randomItem.description
  });

  const parsedItem: Listing = {
    id: `live-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: randomItem.title,
    category: randomItem.category,
    price: randomItem.price,
    typicalUsedPrice: randomItem.typicalUsedPrice,
    condition: randomItem.condition,
    score: scoreResult.score,
    sourcePlatform: platform,
    scannedAt: new Date().toISOString(),
    isRisky: scoreResult.isRisky,
    riskFlags: scoreResult.riskFlags,
    description: randomItem.description,
    estimatedRepairCost: Math.floor(randomItem.price * 0.25),
    notes: randomItem.notes,
    sourceUrl: `https://www.google.cz/search?q=${encodeURIComponent(randomItem.title + ' ' + platform)}`
  };

  return parsedItem;
}
