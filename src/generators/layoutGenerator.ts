import { CityLayout, MapSettings, District } from '../models/interfaces';

export class LayoutGenerator {
  private mapSettings: MapSettings;

  constructor(mapSettings: MapSettings) {
    this.mapSettings = mapSettings;
  }

  /**
   * Generates a city layout with roads and water features
   */
  generateCityLayout(buildingCount: number): CityLayout {
    const { width, height, roadDensity, waterFeatureProbability } = this.mapSettings;
    
    // Generate water features first, so roads can avoid them
    const waterFeatures = this.generateWaterFeatures(width, height, waterFeatureProbability);
    
    // Create road network avoiding water
    const roads = this.generateRoadNetwork(width, height, buildingCount, roadDensity, waterFeatures);
    
    return {
      width,
      height,
      roads,
      waterFeatures
    };
  }

  /**
   * Generate water features (lakes or rivers)
   */
  private generateWaterFeatures(
    width: number, 
    height: number, 
    waterFeatureProbability: number
  ): { type: string, points: { x: number, y: number }[] }[] {
    const waterFeatures: { type: string, points: { x: number, y: number }[] }[] = [];
    
    if (Math.random() < waterFeatureProbability) {
      const waterType = Math.random() < 0.5 ? 'river' : 'lake';
      
      if (waterType === 'river') {
        // Generate a river (a line with multiple points)
        // Place river more towards the edge of the map
        const startSide = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let startX = 0, startY = 0;
        
        switch(startSide) {
          case 0: // top
            startX = width * Math.random();
            startY = 0;
            break;
          case 1: // right
            startX = width;
            startY = height * Math.random();
            break;
          case 2: // bottom
            startX = width * Math.random();
            startY = height;
            break;
          case 3: // left
            startX = 0;
            startY = height * Math.random();
            break;
        }
        
        // End on a different side from where we started
        const endSide = (startSide + 2) % 4; // Pick the opposite side
        let endX = 0, endY = 0;
        
        switch(endSide) {
          case 0: // top
            endX = width * Math.random();
            endY = 0;
            break;
          case 1: // right
            endX = width;
            endY = height * Math.random();
            break;
          case 2: // bottom
            endX = width * Math.random();
            endY = height;
            break;
          case 3: // left
            endX = 0;
            endY = height * Math.random();
            break;
        }
        
        const riverPoints: { x: number, y: number }[] = [];
        riverPoints.push({ x: startX, y: startY });
        
        // Add 3-5 additional points to make the river curve naturally
        const pointCount = Math.floor(Math.random() * 3) + 3;
        
        // Create a more natural flow with a consistent direction
        const controlPoints = this.generateControlPoints(startX, startY, endX, endY, pointCount);
        controlPoints.forEach(point => {
          riverPoints.push(point);
        });
        
        riverPoints.push({ x: endX, y: endY });
        
        waterFeatures.push({
          type: 'river',
          points: riverPoints
        });
      } else {
        // Generate a lake (a circular set of points)
        // Move lake away from center of map
        const offsetX = (Math.random() - 0.5) * (width * 0.5);
        const offsetY = (Math.random() - 0.5) * (height * 0.5);
        const centerX = (width / 2) + offsetX;
        const centerY = (height / 2) + offsetY;
        
        // Vary the radius but keep it proportional to map size
        const radius = Math.floor(Math.random() * (width / 8)) + (width / 16);
        
        // Make the lake shape more irregular
        const lakePoints: { x: number, y: number }[] = [];
        const pointCount = 12; // More points for smoother lake
        
        for (let angle = 0; angle < 360; angle += (360 / pointCount)) {
          // Add some randomness to the radius for a more natural look
          const radiusVariation = radius * (0.8 + Math.random() * 0.4);
          const radian = angle * Math.PI / 180;
          const x = centerX + Math.cos(radian) * radiusVariation;
          const y = centerY + Math.sin(radian) * radiusVariation;
          lakePoints.push({ x, y });
        }
        
        waterFeatures.push({
          type: 'lake',
          points: lakePoints
        });
      }
    }
    
    return waterFeatures;
  }

  /**
   * Generates control points for a curved river
   */
  private generateControlPoints(
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number, 
    count: number
  ): { x: number, y: number }[] {
    const points: { x: number, y: number }[] = [];
    
    // Calculate midpoint
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    // Calculate perpendicular vector for curve direction
    const dx = endX - startX;
    const dy = endY - startY;
    const perpX = -dy;
    const perpY = dx;
    const magnitude = Math.sqrt(perpX * perpX + perpY * perpY);
    
    // Normalize and scale
    const curveAmount = Math.min(this.mapSettings.width, this.mapSettings.height) * 0.2;
    const normalizedPerpX = (perpX / magnitude) * curveAmount;
    const normalizedPerpY = (perpY / magnitude) * curveAmount;
    
    // Add a curve with random direction
    const curveFactor = (Math.random() > 0.5 ? 1 : -1);
    
    for (let i = 1; i <= count; i++) {
      // Calculate position along the line
      const ratio = i / (count + 1);
      const baseX = startX + dx * ratio;
      const baseY = startY + dy * ratio;
      
      // Calculate curve intensity (stronger in the middle)
      const curveMagnitude = Math.sin(ratio * Math.PI) * curveFactor;
      
      // Apply curve
      const pointX = baseX + normalizedPerpX * curveMagnitude;
      const pointY = baseY + normalizedPerpY * curveMagnitude;
      
      points.push({ x: pointX, y: pointY });
    }
    
    return points;
  }

  /**
   * Generate a road network that makes sense with buildings
   */
  private generateRoadNetwork(
    width: number, 
    height: number, 
    buildingCount: number, 
    roadDensity: number,
    waterFeatures: { type: string; points: { x: number; y: number; }[]; }[]
  ): { start: { x: number, y: number }, end: { x: number, y: number } }[] {
    const roads: { start: { x: number, y: number }, end: { x: number, y: number } }[] = [];
    
    // Create a waterMap to check if a point is in water
    const waterMap = this.createWaterMap(width, height, waterFeatures);
    
    // Start with 1-3 main roads (but at least 1 per 40 buildings)
    const mainRoadCount = Math.max(1, Math.min(3, Math.floor(buildingCount / 40)));
    
    // Create intersection points for main roads (avoiding water)
    const intersections: {x: number, y: number}[] = [];
    for (let i = 0; i < Math.min(3, mainRoadCount + 1); i++) {
      // Try to find a non-water spot for intersection
      let x = width * (0.3 + Math.random() * 0.4);
      let y = height * (0.3 + Math.random() * 0.4);
      let attempts = 0;
      
      // Try to find a non-water spot
      while (attempts < 20 && 
            y < waterMap.length && 
            x < waterMap[0].length && 
            waterMap[Math.floor(y)][Math.floor(x)]) {
        x = width * (0.3 + Math.random() * 0.4);
        y = height * (0.3 + Math.random() * 0.4);
        attempts++;
      }
      
      intersections.push({x, y});
    }
    
    // Create main roads connecting intersections and edges
    for (let i = 0; i < mainRoadCount; i++) {
      // Start from an intersection or edge
      const useIntersection = (i < intersections.length) && (Math.random() < 0.7);
      let startX = 0, startY = 0;
      
      if (useIntersection && i < intersections.length) {
        startX = intersections[i].x;
        startY = intersections[i].y;
      } else {
        // Start from an edge
        const edge = Math.floor(Math.random() * 4);
        switch(edge) {
          case 0: // top
            startX = width * Math.random();
            startY = 0;
            break;
          case 1: // right
            startX = width;
            startY = height * Math.random();
            break;
          case 2: // bottom
            startX = width * Math.random();
            startY = height;
            break;
          case 3: // left
            startX = 0;
            startY = height * Math.random();
            break;
        }
      }
      
      // End at another intersection or edge
      let endX = 0, endY = 0;
      const endAtIntersection = (Math.random() < 0.5) && intersections.length > 1;
      
      if (endAtIntersection) {
        // Pick a different intersection
        let targetIndex = 0;
        do {
          targetIndex = Math.floor(Math.random() * intersections.length);
        } while (useIntersection && targetIndex === i && intersections.length > 1);
        
        if (targetIndex < intersections.length) {
          endX = intersections[targetIndex].x;
          endY = intersections[targetIndex].y;
        } else {
          // Fallback if index is out of bounds
          endX = width * Math.random();
          endY = height * Math.random();
        }
      } else {
        // End at an edge
        const edge = Math.floor(Math.random() * 4);
        switch(edge) {
          case 0: // top
            endX = width * Math.random();
            endY = 0;
            break;
          case 1: // right
            endX = width;
            endY = height * Math.random();
            break;
          case 2: // bottom
            endX = width * Math.random();
            endY = height;
            break;
          case 3: // left
            endX = 0;
            endY = height * Math.random();
            break;
        }
      }
      
      // Add the road
      roads.push({
        start: { x: startX, y: startY },
        end: { x: endX, y: endY }
      });
    }
    
    // Add secondary roads branching from main roads and intersections
    const secondaryRoadCount = Math.floor(buildingCount * roadDensity / 10);
    const possibleBranchPoints: {x: number, y: number}[] = [...intersections];
    
    // Add points along existing roads as potential branch points
    roads.forEach(road => {
      const roadLength = Math.sqrt(
        Math.pow(road.end.x - road.start.x, 2) + 
        Math.pow(road.end.y - road.start.y, 2)
      );
      
      // Add 2-3 points along each main road
      const pointsToAdd = Math.floor(roadLength / 100) + 1;
      
      for (let i = 1; i <= pointsToAdd; i++) {
        const t = i / (pointsToAdd + 1);
        const x = road.start.x + (road.end.x - road.start.x) * t;
        const y = road.start.y + (road.end.y - road.start.y) * t;
        
        // Only add if not in water and within bounds
        if (y < waterMap.length && x < waterMap[0].length && 
            (!waterMap[Math.floor(y)] || !waterMap[Math.floor(y)][Math.floor(x)])) {
          possibleBranchPoints.push({x, y});
        }
      }
    });
    
    // Generate secondary roads
    for (let i = 0; i < secondaryRoadCount; i++) {
      if (possibleBranchPoints.length === 0) break;
      
      // Pick a random branch point
      const branchIndex = Math.floor(Math.random() * possibleBranchPoints.length);
      
      // Ensure index is valid
      if (branchIndex >= possibleBranchPoints.length) continue;
      
      const branchPoint = possibleBranchPoints[branchIndex];
      
      // Create a branch road
      const branchLength = Math.floor(Math.random() * (width / 6)) + (width / 12);
      const angle = Math.random() * Math.PI * 2;
      
      let endX = Math.floor(branchPoint.x + Math.cos(angle) * branchLength);
      let endY = Math.floor(branchPoint.y + Math.sin(angle) * branchLength);
      
      // Keep roads within bounds
      endX = Math.max(0, Math.min(width, endX));
      endY = Math.max(0, Math.min(height, endY));
      
      // Add the branch road
      roads.push({
        start: { x: branchPoint.x, y: branchPoint.y },
        end: { x: endX, y: endY }
      });
      
      // Add the endpoint as a possible future branch point (if not in water and within bounds)
      if (endY < waterMap.length && endX < waterMap[0].length && 
          (!waterMap[Math.floor(endY)] || !waterMap[Math.floor(endY)][Math.floor(endX)])) {
        possibleBranchPoints.push({x: endX, y: endY});
      }
      
      // Optionally remove the used branch point to prevent too many branches from same point
      if (Math.random() < 0.3 && branchIndex < possibleBranchPoints.length) {
        possibleBranchPoints.splice(branchIndex, 1);
      }
    }
    
    return roads;
  }

  /**
   * Creates districts for building placement
   */
  createDistricts(buildingCount: number, layout: CityLayout): District[] {
    const districts: District[] = [];
    const districtCount = Math.max(2, Math.floor(buildingCount / 30));
    
    // Create a waterMap to check if a point is in water
    const waterMap = this.createWaterMap(layout.width, layout.height, layout.waterFeatures);
    
    // Find road intersections for placing districts
    const intersections = this.findRoadIntersections(layout.roads);
    
    // Generate district centers based on road intersections, avoiding water
    for (let i = 0; i < districtCount; i++) {
      let x = 0, y = 0;
      let attempts = 0;
      let isInWater = true;
      
      // Try to place district center at road intersections first
      if (i < intersections.length) {
        x = intersections[i].x;
        y = intersections[i].y;
        isInWater = y < waterMap.length && x < waterMap[0].length && 
                    waterMap[Math.floor(y)][Math.floor(x)];
      }
      
      // If in water or no intersection available, try other road points
      if (isInWater || i >= intersections.length) {
        while (isInWater && attempts < 20) {
          // Pick a random road
          const road = layout.roads[Math.floor(Math.random() * layout.roads.length)];
          
          // Pick a point along the road
          const t = Math.random();
          x = road.start.x + (road.end.x - road.start.x) * t;
          y = road.start.y + (road.end.y - road.start.y) * t;
          
          // Check if in water - make sure to check array bounds
          isInWater = y < waterMap.length && x < waterMap[0].length && 
                      waterMap[Math.floor(y)][Math.floor(x)];
          attempts++;
        }
      }
      
      // If still in water after attempts, pick a random non-water point
      if (isInWater) {
        attempts = 0;
        while (isInWater && attempts < 50) {
          x = Math.floor(Math.random() * layout.width);
          y = Math.floor(Math.random() * layout.height);
          isInWater = y < waterMap.length && x < waterMap[0].length && 
                      waterMap[Math.floor(y)][Math.floor(x)];
          attempts++;
        }
      }
      
      // Calculate district radius based on building count
      const radius = Math.floor(
        Math.max(50, Math.min(150, buildingCount / districtCount * 2))
      );
      
      districts.push({
        x,
        y,
        radius
      });
    }
    
    return districts;
  }

  /**
   * Find road intersections
   */
  private findRoadIntersections(roads: { start: { x: number, y: number }, end: { x: number, y: number } }[]): {x: number, y: number}[] {
    const intersections: {x: number, y: number}[] = [];
    
    // Check each pair of roads for intersections
    for (let i = 0; i < roads.length; i++) {
      for (let j = i + 1; j < roads.length; j++) {
        const road1 = roads[i];
        const road2 = roads[j];
        
        // Check if roads intersect
        const intersection = this.lineIntersection(
          road1.start.x, road1.start.y, road1.end.x, road1.end.y,
          road2.start.x, road2.start.y, road2.end.x, road2.end.y
        );
        
        if (intersection) {
          intersections.push(intersection);
        }
      }
    }
    
    return intersections;
  }

  /**
   * Calculate intersection of two line segments
   */
  private lineIntersection(
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number
  ): {x: number, y: number} | null {
    // Calculate determinant
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    
    // If lines are parallel or coincident
    if (denom === 0) {
      return null;
    }
    
    // Calculate ua and ub
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    
    // Check if intersection is within both line segments
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      // Calculate intersection point
      const x = x1 + ua * (x2 - x1);
      const y = y1 + ua * (y2 - y1);
      
      return {x, y};
    }
    
    return null;
  }
  
  /**
   * Creates a map indicating which points are within water features
   */
  private createWaterMap(
    width: number, 
    height: number, 
    waterFeatures: { type: string; points: { x: number; y: number; }[]; }[]
  ): boolean[][] {
    // Create a 2D array filled with false
    const waterMap: boolean[][] = Array(Math.floor(height))
      .fill(false)
      .map(() => Array(Math.floor(width)).fill(false));
    
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