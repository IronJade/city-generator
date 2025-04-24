// src/generators/buildingGenerator.ts

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
      // Generate a unique ID with timestamp + random number
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
    assignBuildingPositions(buildings: Building[], layout: CityLayout, districts: District[]): void {
      // Create a grid to track occupied positions
      const grid: boolean[][] = Array(layout.height).fill(false).map(() => Array(layout.width).fill(false));
      
      // Mark road positions as occupied with some buffer
      layout.roads.forEach(road => {
        this.markRoadOnGrid(road, grid, 5); // 5 pixel buffer
      });
      
      // Mark water positions as occupied
      layout.waterFeatures.forEach(feature => {
        feature.points.forEach(point => {
          const x = Math.floor(point.x);
          const y = Math.floor(point.y);
          
          if (this.isValidPosition(x, y, layout)) {
            grid[y][x] = true;
            
            // Add buffer around water
            for (let dx = -5; dx <= 5; dx++) {
              for (let dy = -5; dy <= 5; dy++) {
                const nx = x + dx;
                const ny = y + dy;
                if (this.isValidPosition(nx, ny, layout)) {
                  grid[ny][nx] = true;
                }
              }
            }
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
      
      // Create an array of road segments for building placement
      const roadSegments = this.generateRoadSegments(layout.roads);
      
      // Place important buildings first
      const importantBuildings = buildings.filter(b => 
        ['townHall', 'cityHall', 'temple', 'market', 'tavern'].includes(b.typeId)
      );
      
      const commercialBuildings = buildings.filter(b => 
        ['blacksmith', 'generalStore', 'bakery', 'butcher', 'tailor', 'jeweler', 'alchemist', 'library'].includes(b.typeId) &&
        !importantBuildings.includes(b)
      );
      
      const residentialBuildings = buildings.filter(b => 
        b.typeId === 'residence'
      );
      
      const farmBuildings = buildings.filter(b => 
        b.typeId === 'farm'
      );
      
      // Place important buildings at intersections or district centers
      this.placeImportantBuildings(importantBuildings, grid, layout, districts);
      
      // Place commercial buildings along main roads
      this.placeCommercialBuildings(commercialBuildings, grid, layout, roadSegments);
      
      // Place residential buildings in clusters around important buildings
      this.placeResidentialBuildings(residentialBuildings, grid, layout, districts, importantBuildings);
      
      // Place farms at the outskirts
      this.placeFarmBuildings(farmBuildings, grid, layout);
      
      // Check for any unplaced buildings and find spots for them
      buildings.forEach(building => {
        if (building.position.x === 0 && building.position.y === 0) {
          this.findAvailableSpot(building, grid, layout);
        }
      });
    }
  
    /**
     * Places important buildings at intersections or district centers
     */
    private placeImportantBuildings(
      buildings: Building[], 
      grid: boolean[][], 
      layout: CityLayout, 
      districts: District[]
    ): void {
      if (buildings.length === 0) return;
      
      // Find road intersections
      const intersections = this.findRoadIntersections(layout.roads);
      
      // Combine intersections and district centers as placement points
      const placementPoints = [
        ...intersections,
        ...districts.map(d => ({ x: d.x, y: d.y }))
      ];
      
      // Place each important building
      buildings.forEach(building => {
        if (placementPoints.length > 0) {
          // Find the best placement point
          const pointIndex = Math.floor(Math.random() * placementPoints.length);
          const point = placementPoints[pointIndex];
          
          // Try to find a spot near the chosen point
          let placed = false;
          const searchRadius = 30;
          
          for (let radius = 10; radius <= searchRadius && !placed; radius += 5) {
            for (let angle = 0; angle < Math.PI * 2 && !placed; angle += Math.PI / 8) {
              const x = Math.floor(point.x + Math.cos(angle) * radius);
              const y = Math.floor(point.y + Math.sin(angle) * radius);
              
              if (this.isValidPosition(x, y, layout) && !grid[y][x]) {
                building.position = { x, y };
                this.markOccupied(x, y, grid, 10); // Mark with buffer
                placed = true;
                
                // Remove used point
                placementPoints.splice(pointIndex, 1);
              }
            }
          }
          
          // If still not placed, try any open spot near the point
          if (!placed) {
            this.findSpotNearPoint(building, point.x, point.y, 50, grid, layout);
          }
        } else {
          // If no placement points left, find any good spot
          this.findAvailableSpot(building, grid, layout);
        }
      });
    }
  
    /**
     * Places commercial buildings along main roads
     */
    private placeCommercialBuildings(
      buildings: Building[], 
      grid: boolean[][], 
      layout: CityLayout, 
      roadSegments: { start: { x: number, y: number }, end: { x: number, y: number } }[]
    ): void {
      if (buildings.length === 0 || roadSegments.length === 0) return;
      
      // Sort road segments by length (descending) to prefer main roads
      const sortedSegments = [...roadSegments].sort((a, b) => {
        const lengthA = Math.sqrt(
          Math.pow(a.end.x - a.start.x, 2) + Math.pow(a.end.y - a.start.y, 2)
        );
        const lengthB = Math.sqrt(
          Math.pow(b.end.x - b.start.x, 2) + Math.pow(b.end.y - b.start.y, 2)
        );
        return lengthB - lengthA;
      });
      
      // Main roads are the first third of sorted segments
      const mainRoads = sortedSegments.slice(0, Math.max(1, Math.floor(sortedSegments.length / 3)));
      
      // Place buildings along main roads
      buildings.forEach(building => {
        let placed = false;
        
        // Try main roads first
        for (const road of mainRoads) {
          if (placed) break;
          
          // Try different positions along the road
          for (let t = 0.1; t < 0.9; t += 0.1) {
            // Get position along road
            const roadX = road.start.x + (road.end.x - road.start.x) * t;
            const roadY = road.start.y + (road.end.y - road.start.y) * t;
            
            // Calculate perpendicular direction
            const roadDX = road.end.x - road.start.x;
            const roadDY = road.end.y - road.start.y;
            const length = Math.sqrt(roadDX * roadDX + roadDY * roadDY);
            
            if (length === 0) continue;
            
            const perpX = -roadDY / length;
            const perpY = roadDX / length;
            
            // Try both sides of the road
            for (const side of [-1, 1]) {
              if (placed) break;
              
              // Try different distances from the road
              for (let dist = 10; dist <= 30; dist += 5) {
                const x = Math.floor(roadX + perpX * dist * side);
                const y = Math.floor(roadY + perpY * dist * side);
                
                if (this.isValidPosition(x, y, layout) && !grid[y][x]) {
                  building.position = { x, y };
                  this.markOccupied(x, y, grid, 10);
                  placed = true;
                  break;
                }
              }
            }
            
            if (placed) break;
          }
        }
        
        // If not placed, try secondary roads
        if (!placed) {
          for (const road of sortedSegments.slice(mainRoads.length)) {
            if (placed) break;
            
            // Similar approach as main roads but with fewer attempts
            for (let t = 0.2; t < 0.8; t += 0.2) {
              const roadX = road.start.x + (road.end.x - road.start.x) * t;
              const roadY = road.start.y + (road.end.y - road.start.y) * t;
              
              const roadDX = road.end.x - road.start.x;
              const roadDY = road.end.y - road.start.y;
              const length = Math.sqrt(roadDX * roadDX + roadDY * roadDY);
              
              if (length === 0) continue;
              
              const perpX = -roadDY / length;
              const perpY = roadDX / length;
              
              for (const side of [-1, 1]) {
                if (placed) break;
                
                for (let dist = 10; dist <= 20; dist += 5) {
                  const x = Math.floor(roadX + perpX * dist * side);
                  const y = Math.floor(roadY + perpY * dist * side);
                  
                  if (this.isValidPosition(x, y, layout) && !grid[y][x]) {
                    building.position = { x, y };
                    this.markOccupied(x, y, grid, 10);
                    placed = true;
                    break;
                  }
                }
              }
              
              if (placed) break;
            }
          }
        }
        
        // If still not placed, find any good spot
        if (!placed) {
          this.findAvailableSpot(building, grid, layout);
        }
      });
    }
  
    /**
     * Places residential buildings in clusters around important buildings or in districts
     */
    private placeResidentialBuildings(
      buildings: Building[], 
      grid: boolean[][], 
      layout: CityLayout, 
      districts: District[],
      importantBuildings: Building[]
    ): void {
      if (buildings.length === 0) return;
      
      // Group buildings into clusters for each district
      const buildingsPerDistrict = Math.ceil(buildings.length / Math.max(1, districts.length));
      const buildingGroups: Building[][] = [];
      
      for (let i = 0; i < districts.length; i++) {
        const start = i * buildingsPerDistrict;
        const end = Math.min(start + buildingsPerDistrict, buildings.length);
        
        if (start < end) {
          buildingGroups.push(buildings.slice(start, end));
        }
      }
      
      // If no districts, create one group
      if (buildingGroups.length === 0 && buildings.length > 0) {
        buildingGroups.push(buildings);
      }
      
      // Place each group in its district
      buildingGroups.forEach((group, index) => {
        const district = index < districts.length ? districts[index] : null;
        
        if (district) {
          // Place buildings in this district
          this.placeResidentialCluster(group, district.x, district.y, district.radius, grid, layout);
        } else {
          // If no district, place around important buildings if available
          if (importantBuildings.length > 0) {
            const targetBuilding = importantBuildings[index % importantBuildings.length];
            this.placeResidentialCluster(
              group, 
              targetBuilding.position.x, 
              targetBuilding.position.y, 
              50,
              grid,
              layout
            );
          } else {
            // Last resort: place randomly
            group.forEach(building => {
              this.findAvailableSpot(building, grid, layout);
            });
          }
        }
      });
    }
  
    /**
     * Places residential buildings in a cluster around a central point
     */
    private placeResidentialCluster(
      buildings: Building[],
      centerX: number,
      centerY: number,
      radius: number,
      grid: boolean[][],
      layout: CityLayout
    ): void {
      // Create positions in a rough grid pattern around the center
      const positions: { x: number, y: number }[] = [];
      const spacing = 20; // Distance between houses
      
      // Generate positions in a grid-like pattern
      for (let r = spacing; r <= radius; r += spacing) {
        const circumference = 2 * Math.PI * r;
        const pointCount = Math.floor(circumference / spacing);
        
        for (let i = 0; i < pointCount; i++) {
          const angle = (i / pointCount) * Math.PI * 2;
          
          // Add some randomness to avoid a perfect grid
          const jitter = Math.random() * 10 - 5;
          const jitterAngle = angle + (Math.random() * 0.2 - 0.1);
          
          const x = Math.floor(centerX + Math.cos(jitterAngle) * (r + jitter));
          const y = Math.floor(centerY + Math.sin(jitterAngle) * (r + jitter));
          
          if (this.isValidPosition(x, y, layout)) {
            positions.push({ x, y });
          }
        }
      }
      
      // Shuffle positions to avoid patterns
      this.shuffleArray(positions);
      
      // Place buildings at available positions
      buildings.forEach(building => {
        let placed = false;
        
        // Try available positions
        for (let i = 0; i < positions.length; i++) {
          const pos = positions[i];
          
          if (!grid[pos.y][pos.x]) {
            building.position = { x: pos.x, y: pos.y };
            this.markOccupied(pos.x, pos.y, grid, 8);
            placed = true;
            
            // Remove used position
            positions.splice(i, 1);
            break;
          }
        }
        
        // If no position found, look near the center
        if (!placed) {
          this.findSpotNearPoint(building, centerX, centerY, radius + 20, grid, layout);
        }
      });
    }
  
    /**
     * Places farm buildings at the outskirts of the settlement
     */
    private placeFarmBuildings(
      buildings: Building[],
      grid: boolean[][],
      layout: CityLayout
    ): void {
      if (buildings.length === 0) return;
      
      // Define the central area as the inner 50% of the map
      const centerX = layout.width / 2;
      const centerY = layout.height / 2;
      const innerWidth = layout.width * 0.5;
      const innerHeight = layout.height * 0.5;
      
      // Place farms in the outer regions
      buildings.forEach(building => {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 50) {
          // Generate a position outside the central area
          let x = 0, y = 0;
          
          const side = Math.floor(Math.random() * 4);
          switch (side) {
            case 0: // Top
              x = Math.floor(Math.random() * layout.width);
              y = Math.floor(Math.random() * (layout.height / 4));
              break;
            case 1: // Right
              x = Math.floor(layout.width * 3/4 + Math.random() * (layout.width / 4));
              y = Math.floor(Math.random() * layout.height);
              break;
            case 2: // Bottom
              x = Math.floor(Math.random() * layout.width);
              y = Math.floor(layout.height * 3/4 + Math.random() * (layout.height / 4));
              break;
            case 3: // Left
              x = Math.floor(Math.random() * (layout.width / 4));
              y = Math.floor(Math.random() * layout.height);
              break;
          }
          
          if (this.isValidPosition(x, y, layout) && !grid[y][x]) {
            building.position = { x, y };
            this.markOccupied(x, y, grid, 15); // Farms need more space
            placed = true;
          }
          
          attempts++;
        }
        
        // If still not placed, find any spot
        if (!placed) {
          this.findAvailableSpot(building, grid, layout);
        }
      });
    }
  
    /**
     * Finds an available spot near a specific point
     */
    private findSpotNearPoint(
      building: Building,
      centerX: number,
      centerY: number,
      maxRadius: number,
      grid: boolean[][],
      layout: CityLayout
    ): void {
      let placed = false;
      
      // Search in expanding circles
      for (let radius = 10; radius <= maxRadius && !placed; radius += 5) {
        // Try multiple angles at this radius
        for (let angle = 0; angle < Math.PI * 2 && !placed; angle += Math.PI / 8) {
          const x = Math.floor(centerX + Math.cos(angle) * radius);
          const y = Math.floor(centerY + Math.sin(angle) * radius);
          
          if (this.isValidPosition(x, y, layout) && !grid[y][x]) {
            building.position = { x, y };
            this.markOccupied(x, y, grid, 8);
            placed = true;
          }
        }
      }
      
      // If still not placed, try any available spot
      if (!placed) {
        this.findAvailableSpot(building, grid, layout);
      }
    }
  
    /**
     * Finds any available spot on the map
     */
    private findAvailableSpot(building: Building, grid: boolean[][], layout: CityLayout): void {
      let attempts = 0;
      let placed = false;
      
      // First try to find a spot near a road
      const roadSegments = this.generateRoadSegments(layout.roads);
      
      for (const road of roadSegments) {
        if (placed) break;
        
        // Try a few positions along the road
        for (let t = 0.1; t < 0.9 && !placed; t += 0.2) {
          const roadX = road.start.x + (road.end.x - road.start.x) * t;
          const roadY = road.start.y + (road.end.y - road.start.y) * t;
          
          // Try both sides of the road
          for (let dist = 10; dist <= 30 && !placed; dist += 10) {
            for (let angle = 0; angle < Math.PI * 2 && !placed; angle += Math.PI / 4) {
              const x = Math.floor(roadX + Math.cos(angle) * dist);
              const y = Math.floor(roadY + Math.sin(angle) * dist);
              
              if (this.isValidPosition(x, y, layout) && !grid[y][x]) {
                building.position = { x, y };
                this.markOccupied(x, y, grid, 8);
                placed = true;
              }
            }
          }
        }
      }
      
      // If still not placed, try random positions
      while (!placed && attempts < 200) {
        const x = Math.floor(Math.random() * layout.width);
        const y = Math.floor(Math.random() * layout.height);
        
        if (this.isValidPosition(x, y, layout) && !grid[y][x]) {
          building.position = { x, y };
          this.markOccupied(x, y, grid, 8);
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
  
    /**
     * Marks a road on the grid to prevent buildings from overlapping roads
     */
    private markRoadOnGrid(
      road: { start: { x: number, y: number }, end: { x: number, y: number } },
      grid: boolean[][],
      buffer: number
    ): void {
      // Use Bresenham's line algorithm to mark road pixels
      const x0 = Math.floor(road.start.x);
      const y0 = Math.floor(road.start.y);
      const x1 = Math.floor(road.end.x);
      const y1 = Math.floor(road.end.y);
      
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      
      let x = x0;
      let y = y0;
      
      const width = grid[0].length;
      const height = grid.length;
      
      while (true) {
        // Mark this point and buffer around it
        for (let bx = -buffer; bx <= buffer; bx++) {
          for (let by = -buffer; by <= buffer; by++) {
            const nx = x + bx;
            const ny = y + by;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              grid[ny][nx] = true;
            }
          }
        }
        
        if (x === x1 && y === y1) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x += sx;
        }
        if (e2 < dx) {
          err += dx;
          y += sy;
        }
      }
    }
  
    /**
     * Marks a position and surrounding area as occupied
     */
    private markOccupied(
      x: number,
      y: number,
      grid: boolean[][],
      buffer: number
    ): void {
      for (let dx = -buffer; dx <= buffer; dx++) {
        for (let dy = -buffer; dy <= buffer; dy++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (this.isValidPosition(nx, ny, { width: grid[0].length, height: grid.length })) {
            grid[ny][nx] = true;
          }
        }
      }
    }
  
    /**
     * Checks if a position is valid (within bounds)
     */
    private isValidPosition(
      x: number,
      y: number,
      layout: { width: number, height: number }
    ): boolean {
      return x >= 0 && x < layout.width && y >= 0 && y < layout.height;
    }
  
    /**
     * Generates road segments for building placement
     */
    private generateRoadSegments(
      roads: { start: { x: number, y: number }, end: { x: number, y: number } }[]
    ): { start: { x: number, y: number }, end: { x: number, y: number } }[] {
      return roads;
    }
  
    /**
     * Finds intersections between roads
     */
    private findRoadIntersections(
      roads: { start: { x: number, y: number }, end: { x: number, y: number } }[]
    ): { x: number, y: number }[] {
      const intersections: { x: number, y: number }[] = [];
      
      // Check each pair of roads for intersection
      for (let i = 0; i < roads.length; i++) {
        for (let j = i + 1; j < roads.length; j++) {
          const roadA = roads[i];
          const roadB = roads[j];
          
          const intersection = this.lineIntersection(
            roadA.start.x, roadA.start.y, roadA.end.x, roadA.end.y,
            roadB.start.x, roadB.start.y, roadB.end.x, roadB.end.y
          );
          
          if (intersection) {
            intersections.push(intersection);
          }
        }
      }
      
      return intersections;
    }
  
    /**
     * Calculates the intersection of two line segments
     */
    private lineIntersection(
      x1: number, y1: number, x2: number, y2: number, 
      x3: number, y3: number, x4: number, y4: number
    ): { x: number, y: number } | null {
      // Check if the lines are parallel
      const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
      if (denominator === 0) {
        return null;
      }
      
      // Calculate ua and ub
      const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
      const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;
      
      // Check if the intersection is on both line segments
      if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        const x = x1 + (ua * (x2 - x1));
        const y = y1 + (ua * (y2 - y1));
        return { x, y };
      }
      
      return null;
    }
  
    /**
     * Shuffles an array in place
     */
    private shuffleArray<T>(array: T[]): T[] {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  }