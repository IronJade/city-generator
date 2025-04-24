// src/generators/mapGenerator.ts

import { CityLayout, MapSettings, District } from '../models/interfaces';

export class MapGenerator {
  private mapSettings: MapSettings;

  constructor(mapSettings: MapSettings) {
    this.mapSettings = mapSettings;
  }

  /**
   * Generates a city layout with roads and water features
   */
  generateCityLayout(buildingCount: number, settlementType: string): CityLayout {
    const { width, height, roadDensity, waterFeatureProbability } = this.mapSettings;
    
    // Generate roads based on settlement type and building count
    const roads = this.generateRoadNetwork(width, height, buildingCount, settlementType);
    
    // Generate water features with higher probability
    const adjustedWaterProb = Math.min(waterFeatureProbability * 1.5, 1.0);
    const waterFeatures = this.generateWaterFeatures(width, height, adjustedWaterProb);
    
    return {
      width,
      height,
      roads,
      waterFeatures
    };
  }

  /**
   * Generates a network of roads appropriate for the settlement size
   */
  private generateRoadNetwork(width: number, height: number, buildingCount: number, settlementType: string): { start: { x: number, y: number }, end: { x: number, y: number } }[] {
    const roads: { start: { x: number, y: number }, end: { x: number, y: number } }[] = [];
    
    // Determine number of main roads based on settlement type
    let mainRoadCount = 1;
    if (settlementType === 'town') {
      mainRoadCount = 2;
    } else if (settlementType === 'city') {
      mainRoadCount = 3;
    }
    
    // Ensure at least 1 main road
    mainRoadCount = Math.max(1, mainRoadCount);
    
    // Calculate secondary road count based on building density
    const secondaryRoadCount = Math.max(3, Math.floor(buildingCount / 5));
    
    // Generate main roads
    for (let i = 0; i < mainRoadCount; i++) {
      if (i === 0) {
        // First main road is typically east-west
        const roadY = height / 2 + (Math.random() * height * 0.4 - height * 0.2);
        roads.push({
          start: { x: 0, y: roadY },
          end: { x: width, y: roadY + (Math.random() * height * 0.2 - height * 0.1) }
        });
      } else if (i === 1) {
        // Second main road is typically north-south
        const roadX = width / 2 + (Math.random() * width * 0.4 - width * 0.2);
        roads.push({
          start: { x: roadX, y: 0 },
          end: { x: roadX + (Math.random() * width * 0.2 - width * 0.1), y: height }
        });
      } else {
        // Additional main roads can be diagonal
        const diagonal = Math.random() < 0.5;
        
        if (diagonal) {
          // Diagonal road (NW to SE or NE to SW)
          const fromNW = Math.random() < 0.5;
          
          if (fromNW) {
            roads.push({
              start: { x: 0, y: 0 },
              end: { x: width, y: height }
            });
          } else {
            roads.push({
              start: { x: width, y: 0 },
              end: { x: 0, y: height }
            });
          }
        } else {
          // Another horizontal or vertical road
          const isHorizontal = Math.random() < 0.5;
          
          if (isHorizontal) {
            const roadY = Math.random() * height;
            roads.push({
              start: { x: 0, y: roadY },
              end: { x: width, y: roadY + (Math.random() * height * 0.2 - height * 0.1) }
            });
          } else {
            const roadX = Math.random() * width;
            roads.push({
              start: { x: roadX, y: 0 },
              end: { x: roadX + (Math.random() * width * 0.2 - width * 0.1), y: height }
            });
          }
        }
      }
    }
    
    // Generate a grid of secondary roads
    if (settlementType !== 'village') {
      // Add a grid of roads for towns and cities
      const gridSpacingX = width / (Math.floor(Math.sqrt(secondaryRoadCount)) + 1);
      const gridSpacingY = height / (Math.floor(Math.sqrt(secondaryRoadCount)) + 1);
      
      for (let i = 1; i <= Math.floor(Math.sqrt(secondaryRoadCount)); i++) {
        // Horizontal grid road
        const gridY = i * gridSpacingY;
        roads.push({
          start: { x: 0, y: gridY },
          end: { x: width, y: gridY + (Math.random() * 20 - 10) }
        });
        
        // Vertical grid road
        const gridX = i * gridSpacingX;
        roads.push({
          start: { x: gridX, y: 0 },
          end: { x: gridX + (Math.random() * 20 - 10), y: height }
        });
      }
    }
    
    // Add more organic secondary roads
    for (let i = 0; i < secondaryRoadCount; i++) {
      const sourceRoadIndex = Math.floor(Math.random() * roads.length);
      const sourceRoad = roads[sourceRoadIndex];
      
      const t = Math.random(); // Position along the road (0-1)
      const sourceX = sourceRoad.start.x + (sourceRoad.end.x - sourceRoad.start.x) * t;
      const sourceY = sourceRoad.start.y + (sourceRoad.end.y - sourceRoad.start.y) * t;
      
      // Angle roughly perpendicular to source road
      const roadDX = sourceRoad.end.x - sourceRoad.start.x;
      const roadDY = sourceRoad.end.y - sourceRoad.start.y;
      const perpAngle = Math.atan2(roadDY, roadDX) + (Math.PI / 2) + (Math.random() * Math.PI / 4 - Math.PI / 8);
      
      // Road length based on settlement size
      let roadLength = 0;
      if (settlementType === 'village') {
        roadLength = Math.random() * (width / 8) + (width / 10);
      } else if (settlementType === 'town') {
        roadLength = Math.random() * (width / 6) + (width / 8);
      } else {
        roadLength = Math.random() * (width / 4) + (width / 6);
      }
      
      const endX = sourceX + Math.cos(perpAngle) * roadLength;
      const endY = sourceY + Math.sin(perpAngle) * roadLength;
      
      // Ensure the road stays within map bounds
      const clampedEndX = Math.max(0, Math.min(width, endX));
      const clampedEndY = Math.max(0, Math.min(height, endY));
      
      roads.push({
        start: { x: sourceX, y: sourceY },
        end: { x: clampedEndX, y: clampedEndY }
      });
    }
    
    // For villages, add a few small side roads/paths
    if (settlementType === 'village' && roads.length < 5) {
      const pathCount = Math.max(2, 5 - roads.length);
      
      for (let i = 0; i < pathCount; i++) {
        const sourceRoad = roads[Math.floor(Math.random() * roads.length)];
        const t = Math.random();
        
        const sourceX = sourceRoad.start.x + (sourceRoad.end.x - sourceRoad.start.x) * t;
        const sourceY = sourceRoad.start.y + (sourceRoad.end.y - sourceRoad.start.y) * t;
        
        const angle = Math.random() * Math.PI * 2;
        const pathLength = Math.random() * (width / 10) + (width / 20);
        
        const endX = sourceX + Math.cos(angle) * pathLength;
        const endY = sourceY + Math.sin(angle) * pathLength;
        
        roads.push({
          start: { x: sourceX, y: sourceY },
          end: { x: endX, y: endY }
        });
      }
    }
    
    return roads;
  }

  /**
   * Generates water features (rivers and lakes)
   */
  private generateWaterFeatures(width: number, height: number, probability: number): { type: string, points: { x: number, y: number }[] }[] {
    const waterFeatures: { type: string, points: { x: number, y: number }[] }[] = [];
    
    if (Math.random() < probability) {
      // Decide whether to create a river, lake, or both
      const featureType = Math.random();
      
      // 60% chance for river, 30% chance for lake, 10% chance for both
      const createRiver = featureType < 0.7;
      const createLake = featureType > 0.4;
      
      if (createRiver) {
        waterFeatures.push(this.generateRiver(width, height));
      }
      
      if (createLake) {
        waterFeatures.push(this.generateLake(width, height));
      }
    }
    
    return waterFeatures;
  }

  /**
   * Generates a river with natural curves
   */
  private generateRiver(width: number, height: number): { type: string, points: { x: number, y: number }[] } {
    // Determine river flow direction (N to S, E to W, etc.)
    const direction = Math.floor(Math.random() * 4);
    
    let startX = 0, startY = 0, endX = 0, endY = 0;
    
    switch (direction) {
      case 0: // North to South
        startX = Math.random() * width;
        startY = 0;
        endX = Math.random() * width;
        endY = height;
        break;
      case 1: // East to West
        startX = width;
        startY = Math.random() * height;
        endX = 0;
        endY = Math.random() * height;
        break;
      case 2: // South to North
        startX = Math.random() * width;
        startY = height;
        endX = Math.random() * width;
        endY = 0;
        break;
      case 3: // West to East
        startX = 0;
        startY = Math.random() * height;
        endX = width;
        endY = Math.random() * height;
        break;
    }
    
    // Generate a series of points to create a curved river
    const riverPoints: { x: number, y: number }[] = [];
    riverPoints.push({ x: startX, y: startY });
    
    // Use Perlin noise-like approach to create natural curves
    const segmentCount = 5 + Math.floor(Math.random() * 4);
    const maxOffset = Math.min(width, height) / 5;
    
    // Generate intermediate points with randomized offsets
    for (let i = 1; i < segmentCount; i++) {
      const t = i / segmentCount;
      
      // Linear interpolation between start and end
      const baseX = startX + (endX - startX) * t;
      const baseY = startY + (endY - startY) * t;
      
      // Add some randomness
      const offsetX = (Math.random() * 2 - 1) * maxOffset;
      const offsetY = (Math.random() * 2 - 1) * maxOffset;
      
      riverPoints.push({
        x: baseX + offsetX,
        y: baseY + offsetY
      });
    }
    
    riverPoints.push({ x: endX, y: endY });
    
    return {
      type: 'river',
      points: riverPoints
    };
  }

  /**
   * Generates a lake with a natural shape
   */
  private generateLake(width: number, height: number): { type: string, points: { x: number, y: number }[] } {
    // Determine lake center position
    const centerX = Math.random() * (width * 0.6) + (width * 0.2);
    const centerY = Math.random() * (height * 0.6) + (height * 0.2);
    
    // Determine lake size
    const baseRadius = Math.min(width, height) / 8 + Math.random() * (Math.min(width, height) / 8);
    
    // Generate points around the circle with varying radius
    const pointCount = 12 + Math.floor(Math.random() * 8);
    const lakePoints: { x: number, y: number }[] = [];
    
    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2;
      
      // Vary radius for a more natural look
      const radiusVariance = 0.7 + Math.random() * 0.6; // 70-130% of base radius
      const radius = baseRadius * radiusVariance;
      
      lakePoints.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }
    
    return {
      type: 'lake',
      points: lakePoints
    };
  }

  /**
   * Creates districts for building placement
   */
  createDistricts(buildingCount: number, layout: CityLayout, settlementType: string): District[] {
    const districts: District[] = [];
    
    // Determine number of districts based on settlement type and building count
    let districtCount = 1;
    if (settlementType === 'village') {
      districtCount = Math.max(1, Math.floor(buildingCount / 10));
    } else if (settlementType === 'town') {
      districtCount = Math.max(2, Math.floor(buildingCount / 15));
    } else {
      districtCount = Math.max(3, Math.floor(buildingCount / 25));
    }
    
    // Find road intersections to place districts
    const intersections = this.findRoadIntersections(layout.roads);
    
    // Create districts at road intersections
    for (let i = 0; i < Math.min(districtCount, intersections.length); i++) {
      districts.push({
        x: intersections[i].x,
        y: intersections[i].y,
        radius: Math.floor(Math.random() * 50) + 50
      });
    }
    
    // If we need more districts, create them at road endpoints or midpoints
    if (districts.length < districtCount) {
      // Use road endpoints
      for (let i = 0; i < layout.roads.length && districts.length < districtCount; i++) {
        const road = layout.roads[i];
        
        // Use road start point
        districts.push({
          x: road.start.x,
          y: road.start.y,
          radius: Math.floor(Math.random() * 40) + 40
        });
        
        // Use road end point
        if (districts.length < districtCount) {
          districts.push({
            x: road.end.x,
            y: road.end.y,
            radius: Math.floor(Math.random() * 40) + 40
          });
        }
        
        // Use road midpoint
        if (districts.length < districtCount) {
          districts.push({
            x: (road.start.x + road.end.x) / 2,
            y: (road.start.y + road.end.y) / 2,
            radius: Math.floor(Math.random() * 30) + 30
          });
        }
      }
    }
    
    // If still not enough districts, create some randomly
    while (districts.length < districtCount) {
      districts.push({
        x: Math.floor(Math.random() * layout.width),
        y: Math.floor(Math.random() * layout.height),
        radius: Math.floor(Math.random() * 30) + 30
      });
    }
    
    return districts;
  }

  /**
   * Finds intersection points between roads
   */
  private findRoadIntersections(roads: { start: { x: number, y: number }, end: { x: number, y: number } }[]): { x: number, y: number }[] {
    const intersections: { x: number, y: number }[] = [];
    
    // Check each pair of roads for intersections
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
   * Calculates the intersection point of two line segments
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
    
    // If ua and ub are between 0-1, the lines intersect
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      // Calculate the intersection point
      const x = x1 + (ua * (x2 - x1));
      const y = y1 + (ua * (y2 - y1));
      
      return { x, y };
    }
    
    return null;
  }
}