import { SettlementType } from '../models/interfaces';

export const DEFAULT_SETTLEMENT_TYPES: SettlementType[] = [
  {
    id: 'village',
    name: 'Village',
    minPopulation: 50,
    maxPopulation: 500,
    minBuildings: 5,
    maxBuildings: 20,
    buildingDistribution: {
      'residence': 60,
      'tavern': 10,
      'blacksmith': 10,
      'generalStore': 10,
      'farm': 10
    }
  },
  {
    id: 'town',
    name: 'Town',
    minPopulation: 500,
    maxPopulation: 5000,
    minBuildings: 20,
    maxBuildings: 100,
    buildingDistribution: {
      'residence': 50,
      'tavern': 10,
      'blacksmith': 5,
      'generalStore': 5,
      'tailor': 5,
      'temple': 5,
      'townHall': 5,
      'farm': 5,
      'bakery': 5,
      'butcher': 5
    }
  },
  {
    id: 'city',
    name: 'City',
    minPopulation: 5000,
    maxPopulation: 50000,
    minBuildings: 100,
    maxBuildings: 500,
    buildingDistribution: {
      'residence': 40,
      'tavern': 5,
      'blacksmith': 5,
      'generalStore': 5,
      'tailor': 5,
      'temple': 5,
      'cityHall': 5,
      'market': 5,
      'bakery': 5,
      'butcher': 5,
      'jeweler': 5,
      'library': 5,
      'alchemist': 5
    }
  }
];