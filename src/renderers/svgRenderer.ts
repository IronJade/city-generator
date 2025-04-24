// src/renderers/svgRenderer.ts

import { City, Building, BuildingType } from '../models/interfaces';

export class SvgRenderer {
  /**
   * Generates an SVG representation of a city map
   */
  generateCityMapSvg(city: City, buildingTypes: BuildingType[]): string {
    const { width, height } = city.layout;
    const padding = 20;
    const svgWidth = width + (padding * 2);
    const svgHeight = height + (padding * 2);
    
    // Start SVG
    let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">\n`;
    
    // Add background
    svg += `  <rect width="${svgWidth}" height="${svgHeight}" fill="#f0e6d2" />\n`;
    
    // Draw grid lines (faint)
    svg += this.generateGridLines(width, height, padding);
    
    // Draw water features
    svg += this.generateWaterFeatures(city, padding);
    
    // Draw roads
    svg += this.generateRoads(city, padding);
    
    // Draw buildings
    svg += this.generateBuildings(city, buildingTypes, padding);
    
    // Add legend
    svg += `  <rect x="${padding}" y="${svgHeight - padding - 20}" width="${width}" height="15" fill="#f0e6d2" stroke="#000" stroke-width="1" />\n`;
    svg += `  <text x="${padding + 5}" y="${svgHeight - padding - 10}" font-family="sans-serif" font-size="10">Numbers correspond to building list below</text>\n`;
    
    // End SVG
    svg += `</svg>`;
    
    return svg;
  }
  
  /**
   * Generates faint grid lines for the map
   */
  private generateGridLines(width: number, height: number, padding: number): string {
    let gridLines = '  <!-- Grid Lines -->\n';
    const gridSize = 50;
    
    // Add a group for grid lines with reduced opacity
    gridLines += `  <g stroke="#ccc" stroke-width="0.5" opacity="0.3">\n`;
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      gridLines += `    <line x1="${x + padding}" y1="${padding}" x2="${x + padding}" y2="${height + padding}" />\n`;
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      gridLines += `    <line x1="${padding}" y1="${y + padding}" x2="${width + padding}" y2="${y + padding}" />\n`;
    }
    
    gridLines += `  </g>\n`;
    
    return gridLines;
  }
  
  /**
   * Generates SVG elements for water features
   */
  private generateWaterFeatures(city: City, padding: number): string {
    let waterSvg = '  <!-- Water Features -->\n';
    
    city.layout.waterFeatures.forEach((feature, index) => {
      if (feature.type === 'river') {
        // Draw river as a path
        const points = feature.points.map(p => `${p.x + padding},${p.y + padding}`).join(' ');
        waterSvg += `  <polyline points="${points}" stroke="#4a89dc" stroke-width="10" fill="none" stroke-linejoin="round" stroke-linecap="round" />\n`;
        
        // Add a thinner line in the middle to give the river some depth
        waterSvg += `  <polyline points="${points}" stroke="#81a8e0" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round" />\n`;
      } else if (feature.type === 'lake') {
        // Draw lake as a polygon
        const points = feature.points.map(p => `${p.x + padding},${p.y + padding}`).join(' ');
        
        // Add lake outline
        waterSvg += `  <polygon points="${points}" fill="#4a89dc" stroke="#3d7acc" stroke-width="2" />\n`;
        
        // Add some wave details to the lake
        const centerX = feature.points.reduce((sum, p) => sum + p.x, 0) / feature.points.length + padding;
        const centerY = feature.points.reduce((sum, p) => sum + p.y, 0) / feature.points.length + padding;
        
        // Add a subtle inner detail for depth
        waterSvg += `  <circle cx="${centerX}" cy="${centerY}" r="${Math.min(30, feature.points.length)}" fill="#81a8e0" opacity="0.5" />\n`;
      }
    });
    
    return waterSvg;
  }
  
  /**
   * Generates SVG elements for roads
   */
  private generateRoads(city: City, padding: number): string {
    let roadsSvg = '  <!-- Roads -->\n';
    
    // Add a shadow/outline effect for primary roads
    city.layout.roads.forEach((road, index) => {
      if (index < 3) { // Assume first few roads are main roads
        roadsSvg += `  <line x1="${road.start.x + padding}" y1="${road.start.y + padding}" x2="${road.end.x + padding}" y2="${road.end.y + padding}" stroke="#8d6b48" stroke-width="8" stroke-linecap="round" />\n`;
      }
    });
    
    // Draw all roads
    city.layout.roads.forEach((road, index) => {
      const isMainRoad = index < 3;
      const width = isMainRoad ? 6 : 4;
      const color = isMainRoad ? "#a67c52" : "#b89476";
      
      roadsSvg += `  <line x1="${road.start.x + padding}" y1="${road.start.y + padding}" x2="${road.end.x + padding}" y2="${road.end.y + padding}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" />\n`;
    });
    
    return roadsSvg;
  }
  
  /**
   * Generates SVG elements for buildings
   */
  private generateBuildings(city: City, buildingTypes: BuildingType[], padding: number): string {
    let buildingsSvg = '  <!-- Buildings -->\n';
    
    // Group buildings by type for better styling
    const buildingsByType: { [typeId: string]: Building[] } = {};
    
    city.buildings.forEach(building => {
      if (!buildingsByType[building.typeId]) {
        buildingsByType[building.typeId] = [];
      }
      buildingsByType[building.typeId].push(building);
    });
    
    // First draw building outlines/shadows for depth
    city.buildings.forEach((building, index) => {
      const buildingType = buildingTypes.find(t => t.id === building.typeId);
      const size = this.getBuildingSize(building.typeId);
      const x = building.position.x + padding - (size / 2) + 1; // Offset for shadow
      const y = building.position.y + padding - (size / 2) + 1; // Offset for shadow
      
      buildingsSvg += `  <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#777" opacity="0.3" rx="2" ry="2" />\n`;
    });
    
    // Draw actual buildings
    city.buildings.forEach((building, index) => {
      const buildingType = buildingTypes.find(t => t.id === building.typeId);
      const icon = buildingType ? buildingType.icon : '🏢';
      const size = this.getBuildingSize(building.typeId);
      const x = building.position.x + padding - (size / 2);
      const y = building.position.y + padding - (size / 2);
      
      // Determine building color based on type
      const color = this.getBuildingColor(building.typeId);
      
      // Draw building (rect with icon)
      buildingsSvg += `  <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" stroke="#000" stroke-width="1" rx="2" ry="2" />\n`;
      
      // Add building number (index + 1 to start from 1)
      buildingsSvg += `  <text x="${x + (size / 2)}" y="${y + (size / 2)}" font-family="sans-serif" font-size="10" text-anchor="middle" dominant-baseline="central" fill="#000">${index + 1}</text>\n`;
      
      // Add building icon as a tooltip/title
      buildingsSvg += `  <title>${icon} ${building.name} (${buildingType?.name || 'Building'})</title>\n`;
    });
    
    return buildingsSvg;
  }
  
  /**
   * Gets the appropriate color for a building type
   */
  private getBuildingColor(buildingTypeId: string): string {
    switch (buildingTypeId) {
      case 'residence': return '#e6c88f';
      case 'tavern': return '#bd9f7a';
      case 'blacksmith': return '#7a3923';
      case 'generalStore': return '#7e9e60';
      case 'temple': return '#ccc5b9';
      case 'townHall': case 'cityHall': return '#a39171';
      case 'market': return '#9a8b4f';
      case 'farm': return '#abc876';
      case 'bakery': return '#d6b088';
      case 'butcher': return '#c17a6f';
      case 'tailor': return '#7eb5c8';
      case 'library': return '#b68e72';
      case 'alchemist': return '#9b7eb5';
      case 'jeweler': return '#d4af37';
      default: return '#8e8e8e';
    }
  }
  
  /**
   * Gets the appropriate size for a building based on its type
   */
  private getBuildingSize(buildingTypeId: string): number {
    switch (buildingTypeId) {
      case 'townHall': case 'cityHall': return 22;
      case 'market': case 'temple': return 20;
      case 'tavern': case 'blacksmith': case 'generalStore': return 18;
      case 'farm': return 16;
      case 'residence': default: return 14;
    }
  }
}