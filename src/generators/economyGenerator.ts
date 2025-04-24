import { Building, Economy, EconomyFactor } from '../models/interfaces';

export class EconomyGenerator {
  private economyFactors: EconomyFactor[];

  constructor(economyFactors: EconomyFactor[]) {
    this.economyFactors = economyFactors;
  }

  /**
   * Generates economy data for a city based on its buildings
   */
  generateEconomy(buildings: Building[]): Economy {
    // Calculate prosperity based on building types
    const prosperityByBuildingType: { [type: string]: number } = {
      'residence': 0.5,
      'tavern': 1.0,
      'blacksmith': 1.5,
      'generalStore': 1.2,
      'temple': 1.3,
      'market': 2.0,
      'jeweler': 2.5,
      'farm': 0.8,
      'bakery': 1.1,
      'butcher': 1.2,
      'tailor': 1.3,
      'library': 1.8,
      'alchemist': 1.7
    };
    
    let prosperitySum = 0;
    let prosperityCount = 0;
    
    buildings.forEach(building => {
      const typeValue = prosperityByBuildingType[building.typeId];
      if (typeValue) {
        prosperitySum += typeValue;
        prosperityCount++;
      }
    });
    
    const prosperity = prosperityCount > 0 ? prosperitySum / prosperityCount : 1.0;
    
    // Determine main exports and imports
    const wareCountsByType: { [wareId: string]: number } = {};
    buildings.forEach(building => {
      building.wares.forEach(ware => {
        wareCountsByType[ware.id] = (wareCountsByType[ware.id] || 0) + 1;
      });
    });
    
    const waresEntries = Object.entries(wareCountsByType).sort((a, b) => b[1] - a[1]);
    const mainExports = waresEntries.slice(0, 3).map(entry => entry[0]);
    
    // Calculate imports (wares not commonly available)
    const allPossibleWares = new Set<string>();
    
    // Collect all possible wares from all buildings
    buildings.forEach(building => {
      building.wares.forEach(ware => {
        allPossibleWares.add(ware.id);
      });
    });
    
    const mainImports = Array.from(allPossibleWares)
      .filter(wareId => !wareCountsByType[wareId] || wareCountsByType[wareId] < 2)
      .slice(0, 3);
    
    // Generate price modifiers
    const priceModifiers: { [wareId: string]: number } = {};
    
    // Apply prosperity to base prices
    for (const wareId of allPossibleWares) {
      let modifier = 1.0;
      
      // More expensive in prosperous cities
      modifier *= (0.8 + (prosperity * 0.2));
      
      // Exports are cheaper
      if (mainExports.includes(wareId)) {
        modifier *= 0.8;
      }
      
      // Imports are more expensive
      if (mainImports.includes(wareId)) {
        modifier *= 1.2;
      }
      
      // Apply economy factors
      this.economyFactors.forEach(factor => {
        const factorModifier = factor.waresModifiers[wareId];
        if (factorModifier) {
          modifier += factorModifier;
        }
      });
      
      // Ensure modifier is within reasonable bounds
      modifier = Math.max(0.5, Math.min(modifier, 2.0));
      
      priceModifiers[wareId] = modifier;
    }
    
    return {
      prosperity,
      mainExports,
      mainImports,
      priceModifiers
    };
  }

  /**
   * Applies price modifiers to wares in buildings
   */
  applyEconomyToBuildings(buildings: Building[], economy: Economy): void {
    buildings.forEach(building => {
      building.wares.forEach(ware => {
        const modifier = economy.priceModifiers[ware.id];
        if (modifier) {
          ware.currentPrice = Math.round(ware.basePrice * modifier);
        }
      });
    });
  }
}