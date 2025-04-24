import { EconomyFactor } from '../models/interfaces';

export const DEFAULT_ECONOMY_FACTORS: EconomyFactor[] = [
  {
    id: 'prosperity',
    name: 'Prosperity',
    description: 'The general economic wellbeing of the settlement',
    waresModifiers: {
      'ale': 0.2,
      'wine': 0.3,
      'meal': 0.1,
      'sword': 0.5,
      'armor': 0.6,
      'tools': 0.2,
      'rope': 0.1,
      'lantern': 0.2,
      'backpack': 0.3,
      'bread': 0.1,
      'pastry': 0.3,
      'beef': 0.4,
      'grain': 0.1,
      'vegetables': 0.1,
      'holySymbol': 0.5
    }
  },
  {
    id: 'tradeRoute',
    name: 'Trade Route',
    description: 'Whether the settlement is on a major trade route',
    waresModifiers: {
      'ale': -0.1,
      'wine': -0.2,
      'meal': -0.05,
      'sword': -0.2,
      'armor': -0.3,
      'tools': -0.1,
      'rope': -0.05,
      'lantern': -0.1,
      'backpack': -0.15,
      'exotic': -0.4,
      'spices': -0.3,
      'silk': -0.3,
      'jewelry': -0.2
    }
  },
  {
    id: 'resourceScarcity',
    name: 'Resource Scarcity',
    description: 'The availability of natural resources in the region',
    waresModifiers: {
      'wood': 0.3,
      'stone': 0.3,
      'metal': 0.4,
      'tools': 0.2,
      'furniture': 0.2,
      'weapons': 0.3,
      'armor': 0.3
    }
  },
  {
    id: 'seasonalHarvest',
    name: 'Seasonal Harvest',
    description: 'The impact of recent harvests on food prices',
    waresModifiers: {
      'grain': -0.3,
      'vegetables': -0.3,
      'fruit': -0.3,
      'bread': -0.2,
      'pastry': -0.2,
      'meal': -0.1,
      'ale': -0.1
    }
  }
];