import { City, BuildingType } from '../models/interfaces';

export class MapGenerator {
  private buildingTypes: BuildingType[];

  constructor(buildingTypes: BuildingType[]) {
    this.buildingTypes = buildingTypes;
  }

  /**
   * Generates an SVG map of the city
   */
  generateCityMapSvg(city: City): string {
    const { width, height } = city.layout;
    const padding = 20;
    const svgWidth = width + (padding * 2);
    const svgHeight = height + (padding * 2);
    
    // Start SVG
    let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">\n`;
    
    // Add background
    svg += `  <rect width="${svgWidth}" height="${svgHeight}" fill="#f0e6d2" />\n`;
    
    // Draw water features
    city.layout.waterFeatures.forEach(feature => {
      if (feature.type === 'river') {
        // Draw river as a path
        const points = feature.points.map(p => `${p.x + padding},${p.y + padding}`).join(' ');
        svg += `  <polyline points="${points}" stroke="#4a89dc" stroke-width="10" fill="none" stroke-linejoin="round" stroke-linecap="round" />\n`;
      } else if (feature.type === 'lake') {
        // Draw lake as a polygon
        const points = feature.points.map(p => `${p.x + padding},${p.y + padding}`).join(' ');
        svg += `  <polygon points="${points}" fill="#4a89dc" stroke="#4a89dc" stroke-width="2" />\n`;
      }
    });
    
    // Draw roads
    city.layout.roads.forEach(road => {
      svg += `  <line x1="${road.start.x + padding}" y1="${road.start.y + padding}" x2="${road.end.x + padding}" y2="${road.end.y + padding}" stroke="#a67c52" stroke-width="6" stroke-linecap="round" />\n`;
    });
    
    // Draw buildings
    city.buildings.forEach((building, index) => {
      const buildingType = this.buildingTypes.find(t => t.id === building.typeId);
      
      // Determine building color based on type
      let color = '#8e8e8e'; // Default gray
      if (buildingType) {
        switch (buildingType.id) {
          case 'residence': color = '#e6c88f'; break;
          case 'tavern': color = '#bd9f7a'; break;
          case 'blacksmith': color = '#7a3923'; break;
          case 'generalStore': color = '#7e9e60'; break;
          case 'temple': color = '#ccc5b9'; break;
          case 'townHall': case 'cityHall': color = '#a39171'; break;
          case 'market': color = '#9a8b4f'; break;
          case 'farm': color = '#a5c882'; break;
          case 'bakery': color = '#e6d7a9'; break;
          case 'butcher': color = '#c27d7d'; break;
          case 'library': color = '#c9ae99'; break;
          case 'alchemist': color = '#9c89b8'; break;
          case 'jeweler': color = '#e6c34a'; break;
          case 'tailor': color = '#82a5c8'; break;
          default: color = '#8e8e8e';
        }
      }
      
      // Draw building (rect with index number)
      const size = 15;
      const x = building.position.x + padding - (size / 2);
      const y = building.position.y + padding - (size / 2);
      
      svg += `  <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" stroke="#000" stroke-width="1" />\n`;
      svg += `  <text x="${x + (size / 2)}" y="${y + (size / 2)}" font-family="sans-serif" font-size="10" text-anchor="middle" dominant-baseline="central">${index + 1}</text>\n`;
    });
    
    // Add legend
    svg += `  <rect x="${padding}" y="${svgHeight - padding - 20}" width="${width}" height="15" fill="#f0e6d2" stroke="#000" stroke-width="1" />\n`;
    svg += `  <text x="${padding + 5}" y="${svgHeight - padding - 10}" font-family="sans-serif" font-size="10">Numbers correspond to building list below</text>\n`;
    
    // End SVG
    svg += `</svg>`;
    
    return svg;
  }

  /**
   * Creates a legend explaining the map colors
   */
  generateMapLegend(): string {
    let legend = `<div class="city-map-legend">\n`;
    legend += `  <h4>Map Legend</h4>\n`;
    legend += `  <ul>\n`;
    
    // Add building types
    const uniqueTypes: {[id: string]: {color: string, name: string}} = {
      'residence': {color: '#e6c88f', name: 'Residence'},
      'tavern': {color: '#bd9f7a', name: 'Tavern'},
      'blacksmith': {color: '#7a3923', name: 'Blacksmith'},
      'generalStore': {color: '#7e9e60', name: 'General Store'},
      'temple': {color: '#ccc5b9', name: 'Temple'},
      'townHall': {color: '#a39171', name: 'Town Hall'},
      'farm': {color: '#a5c882', name: 'Farm'},
      'bakery': {color: '#e6d7a9', name: 'Bakery'},
      'butcher': {color: '#c27d7d', name: 'Butcher'}
    };
    
    for (const [id, info] of Object.entries(uniqueTypes)) {
      legend += `    <li><span class="color-box" style="background-color: ${info.color}"></span> ${info.name}</li>\n`;
    }
    
    // Add road and water
    legend += `    <li><span class="color-box" style="background-color: #a67c52"></span> Road</li>\n`;
    legend += `    <li><span class="color-box" style="background-color: #4a89dc"></span> Water</li>\n`;
    
    legend += `  </ul>\n`;
    legend += `</div>`;
    
    return legend;
  }
}