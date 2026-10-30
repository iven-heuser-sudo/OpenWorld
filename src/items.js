// Gegenstände, Rezepte und Hotbar-Reihenfolge.

export const ITEMS = {
  hand:       { name: 'Fäuste', icon: '✊', tool: true, damage: 1 },
  wood:       { name: 'Holz', icon: '🪵' },
  stone:      { name: 'Stein', icon: '🪨' },
  fiber:      { name: 'Fasern', icon: '🌿' },
  hide:       { name: 'Fell', icon: '🦌' },
  berries:    { name: 'Beeren', icon: '🫐', food: { hunger: 8, thirst: 4 } },
  mushroom:   { name: 'Pilz', icon: '🍄', food: { hunger: 11 } },
  rawMeat:    { name: 'Rohes Fleisch', icon: '🥩', food: { hunger: 12, health: -6 } },
  cookedMeat: { name: 'Gebratenes Fleisch', icon: '🍖', food: { hunger: 38, health: 10 } },
  water:      { name: 'Wasser', icon: '💧', food: { thirst: 35 } },
  axe:        { name: 'Steinaxt', icon: '🪓', tool: true, damage: 2.5, unique: true },
  pickaxe:    { name: 'Spitzhacke', icon: '⛏️', tool: true, damage: 2, unique: true },
  spear:      { name: 'Speer', icon: '🔱', tool: true, damage: 4.5, reach: 3.8, unique: true },
  torch:      { name: 'Fackel', icon: '🔥', tool: true, damage: 1, unique: true },
  flask:      { name: 'Feldflasche', icon: '🧴', passive: true, unique: true },
  coat:       { name: 'Fellmantel', icon: '🧥', passive: true, unique: true },
  campfire:   { name: 'Lagerfeuer', icon: '🏕️', place: true },
  shelter:    { name: 'Unterschlupf', icon: '⛺', place: true },
};

export const RECIPES = [
  { id: 'axe',      needs: { wood: 3, stone: 2, fiber: 2 }, desc: 'Fällt Bäume für Holz.' },
  { id: 'pickaxe',  needs: { wood: 3, stone: 3, fiber: 2 }, desc: 'Baut große Felsen ab.' },
  { id: 'spear',    needs: { wood: 4, stone: 1, fiber: 3 }, desc: 'Starke Waffe mit großer Reichweite.' },
  { id: 'torch',    needs: { wood: 1, fiber: 2 },           desc: 'Licht und etwas Wärme in der Nacht.' },
  { id: 'campfire', needs: { wood: 5, stone: 4 },           desc: 'Wärme, Licht, Fleisch braten. Hält Wölfe fern.' },
  { id: 'flask',    needs: { hide: 1, fiber: 2 },           desc: 'Am Wasser füllen (R) – 3 Portionen.' },
  { id: 'coat',     needs: { hide: 4, fiber: 4 },           desc: 'Halbiert die Auskühlung.' },
  { id: 'shelter',  needs: { wood: 10, fiber: 6, hide: 2 }, desc: 'Nachts schlafen, Wiedereinstiegspunkt.' },
];

export const HOTBAR_ORDER = [
  'hand', 'axe', 'pickaxe', 'spear', 'torch', 'campfire', 'shelter',
  'cookedMeat', 'berries', 'mushroom', 'water', 'rawMeat',
];

export const FOOD_PRIORITY = ['cookedMeat', 'mushroom', 'berries', 'rawMeat'];
