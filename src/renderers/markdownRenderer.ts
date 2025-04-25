import { City, BuildingType, CityGeneratorSettings } from '../models/interfaces';
import { MapGenerator } from '../generators/mapGenerator';
import { SvgRenderer } from './svgRenderer';

export class MarkdownRenderer {
  private mapGenerator: MapGenerator;
  private svgRenderer: SvgRenderer;
  private settings: CityGeneratorSettings;

  constructor(mapGenerator: MapGenerator, svgRenderer: SvgRenderer, settings: CityGeneratorSettings) {
    this.mapGenerator = mapGenerator;
    this.svgRenderer = svgRenderer;
    this.settings = settings;
  }

  /**
   * Renders a city to markdown format
   */
  async renderCityToMarkdown(city: City): Promise<string> {
    // Create the city map SVG - using the generator's method
    const mapSvg = this.mapGenerator.generateCityMapSvg(city);
    
    // Generate buildings information
    const buildingsInfo = city.buildings.map((building) => {
      const buildingType = this.settings.buildingTypes.find(t => t.id === building.typeId);
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
    
    // Generate final markdown - Using HTML div for SVG rendering
    const markdown = `# ${city.name}\n\n` +
      `*A ${city.type} of ${city.population} residents*\n\n` +
      `*Generated: ${new Date(city.generatedDate).toLocaleDateString()}*\n\n` +
      `## Map\n\n` +
      `<div class="city-map">\n${mapSvg}\n</div>\n\n` +
      `${economyInfo}\n\n` +
      `## Buildings\n\n` +
      `${buildingsInfo}\n\n` +
      `---\n\n` +
      `*Generated with City Generator plugin for Obsidian*\n\n` +
      `\`\`\`json\n${this.exportCityToJson(city)}\n\`\`\``;
    
    return markdown;
  }

  /**
   * Export city to JSON
   */
  exportCityToJson(city: City): string {
    return JSON.stringify(city, null, 2);
  }
}