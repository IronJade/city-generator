import { 
    Building, 
    BuildingType, 
    CityLayout, 
    Ware, 
    District 
  } from '../models/interfaces';
  import { WARES_DATABASE } from '../data/wareTypes';
  
  export class BuildingGenerator {
    private buildingTypes: BuildingType[];
  
    constructor(buildingTypes: BuildingType[]) {
      this.buildingTypes = buildingTypes;
    }
  
    /**
     * Generates a building of the specified type
     */
    generateBuilding(buildingType: BuildingType): Building {
      // Generate a unique ID
      const buildingId = `building_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Select a random name from possible names
      const nameIndex = Math.floor(Math.random() * buildingType.possibleNames.length);
      const name = buildingType.possibleNames[nameIndex];
      
      // Select a random owner from possible owners
      const ownerIndex = Math.floor(Math.random() * buildingType.possibleOwners.length);
      const owner = buildingType.possibleOwners[ownerIndex];
      
      // Generate wares based on probabilities
      const wares: Ware[] = [];
      buildingType.possibleWares.forEach(wareProb => {
        if (Math.random() < wareProb.probability) {
          const ware = this.generateWare(wareProb.wareId);
          if (ware) {
            wares.push(ware);
          }
        }
      });
      
      // Create the building object
      const building: Building = {
        id: buildingId,
        typeId: buildingType.id,
        name: name,
        owner: owner,
        wares: wares,
        position: { x: 0, y: 0 } // Will be assigned later
      };
      
      return building;
    }
  
    /**
     * Generates a ware item with random quality and quantity
     */
    generateWare(wareId: string): Ware | null {
      const wareTemplate = WARES_DATABASE[wareId];
      if (!wareTemplate) {
        return null;
      }
      
      // Generate a quantity
      const quantity = Math.floor(Math.random() * 10) + 1;
      
      // Generate quality
      const qualities = ['Poor', 'Common', 'Good', 'Excellent', 'Masterwork'];
      const qualityIndex = Math.floor(Math.random() * qualities.length);
      const quality = qualities[qualityIndex];
      
      // Modify price based on quality
      const qualityModifier = 0.8 + (qualityIndex * 0.2);
      const currentPrice = Math.round(wareTemplate.basePrice * qualityModifier);
      
      // Create the ware object
      const ware: Ware = {
        id: wareId,
        name: wareTemplate.name,
        basePrice: wareTemplate.basePrice,
        currentPrice: currentPrice,
        quantity: quantity,
        quality: quality,
        description: wareTemplate.description
      };
      
      return ware;
    }
  
    /**
     * Assigns positions to buildings in the city layout
     */
    assignBuildingPositions(buildings: Building[], layout: CityLayout, districts: District[]) {
      // Create a grid to track occupied positions
      const grid: boolean[][] = Array(layout.height).fill(false).map(() => Array(layout.width).fill(false));
      
      // Mark road positions as occupied
      layout.roads.forEach(road => {
        // Simplified line-drawing to mark approximate road positions
        const dx = road.end.x - road.start.x;
        const dy = road.end.y - road.start.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        
        for (let i = 0; i <= steps; i++) {
          const x = Math.floor(road.start.x + (dx * i / steps));
          const y = Math.floor(road.start.y + (dy * i / steps));
          
          if (x >= 0 && x < layout.width && y >= 0 && y < layout.height) {
            grid[y][x] = true;
          }
        }
      });
      
      // Mark water positions as occupied
      layout.waterFeatures.forEach(feature => {
        feature.points.forEach(point => {
          const x = Math.floor(point.x);
          const y = Math.floor(point.y);
          
          if (x >= 0 && x < layout.width && y >= 0 && y < layout.height) {
            grid[y][x] = true;
          }
        });
      });
      
      // Group buildings by type for better placement
      const buildingsByType: {[type: string]: Building[]} = {};
      buildings.forEach(building => {
        if (!buildingsByType[building.typeId]) {
          buildingsByType[building.typeId] = [];
        }
        buildingsByType[building.typeId].push(building);
      });
      
      // Assign buildings to districts
      districts.forEach((district, districtIndex) => {
        // Get buildings for this district
        const districtBuildings = buildings.filter((_, index) => 
          index % districts.length === districtIndex
        );
        
        // Place important buildings near center
        const importantBuildings = districtBuildings.filter(b => 
          b.typeId !== 'residence'
        );
        
        // Place residential buildings around them
        const residences = districtBuildings.filter(b => 
          b.typeId === 'residence'
        );
        
        // Place buildings in a spiral pattern from district center
        this.placeInSpiralPattern(importantBuildings, district, grid, 5, layout);
        this.placeInSpiralPattern(residences, district, grid, 15, layout);
      });
      
      // Check for any unplaced buildings and find spots for them
      buildings.forEach(building => {
        if (building.position.x === 0 && building.position.y === 0) {
          this.findAvailableSpot(building, grid, layout);
        }
      });
    }
  
    /**
     * Places buildings in a spiral pattern around a center point
     */
    private placeInSpiralPattern(
      buildings: Building[], 
      center: {x: number, y: number}, 
      grid: boolean[][], 
      startDistance: number, 
      layout: CityLayout
    ) {
      let distance = startDistance;
      let angle = 0;
      
      buildings.forEach(building => {
        let placed = false;
        
        while (!placed && distance < center.radius) {
          const x = Math.floor(center.x + Math.cos(angle) * distance);
          const y = Math.floor(center.y + Math.sin(angle) * distance);
          
          if (x >= 0 && x < layout.width && y >= 0 && y < layout.height && !grid[y][x]) {
            building.position = { x, y };
            grid[y][x] = true;
            placed = true;
          }
          
          angle += Math.PI / 4;
          if (angle >= Math.PI * 2) {
            angle = 0;
            distance += 5;
          }
        }
        
        // If still not placed, find any available spot
        if (!placed) {
          this.findAvailableSpot(building, grid, layout);
        }
      });
    }
  
    /**
     * Finds an available spot for a building
     */
    private findAvailableSpot(building: Building, grid: boolean[][], layout: CityLayout) {
      let attempts = 0;
      let placed = false;
      
      while (!placed && attempts < 200) {
        const x = Math.floor(Math.random() * layout.width);
        const y = Math.floor(Math.random() * layout.height);
        
        if (x >= 0 && x < layout.width && y >= 0 && y < layout.height && !grid[y][x]) {
          building.position = { x, y };
          grid[y][x] = true;
          placed = true;
        }
        
        attempts++;
      }
      
      // Last resort
      if (!placed) {
        building.position = {
          x: Math.floor(Math.random() * layout.width),
          y: Math.floor(Math.random() * layout.height)
        };
      }
    }
  }