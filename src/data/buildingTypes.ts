import { BuildingType } from '../models/interfaces';

export const DEFAULT_BUILDING_TYPES: BuildingType[] = [
  {
    id: 'residence',
    name: 'Residence',
    description: 'A residential building where people live',
    icon: '🏠',
    possibleNames: ['Small House', 'Cottage', 'Apartment', 'Villa', 'Manor'],
    possibleOwners: ['Local Family', 'Retired Adventurer', 'Merchant', 'Craftsperson'],
    possibleWares: []
  },
  {
    id: 'tavern',
    name: 'Tavern',
    description: 'A place to drink, eat, and hear the latest rumors',
    icon: '🍺',
    possibleNames: ['The Prancing Pony', 'The Green Dragon', 'The Rusty Anchor', 'The Golden Goose', 'The Silver Crown', 'The Dancing Bear'],
    possibleOwners: ['Jolly Barkeep', 'Retired Soldier', 'Local Family', 'Gruff Veteran', 'Cheerful Hostess'],
    possibleWares: [
      { wareId: 'ale', probability: 0.9 },
      { wareId: 'wine', probability: 0.7 },
      { wareId: 'meal', probability: 0.8 },
      { wareId: 'spirits', probability: 0.5 }
    ]
  },
  {
    id: 'blacksmith',
    name: 'Blacksmith',
    description: 'A forge for creating and repairing metal items',
    icon: '⚒️',
    possibleNames: ['The Anvil', 'Red Forge', 'Hammer & Tongs', 'Steel Works', 'The Blazing Forge', 'Iron Heart'],
    possibleOwners: ['Burly Smith', 'Master Craftsman', 'Guild Member', 'Dwarven Smith', 'Family Business'],
    possibleWares: [
      { wareId: 'sword', probability: 0.7 },
      { wareId: 'armor', probability: 0.6 },
      { wareId: 'tools', probability: 0.9 },
      { wareId: 'horseshoe', probability: 0.8 }
    ]
  },
  {
    id: 'generalStore',
    name: 'General Store',
    description: 'A shop selling various common goods',
    icon: '🛒',
    possibleNames: ['Market Goods', 'Village Supplies', 'Trading Post', 'General Wares', 'The Merchant\'s Stall', 'Traveler\'s Necessities'],
    possibleOwners: ['Shopkeeper', 'Trading Family', 'Retired Explorer', 'Merchant Guild Member', 'Foreign Trader'],
    possibleWares: [
      { wareId: 'rope', probability: 0.9 },
      { wareId: 'lantern', probability: 0.8 },
      { wareId: 'backpack', probability: 0.7 },
      { wareId: 'tinderbox', probability: 0.6 },
      { wareId: 'blanket', probability: 0.7 }
    ]
  },
  {
    id: 'farm',
    name: 'Farm',
    description: 'Agricultural land where crops are grown or animals raised',
    icon: '🌾',
    possibleNames: ['Green Pastures', 'Fertile Fields', 'Old Mill Farm', 'Hillside Ranch', 'River Valley Crops'],
    possibleOwners: ['Farmer Family', 'Land Baron', 'Commune Workers', 'Elderly Couple', 'Homesteader'],
    possibleWares: [
      { wareId: 'grain', probability: 0.8 },
      { wareId: 'vegetables', probability: 0.7 },
      { wareId: 'milk', probability: 0.6 },
      { wareId: 'eggs', probability: 0.6 }
    ]
  },
  {
    id: 'temple',
    name: 'Temple',
    description: 'A place of worship and spiritual guidance',
    icon: '⛪',
    possibleNames: ['Temple of Light', 'Sacred Grove', 'Divine Sanctuary', 'House of the Eternal', 'Hallowed Halls'],
    possibleOwners: ['High Priest', 'Cleric', 'Religious Order', 'Hermit Sage', 'Devout Family'],
    possibleWares: [
      { wareId: 'holySymbol', probability: 0.8 },
      { wareId: 'incense', probability: 0.7 },
      { wareId: 'healingPotion', probability: 0.5 }
    ]
  },
  {
    id: 'bakery',
    name: 'Bakery',
    description: 'A shop that makes and sells bread and pastries',
    icon: '🍞',
    possibleNames: ['Golden Crust', 'Sweet Rolls', 'The Flour Mill', 'Morning Bread', 'Hearth & Home'],
    possibleOwners: ['Baker Family', 'Master Baker', 'Former Chef', 'Elderly Woman', 'Guild Apprentice'],
    possibleWares: [
      { wareId: 'bread', probability: 0.9 },
      { wareId: 'pastry', probability: 0.7 },
      { wareId: 'cake', probability: 0.5 }
    ]
  },
  {
    id: 'butcher',
    name: 'Butcher',
    description: 'A shop that prepares and sells meat',
    icon: '🥩',
    possibleNames: ['Prime Cuts', 'The Cleaver', 'Fresh Meats', 'Hunter\'s Bounty', 'The Smoking Rack'],
    possibleOwners: ['Butcher Family', 'Gruff Man', 'Hunter', 'Former Soldier', 'Guild Member'],
    possibleWares: [
      { wareId: 'beef', probability: 0.8 },
      { wareId: 'pork', probability: 0.7 },
      { wareId: 'poultry', probability: 0.7 },
      { wareId: 'sausage', probability: 0.6 }
    ]
  }
];