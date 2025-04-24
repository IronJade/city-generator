import { CityLayout, MapSettings } from '../models/interfaces';

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
    
    // Create a more organic road network
    // Start with 1-3 main roads
    const mainRoadCount = Math.min(3, Math.max(1, Math.floor(buildingCount / 50)));
    const roads: { start: { x: number, y: number }, end: { x: number, y: number } }[] = [];
    
    // Generate main roads crossing the settlement
    for (let i = 0; i < mainRoadCount; i++) {
      const road = this.generateMainRoad(width, height);
      roads.push(road);
    }
    
    // Add secondary roads branching from main roads
    const secondaryRoadCount = Math.floor(buildingCount * roadDensity / 15);
    
    for (let i = 0; i < secondaryRoadCount; i++) {
      // Pick a point on an existing road
      const sourceRoad = roads[Math.floor(Math.random() * roads.length)];
      const t = Math.random(); // Position along the road (0-1)
      
      const sourceX = Math.floor(sourceRoad.start.x + (sourceRoad.end.x - sourceRoad.start.x) * t);
      const sourceY = Math.floor(sourceRoad.start.y + (sourceRoad.end.y - sourceRoad.start.y) * t);
      
      // Create a branch road
      const angle = Math.random() * Math.PI * 2;
      const branchLength = Math.floor(Math.random() * (width / 5)) + (width / 10);
      
      const endX = Math.floor(sourceX + Math.cos(angle) * branchLength);
      const endY = Math.floor(sourceY + Math.sin(angle) * branchLength);
      
      // Add the branch road
      roads.push({
        start: { x: sourceX, y: sourceY },
        end: { x: endX, y: endY }
      });
    }
    
    // Generate water features
    const waterFeatures: { type: string, points: { x: number, y: number }[] }[] = [];
    if (Math.random() < waterFeatureProbability) {
      const waterType = Math.random() < 0.5 ? 'river' : 'lake';
      
      if (waterType === 'river') {
        // Generate a river (a line with multiple points)
        const riverPoints: { x: number, y: number }[] = [];
        const startX = Math.random() < 0.5 ? 0 : width;
        const startY = Math.floor(Math.random() * height);
        
        riverPoints.push({ x: startX, y: startY });
        
        // Add 3-5 additional points to make the river curve
        const pointCount = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < pointCount; i++) {
          riverPoints.push({
            x: Math.floor(Math.random() * width),
            y: Math.floor(Math.random() * height)
          });
        }
        
        // End on the opposite side
        const endX = startX === 0 ? width : 0;
        const endY = Math.floor(Math.random() * height);
        riverPoints.push({ x: endX, y: endY });
        
        waterFeatures.push({
          type: 'river',
          points: riverPoints
        });
      } else {
        // Generate a lake (a circular set of points)
        const centerX = Math.floor(Math.random() * width);
        const centerY = Math.floor(Math.random() * height);
        const radius = Math.floor(Math.random() * (width / 6)) + (width / 12);
        
        const lakePoints: { x: number, y: number }[] = [];
        for (let angle = 0; angle < 360; angle += 30) {
          const radian = angle * Math.PI / 180;
          const x = centerX + Math.cos(radian) * radius;
          const y = centerY + Math.sin(radian) * radius;
          lakePoints.push({ x, y });
        }
        
        waterFeatures.push({
          type: 'lake',
          points: lakePoints
        });
      }
    }
    
    return {
      width,
      height,
      roads,
      waterFeatures
    };
  }

  /**
   * Generates a main road across the map
   */
  private generateMainRoad(width: number, height: number): { start: { x: number, y: number }, end: { x: number, y: number } } {
    // Determine if the road is more horizontal or vertical
    const isHorizontal = Math.random() < 0.5;
    
    let startX, startY, endX, endY;
    
    if (isHorizontal) {
      // Horizontal road
      startX = 0;
      endX = width;
      
      // Vary the Y position but keep it within the middle 60% of the map
      const midY = height / 2;
      const variance = height * 0.3;
      startY = endY = Math.floor(midY + (Math.random() * variance * 2) - variance);
      
      // Add a slight curve
      if (Math.random() < 0.5) {
        startY = Math.floor(startY * 0.8);
      } else {
        endY = Math.floor(endY * 0.8);
      }
    } else {
      // Vertical road
      startY = 0;
      endY = height;
      
      // Vary the X position but keep it within the middle 60% of the map
      const midX = width / 2;
      const variance = width * 0.3;
      startX = endX = Math.floor(midX + (Math.random() * variance * 2) - variance);
      
      // Add a slight curve
      if (Math.random() < 0.5) {
        startX = Math.floor(startX * 0.8);
      } else {
        endX = Math.floor(endX * 0.8);
      }
    }
    
    return {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY }
    };
  }

  /**
   * Creates districts for building placement
   */
  createDistricts(buildingCount: number, layout: CityLayout): { x: number, y: number, radius: number }[] {
    const districts: { x: number, y: number, radius: number }[] = [];
    const districtCount = Math.max(3, Math.floor(buildingCount / 20));
    
    // Generate district centers based on road intersections or points
    for (let i = 0; i < districtCount; i++) {
      // Find road intersections to place districts
      let x = 0, y = 0;
      
      if (i < layout.roads.length) {
        // Use road start/end points for first districts
        x = layout.roads[i].start.x;
        y = layout.roads[i].start.y;
      } else {
        // Generate random point for additional districts
        x = Math.floor(Math.random() * layout.width);
        y = Math.floor(Math.random() * layout.height);
      }
      
      districts.push({
        x: x,
        y: y,
        radius: Math.floor(Math.random() * 100) + 50
      });
    }
    
    return districts;
  }
}