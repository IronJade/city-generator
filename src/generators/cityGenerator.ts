// src/generators/cityGenerator.ts

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
  import { MapGenerator } from './mapGenerator';
  import { EconomyGenerator } from './economyGenerator';
  import { NameGenerator } from './nameGenerator';
  import { SvgRenderer } from '../renderers/svgRenderer';
  
  export class CityGenerator {
    private settlementTypes: SettlementType[];
    private buildingTypes: BuildingType[];
    private economyFactors: EconomyFactor[];
    private mapSettings: MapSettings;
    
    private buildingGenerator: BuildingGenerator;
    private mapGenerator: MapGenerator;
    private economyGenerator: EconomyGenerator;
    private nameGenerator: NameGenerator;
    private svgRenderer: SvgRenderer;
  
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
      this.mapGenerator = new MapGenerator(mapSettings);
      this.economyGenerator = new EconomyGenerator(economyFactors);
      this.nameGenerator = new NameGenerator();
      this.svgRenderer = new SvgRenderer();
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
      
      // Generate city layout first
      const layout = this.mapGenerator.generateCityLayout(buildingCount, type);
      
      // Create districts for organized building placement
      const districts = this.mapGenerator.createDistricts(buildingCount, layout, type);
      
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
  
    /**
     * Renders a city map as SVG
     */
    renderCityMapSvg(city: City): string {
      return this.svgRenderer.generateCityMapSvg(city, this.buildingTypes);
    }
  
    /**
     * Renders a complete city to markdown
     */
    async renderCityToMarkdown(city: City): Promise<string> {
      // Create the city map SVG
      const mapSvg = this.renderCityMapSvg(city);
      
      // Generate buildings information
      const buildingsInfo = city.buildings.map(building => {
        const buildingType = this.buildingTypes.find(t => t.id === building.typeId);
        const icon = buildingType ? buildingType.icon : '🏢';
        
        let info = `### ${icon} ${building.name}\n`;
        info += `**Owner:** ${building.owner}\n`;
        
        if (buildingType) {
          info += `**Type:** ${buildingType.name}\n`;
          info += `**Description:** ${buildingType.description}\n`;
        }
        
        if (building.wares.length > 0) {
          info += `\n#### Wares:\n`;
          info += `| Item | Quality | Price | Quantity |\n`;
          info += `| ---- | ------- | ----- | -------- |\n`;
          
          building.wares.forEach(ware => {
            info += `| ${ware.name} | ${ware.quality} | ${ware.currentPrice} gp | ${ware.quantity} |\n`;
          });
        }
        
        return info;
      }).join('\n\n');
      
      // Generate economy overview
      const economyInfo = `## Economy\n\n` +
        `**Prosperity:** ${city.economy.prosperity.toFixed(1)}\n\n` +
        `**Main Exports:** ${city.economy.mainExports.join(', ')}\n\n` +
        `**Main Imports:** ${city.economy.mainImports.join(', ')}\n\n`;
      
      // Generate final markdown
      const markdown = `# ${city.name}\n\n` +
        `*A ${city.type} of ${city.population} residents*\n\n` +
        `*Generated: ${new Date(city.generatedDate).toLocaleDateString()}*\n\n` +
        `## Map\n\n` +
        `\`\`\`svg\n${mapSvg}\n\`\`\`\n\n` +
        `${economyInfo}\n\n` +
        `## Buildings\n\n` +
        `${buildingsInfo}\n\n` +
        `---\n\n` +
        `*Generated with City Generator plugin for Obsidian*\n\n`;
        // `\`\`\`json\n${this.exportCityToJson(city)}\n\`\`\``;
      
      return markdown;
    }
  }