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
     * Assigns positions to buildings in the city layout, avoiding water features
     */
    assignBuildingPositions(buildings: Building[], layout: CityLayout, districts: District[]) {
      // Create a grid to track occupied positions and water features
      const grid: number[][] = Array(layout.height).fill(0).map(() => Array(layout.width).fill(0));
      
      // Legend for grid values:
      // 0 = empty
      // 1 = road
      // 2 = water
      // 3 = building
      
      // Mark water positions
      layout.waterFeatures.forEach(feature => {
        // Create a waterMap using polygons for lakes and paths for rivers
        const waterMap = this.createWaterMap(layout.width, layout.height, [feature]);
        
        for (let y = 0; y < layout.height; y++) {
          for (let x = 0; x < layout.width; x++) {
            if (waterMap[y] && waterMap[y][x]) {
              grid[y][x] = 2; // Water
            }
          }
        }
      });
      
      // Mark road positions (use a width to create a buffer around roads)
      layout.roads.forEach(road => {
        const roadWidth = 5; // Width of road plus buffer zone
        
        // Mark points along each road segment
        const dx = road.end.x - road.start.x;
        const dy = road.end.y - road.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(length * 2, 20); // Ensure enough density
        
        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const x = Math.floor(road.start.x + dx * t);
          const y = Math.floor(road.start.y + dy * t);
          
          // Mark road and buffer zone
          for (let offsetY = -roadWidth/2; offsetY <= roadWidth/2; offsetY++) {
            for (let offsetX = -roadWidth/2; offsetX <= roadWidth/2; offsetX++) {
              const markX = x + offsetX;
              const markY = y + offsetY;
              
              if (markY >= 0 && markY < layout.height && 
                  markX >= 0 && markX < layout.width) {
                // Only mark as road if not already water
                if (grid[markY][markX] !== 2) {
                  grid[markY][markX] = 1; // Road
                }
              }
            }
          }
        }
      });
      
      // Group buildings by type for better placement
      const buildingsByType: {[type: string]: Building[]} = {};
      buildings.forEach(building => {
        if (!buildingsByType[building.typeId]) {
          buildingsByType[building.typeId] = [];
        }
        buildingsByType[building.typeId].push(building);
      });
      
      // Create an array of road adjacent positions for placing buildings
      const roadAdjacentPositions: {x: number, y: number}[] = [];
      for (let y = 0; y < layout.height; y++) {
        for (let x = 0; x < layout.width; x++) {
          // If this position is empty and adjacent to a road
          if (grid[y][x] === 0 && this.isAdjacentToRoad(x, y, grid)) {
            roadAdjacentPositions.push({x, y});
          }
        }
      }
      
      // Shuffle road-adjacent positions to ensure random distribution
      this.shuffleArray(roadAdjacentPositions);
      
      // First place important buildings (non-residences) along roads
      const importantBuildings = buildings.filter(b => b.typeId !== 'residence');
      
      for (let i = 0; i < importantBuildings.length; i++) {
        const building = importantBuildings[i];
        
        // Try to find a road-adjacent spot
        let placed = false;
        
        // Look through road-adjacent positions
        for (let j = 0; j < roadAdjacentPositions.length; j++) {
          const pos = roadAdjacentPositions[j];
          
          // Check if position is empty and not in water
          if (grid[pos.y][pos.x] === 0) {
            building.position = { x: pos.x, y: pos.y };
            grid[pos.y][pos.x] = 3; // Mark as building
            placed = true;
            
            // Remove this position from available spots
            roadAdjacentPositions.splice(j, 1);
            break;
          }
        }
        
        // If no road-adjacent spot found, try to place near district centers
        if (!placed) {
          this.placeBuildingNearDistrict(building, grid, districts, layout);
        }
        
        // If still not placed, find any available spot
        if (building.position.x === 0 && building.position.y === 0) {
          this.findAvailableSpot(building, grid, layout);
        }
      }
      
      // Now place residences
      const residences = buildings.filter(b => b.typeId === 'residence');
      
      for (let i = 0; i < residences.length; i++) {
        const building = residences[i];
        
        // Try to find a spot using remaining road-adjacent positions first
        let placed = false;
        
        if (roadAdjacentPositions.length > 0) {
          const pos = roadAdjacentPositions.pop()!;
          
          // Check if position is empty and not in water
          if (grid[pos.y][pos.x] === 0) {
            building.position = { x: pos.x, y: pos.y };
            grid[pos.y][pos.x] = 3; // Mark as building
            placed = true;
          }
        }
        
        // If no road-adjacent spot available, place near other buildings
        if (!placed) {
          placed = this.placeBuildingNearOtherBuildings(building, grid, layout);
        }
        
        // If still not placed, try near district centers
        if (!placed) {
          placed = this.placeBuildingNearDistrict(building, grid, districts, layout);
        }
        
        // If still not placed, find any available spot
        if (!placed) {
          this.findAvailableSpot(building, grid, layout);
        }
      }
    }
  
    /**
     * Check if a position is adjacent to a road
     */
    private isAdjacentToRoad(x: number, y: number, grid: number[][]): boolean {
      const height = grid.length;
      const width = grid[0].length;
      
      // Check all 8 adjacent positions
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue; // Skip center
          
          const checkX = x + dx;
          const checkY = y + dy;
          
          if (checkY >= 0 && checkY < height && checkX >= 0 && checkX < width) {
            if (grid[checkY][checkX] === 1) { // Road
              return true;
            }
          }
        }
      }
      
      return false;
    }
  
    /**
     * Try to place a building near other buildings
     */
    private placeBuildingNearOtherBuildings(building: Building, grid: number[][], layout: CityLayout): boolean {
      const maxDistance = 10; // Maximum distance to search
      
      for (let distance = 1; distance <= maxDistance; distance++) {
        // Find all positions at this distance that have a building nearby
        const candidates: {x: number, y: number}[] = [];
        
        for (let y = 0; y < layout.height; y++) {
          for (let x = 0; x < layout.width; x++) {
            // Skip positions that aren't empty
            if (grid[y][x] !== 0) continue;
            
            // Check if there's a building nearby
            if (this.hasBuildingWithinDistance(x, y, grid, distance)) {
              candidates.push({x, y});
            }
          }
        }
        
        // If we found candidates, pick one randomly
        if (candidates.length > 0) {
          const index = Math.floor(Math.random() * candidates.length);
          const pos = candidates[index];
          
          building.position = { x: pos.x, y: pos.y };
          grid[pos.y][pos.x] = 3; // Mark as building
          return true;
        }
      }
      
      return false;
    }
  
    /**
     * Check if there's a building within a certain distance
     */
    private hasBuildingWithinDistance(x: number, y: number, grid: number[][], distance: number): boolean {
      const height = grid.length;
      const width = grid[0].length;
      
      // Search in a square around the position
      for (let dy = -distance; dy <= distance; dy++) {
        for (let dx = -distance; dx <= distance; dx++) {
          const checkX = x + dx;
          const checkY = y + dy;
          
          if (checkY >= 0 && checkY < height && checkX >= 0 && checkX < width) {
            if (grid[checkY][checkX] === 3) { // Building
              return true;
            }
          }
        }
      }
      
      return false;
    }
  
    /**
     * Try to place a building near a district center
     */
    private placeBuildingNearDistrict(
      building: Building, 
      grid: number[][], 
      districts: District[], 
      layout: CityLayout
    ): boolean {
      // Find the closest district
      if (districts.length === 0) return false;
      
      // Try each district in random order
      const districtIndices = Array.from(Array(districts.length).keys());
      this.shuffleArray(districtIndices);
      
      for (const i of districtIndices) {
        if (i >= districts.length) continue; // Safety check
        
        const district = districts[i];
        
        // Try positions in a spiral pattern around the district center
        let angle = Math.random() * Math.PI * 2; // Start at random angle
        let distance = 5; // Start close to center
        let placed = false;
        
        // Ensure district has valid coordinates
        if (district.x < 0 || district.y < 0) continue;
        
        while (distance < district.radius && !placed) {
          // Calculate position
          const x = Math.floor(district.x + Math.cos(angle) * distance);
          const y = Math.floor(district.y + Math.sin(angle) * distance);
          
          // Check if position is valid
          if (x >= 0 && x < layout.width && y >= 0 && y < layout.height) {
            if (grid[y][x] === 0) { // Empty spot
              building.position = { x, y };
              grid[y][x] = 3; // Mark as building
              placed = true;
              return true;
            }
          }
          
          // Move along spiral
          angle += Math.PI / 4;
          if (angle >= Math.PI * 2) {
            angle = 0;
            distance += 5;
          }
        }
      }
      
      return false;
    }
  
    /**
     * Finds any available spot for a building
     */
    private findAvailableSpot(building: Building, grid: number[][], layout: CityLayout): boolean {
      // First try to find any empty spot
      for (let attempts = 0; attempts < 200; attempts++) {
        const x = Math.floor(Math.random() * layout.width);
        const y = Math.floor(Math.random() * layout.height);
        
        if (y < grid.length && x < grid[0].length && grid[y][x] === 0) { // Empty spot
          building.position = { x, y };
          grid[y][x] = 3; // Mark as building
          return true;
        }
      }
      
      // As a last resort, place at a random position (might be in water, but better than 0,0)
      const x = Math.floor(Math.random() * layout.width);
      const y = Math.floor(Math.random() * layout.height);
      
      building.position = { x, y };
      // Don't mark grid since this might overlap
      
      return true;
    }
  
    /**
     * Utility function to shuffle an array
     */
    private shuffleArray<T>(array: T[]): void {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
  
    /**
     * Create a water map for a specific feature
     */
    private createWaterMap(width: number, height: number, waterFeatures: { type: string; points: { x: number; y: number; }[]; }[]): boolean[][] {
      // Create a 2D array filled with false
      const waterMap: boolean[][] = Array(height)
        .fill(false)
        .map(() => Array(width).fill(false));
      
      // Mark water features
      waterFeatures.forEach(feature => {
        if (feature.type === 'lake') {
          // For lakes, fill in the polygon
          this.fillPolygon(waterMap, feature.points);
        } else if (feature.type === 'river') {
          // For rivers, mark a path with some width
          this.markPath(waterMap, feature.points, 10); // 10px width for rivers
        }
      });
      
      return waterMap;
    }
  
    /**
     * Fill a polygon shape in the water map
     */
    private fillPolygon(waterMap: boolean[][], points: {x: number, y: number}[]): void {
      // Find the bounding box
      let minX = Number.MAX_VALUE;
      let minY = Number.MAX_VALUE;
      let maxX = 0;
      let maxY = 0;
      
      points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
      
      // Constrain to map bounds
      minX = Math.max(0, Math.floor(minX));
      minY = Math.max(0, Math.floor(minY));
      maxX = Math.min(waterMap[0].length - 1, Math.floor(maxX));
      maxY = Math.min(waterMap.length - 1, Math.floor(maxY));
      
      // For each point in the bounding box, check if it's in the polygon
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (this.pointInPolygon(x, y, points)) {
            waterMap[y][x] = true;
          }
        }
      }
    }
  
    /**
     * Check if a point is inside a polygon using ray casting algorithm
     */
    private pointInPolygon(x: number, y: number, polygon: {x: number, y: number}[]): boolean {
      let inside = false;
      
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > y) !== (yj > y)) && 
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          
        if (intersect) inside = !inside;
      }
      
      return inside;
    }
  
    /**
     * Mark a path in the water map with a given width
     */
    private markPath(waterMap: boolean[][], points: {x: number, y: number}[], width: number): void {
      // For each segment in the path
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        
        // Calculate line parameters
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Mark points along the line
        const steps = Math.max(length * 2, 10); // Ensure enough density of points
        
        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const x = Math.floor(p1.x + dx * t);
          const y = Math.floor(p1.y + dy * t);
          
          // Mark points in a circle around this point
          for (let offsetY = -width/2; offsetY <= width/2; offsetY++) {
            for (let offsetX = -width/2; offsetX <= width/2; offsetX++) {
              // Check if within circle
              if (offsetX * offsetX + offsetY * offsetY <= (width/2) * (width/2)) {
                const markX = x + offsetX;
                const markY = y + offsetY;
                
                // Check bounds
                if (markY >= 0 && markY < waterMap.length && 
                    markX >= 0 && markX < waterMap[0].length) {
                  waterMap[markY][markX] = true;
                }
              }
            }
          }
        }
      }
    }
  }