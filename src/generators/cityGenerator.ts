import { 
    City, 
    SettlementType, 
    Building, 
    BuildingType, 
    CityLayout,
    MapSettings,
    EconomyFactor
  } from '../models/interfaces';
  import { BuildingGenerator } from './buildingGenerator';
  import { LayoutGenerator } from './layoutGenerator';
  import { EconomyGenerator } from './economyGenerator';
  import { NameGenerator } from './nameGenerator';
  
  export class CityGenerator {
    private settlementTypes: SettlementType[];
    private buildingTypes: BuildingType[];
    private economyFactors: EconomyFactor[];
    private mapSettings: MapSettings;
    
    private buildingGenerator: BuildingGenerator;
    private layoutGenerator: LayoutGenerator;
    private economyGenerator: EconomyGenerator;
    private nameGenerator: NameGenerator;
  
    constructor(
      settlementTypes: SettlementType[],
      buildingTypes: BuildingType[],
      economyFactors: EconomyFactor[],
      mapSettings: MapSettings
    ) {
      this.settlementTypes = settlementTypes;
      this.buildingTypes = buildingTypes;
      this.economyFactors = economyFactors;
      this.mapSettings = mapSettings;
      
      this.buildingGenerator = new BuildingGenerator(buildingTypes);
      this.layoutGenerator = new LayoutGenerator(mapSettings);
      this.economyGenerator = new EconomyGenerator(economyFactors);
      this.nameGenerator = new NameGenerator();
    }
  
    /**
     * Generates a city with the given type and name
     */
    generateCity(type: string, name: string): City {
      const settlementType = this.settlementTypes.find(t => t.id === type);
      if (!settlementType) {
        throw new Error(`Settlement type ${type} not found`);
      }
  
      // Generate a unique ID
      const cityId = `city_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Generate population
      const population = Math.floor(
        Math.random() * (settlementType.maxPopulation - settlementType.minPopulation) + 
        settlementType.minPopulation
      );
      
      // Determine number of buildings
      const buildingCount = Math.floor(
        Math.random() * (settlementType.maxBuildings - settlementType.minBuildings) + 
        settlementType.minBuildings
      );
      
      // Generate buildings
      const buildings: Building[] = [];
      for (let i = 0; i < buildingCount; i++) {
        // Determine building type based on distribution
        const buildingTypeId = this.determineRandomBuildingType(settlementType.buildingDistribution);
        const buildingType = this.buildingTypes.find(t => t.id === buildingTypeId);
        
        if (buildingType) {
          // Generate a building of this type
          const building = this.buildingGenerator.generateBuilding(buildingType);
          buildings.push(building);
        }
      }
      
      // Generate city layout
      const layout = this.layoutGenerator.generateCityLayout(buildingCount);
      
      // Create districts for organized building placement
      const districts = this.layoutGenerator.createDistricts(buildingCount, layout);
      
      // Assign positions to buildings
      this.buildingGenerator.assignBuildingPositions(buildings, layout, districts);
      
      // Generate economy
      const economy = this.economyGenerator.generateEconomy(buildings);
      
      // Apply economy to building wares
      this.economyGenerator.applyEconomyToBuildings(buildings, economy);
      
      // Create the city object
      const city: City = {
        id: cityId,
        name: name,
        type: type,
        population: population,
        buildings: buildings,
        layout: layout,
        economy: economy,
        generatedDate: new Date().toISOString()
      };
      
      return city;
    }
  
    /**
     * Determines a random building type based on distribution
     */
    private determineRandomBuildingType(distribution: { [id: string]: number }): string {
      // Convert distribution to array of ranges
      const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
      let currentSum = 0;
      const ranges: { id: string, min: number, max: number }[] = [];
      
      for (const [id, value] of Object.entries(distribution)) {
        const normalizedValue = value / total;
        ranges.push({
          id: id,
          min: currentSum,
          max: currentSum + normalizedValue
        });
        currentSum += normalizedValue;
      }
      
      // Generate random number and find corresponding building type
      const random = Math.random();
      const selectedRange = ranges.find(range => random >= range.min && random < range.max);
      
      return selectedRange ? selectedRange.id : Object.keys(distribution)[0];
    }
  
    /**
     * Exports city data to JSON
     */
    exportCityToJson(city: City): string {
      return JSON.stringify(city, null, 2);
    }
  
    /**
     * Imports city from JSON
     */
    importCityFromJson(json: string): City {
      try {
        const city = JSON.parse(json) as City;
        return city;
      } catch (error) {
        console.error('Failed to parse city JSON', error);
        throw new Error('Invalid city JSON format');
      }
    }
  
    /**
     * Generates a random city name
     */
    generateRandomCityName(type: string = 'town'): string {
      return this.nameGenerator.generateThemedName(type);
    }
  }