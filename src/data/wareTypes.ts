import { WareDatabase } from '../models/interfaces';

export const WARES_DATABASE: WareDatabase = {
  'ale': { name: 'Ale', basePrice: 4, description: 'A mug of local brew' },
  'wine': { name: 'Wine', basePrice: 10, description: 'A bottle of wine' },
  'meal': { name: 'Hot Meal', basePrice: 5, description: 'A hot cooked meal' },
  'spirits': { name: 'Spirits', basePrice: 15, description: 'A bottle of strong spirits' },
  
  'sword': { name: 'Sword', basePrice: 50, description: 'A metal sword' },
  'armor': { name: 'Armor', basePrice: 100, description: 'Protective gear' },
  'tools': { name: 'Tools', basePrice: 25, description: 'Crafting tools' },
  'horseshoe': { name: 'Horseshoes', basePrice: 8, description: 'Set of iron horseshoes' },
  
  'rope': { name: 'Rope (50ft)', basePrice: 1, description: 'Sturdy hemp rope' },
  'lantern': { name: 'Lantern', basePrice: 5, description: 'A hooded lantern' },
  'backpack': { name: 'Backpack', basePrice: 2, description: 'A leather backpack' },
  'tinderbox': { name: 'Tinderbox', basePrice: 1, description: 'Fire starting kit' },
  'blanket': { name: 'Woolen Blanket', basePrice: 3, description: 'Warm woolen blanket' },

  'grain': { name: 'Grain', basePrice: 1, description: 'Sack of wheat or barley' },
  'vegetables': { name: 'Vegetables', basePrice: 2, description: 'Fresh seasonal vegetables' },
  'milk': { name: 'Milk', basePrice: 1, description: 'Fresh milk' },
  'eggs': { name: 'Eggs', basePrice: 1, description: 'Dozen fresh eggs' },
  
  'holySymbol': { name: 'Holy Symbol', basePrice: 15, description: 'Religious icon or symbol' },
  'incense': { name: 'Incense', basePrice: 5, description: 'Fragrant ceremonial incense' },
  'healingPotion': { name: 'Healing Potion', basePrice: 50, description: 'Medicinal tonic or potion' },
  
  'bread': { name: 'Bread', basePrice: 1, description: 'Fresh baked loaf' },
  'pastry': { name: 'Pastry', basePrice: 3, description: 'Sweet or savory pastry' },
  'cake': { name: 'Cake', basePrice: 8, description: 'Decorated cake for special occasions' },
  
  'beef': { name: 'Beef', basePrice: 5, description: 'Cut of beef' },
  'pork': { name: 'Pork', basePrice: 4, description: 'Cut of pork' },
  'poultry': { name: 'Poultry', basePrice: 3, description: 'Chicken or other fowl' },
  'sausage': { name: 'Sausage', basePrice: 3, description: 'Seasoned meat sausage' },
  
  'exotic': { name: 'Exotic Goods', basePrice: 50, description: 'Rare items from distant lands' },
  'spices': { name: 'Spices', basePrice: 25, description: 'Rare and expensive spices' },
  'silk': { name: 'Silk', basePrice: 40, description: 'Fine silk fabrics' },
  'jewelry': { name: 'Jewelry', basePrice: 75, description: 'Decorative precious metal jewelry' }
};