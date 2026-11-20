// Gegenstände, Rezepte und Hotbar-Reihenfolge.

export const ITEMS = {
  hand:       { name: 'Fäuste', icon: '✊', tool: true, damage: 1 },
  wood:       { name: 'Holz', icon: '🪵' },
  stone:      { name: 'Stein', icon: '🪨' },
  fiber:      { name: 'Fasern', icon: '🌿' },
  hide:       { name: 'Fell', icon: '🦌' },
  rope:       { name: 'Seil', icon: '🪢' },
  arrow:      { name: 'Pfeil', icon: '➶' },
  berries:    { name: 'Beeren', icon: '🫐', food: { hunger: 8, thirst: 4 } },
  mushroom:   { name: 'Pilz', icon: '🍄', food: { hunger: 11 } },
  rawMeat:    { name: 'Rohes Fleisch', icon: '🥩', food: { hunger: 12, health: -6 } },
  cookedMeat: { name: 'Gebratenes Fleisch', icon: '🍖', food: { hunger: 38, health: 10 } },
  rawFish:    { name: 'Roher Fisch', icon: '🐟', food: { hunger: 8, health: -4 } },
  cookedFish: { name: 'Gebratener Fisch', icon: '🍣', food: { hunger: 28, health: 6 } },
  soup:       { name: 'Pilzsuppe', icon: '🍲', food: { hunger: 32, thirst: 18, health: 6, warmth: 25 } },
  juice:      { name: 'Beerensaft', icon: '🧃', food: { hunger: 6, thirst: 40 } },
  water:      { name: 'Wasser', icon: '💧', food: { thirst: 35 } },
  bandage:    { name: 'Verband', icon: '🩹', food: { health: 30 }, verb: 'angelegt' },
  axe:        { name: 'Steinaxt', icon: '🪓', tool: true, damage: 2.5, unique: true },
  pickaxe:    { name: 'Spitzhacke', icon: '⛏️', tool: true, damage: 2, unique: true },
  club:       { name: 'Holzkeule', icon: '🏏', tool: true, damage: 3, unique: true },
  spear:      { name: 'Speer', icon: '🔱', tool: true, damage: 4.5, reach: 3.8, unique: true },
  bow:        { name: 'Bogen', icon: '🏹', tool: true, damage: 1, unique: true, ammo: 'arrow' },
  rod:        { name: 'Angel', icon: '🎣', tool: true, damage: 1, unique: true },
  torch:      { name: 'Fackel', icon: '🔥', tool: true, damage: 1, unique: true },
  flask:      { name: 'Feldflasche', icon: '🧴', passive: true, unique: true },
  coat:       { name: 'Fellmantel', icon: '🧥', passive: true, unique: true },
  armor:      { name: 'Fellrüstung', icon: '🦺', passive: true, unique: true },
  campfire:   { name: 'Lagerfeuer', icon: '🏕️', place: true },
  shelter:    { name: 'Unterschlupf', icon: '⛺', place: true },
  palisade:   { name: 'Palisade', icon: '🚧', place: true },
  trap:       { name: 'Hasenfalle', icon: '🪤', place: true },
};

export const CATEGORIES = ['Material', 'Werkzeuge & Waffen', 'Ausrüstung', 'Bauen', 'Nahrung & Heilung'];

// fire: nur in der Nähe eines brennenden Lagerfeuers herstellbar. out: Anzahl pro Herstellung.
export const RECIPES = [
  { id: 'rope',     cat: 'Material',           needs: { fiber: 3 },                    desc: 'Wird für viele Rezepte gebraucht.' },
  { id: 'arrow',    cat: 'Material',           needs: { wood: 2, stone: 1, fiber: 1 }, out: 5, desc: 'Munition für den Bogen.' },
  { id: 'axe',      cat: 'Werkzeuge & Waffen', needs: { wood: 3, stone: 2, fiber: 2 }, desc: 'Fällt Bäume für Holz.' },
  { id: 'pickaxe',  cat: 'Werkzeuge & Waffen', needs: { wood: 3, stone: 3, fiber: 2 }, desc: 'Baut große Felsen ab.' },
  { id: 'club',     cat: 'Werkzeuge & Waffen', needs: { wood: 5 },                     desc: 'Einfache, aber kräftige Schlagwaffe.' },
  { id: 'spear',    cat: 'Werkzeuge & Waffen', needs: { wood: 4, stone: 1, fiber: 3 }, desc: 'Starke Waffe mit großer Reichweite.' },
  { id: 'bow',      cat: 'Werkzeuge & Waffen', needs: { wood: 3, rope: 2 },            desc: 'Schießt Pfeile auf weit entfernte Tiere.' },
  { id: 'rod',      cat: 'Werkzeuge & Waffen', needs: { wood: 3, rope: 1 },            desc: 'Am Wasser angeln – Linksklick auf das Wasser.' },
  { id: 'torch',    cat: 'Werkzeuge & Waffen', needs: { wood: 1, fiber: 2 },           desc: 'Licht und etwas Wärme in der Nacht.' },
  { id: 'flask',    cat: 'Ausrüstung',         needs: { hide: 1, fiber: 2 },           desc: 'Am Wasser füllen (R) – 3 Portionen.' },
  { id: 'coat',     cat: 'Ausrüstung',         needs: { hide: 4, fiber: 4 },           desc: 'Halbiert die Auskühlung.' },
  { id: 'armor',    cat: 'Ausrüstung',         needs: { hide: 5, rope: 2 },            desc: 'Wölfe verursachen 40 % weniger Schaden.' },
  { id: 'campfire', cat: 'Bauen',              needs: { wood: 5, stone: 4 },           desc: 'Wärme, Licht, Braten, Kochen. Hält Wölfe fern.' },
  { id: 'shelter',  cat: 'Bauen',              needs: { wood: 10, fiber: 6, hide: 2 }, desc: 'Nachts schlafen, Wiedereinstiegspunkt.' },
  { id: 'palisade', cat: 'Bauen',              needs: { wood: 4, rope: 1 },            desc: 'Spitzer Holzzaun – Tiere kommen nicht durch.' },
  { id: 'trap',     cat: 'Bauen',              needs: { wood: 3, rope: 2 },            desc: 'Fängt mit der Zeit Hasen (Fleisch + Fell).' },
  { id: 'bandage',  cat: 'Nahrung & Heilung',  needs: { fiber: 4 },                    desc: 'Heilt 30 Gesundheit.' },
  { id: 'juice',    cat: 'Nahrung & Heilung',  needs: { berries: 5, water: 1 },        desc: 'Löscht viel Durst.' },
  { id: 'soup',     cat: 'Nahrung & Heilung',  needs: { mushroom: 3, water: 1 }, fire: true, desc: 'Sättigt, löscht Durst und wärmt.' },
];

export const HOTBAR_ORDER = [
  'hand', 'axe', 'pickaxe', 'club', 'spear', 'bow', 'rod', 'torch',
  'campfire', 'shelter', 'palisade', 'trap',
  'cookedMeat', 'cookedFish', 'soup', 'juice', 'berries', 'mushroom', 'water', 'bandage', 'rawFish', 'rawMeat',
];

export const FOOD_PRIORITY = ['cookedMeat', 'soup', 'cookedFish', 'mushroom', 'berries', 'juice', 'rawFish', 'rawMeat'];
