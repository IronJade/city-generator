// src/renderers/markdownRenderer.ts

import { City, BuildingType } from '../models/interfaces';
import { SvgRenderer } from './svgRenderer';

export class MarkdownRenderer {
  private svgRenderer: SvgRenderer;
  private buildingTypes: BuildingType[];

  constructor(buildingTypes: BuildingType[]) {
    this.svgRenderer = new SvgRenderer();
    this.buildingTypes = buildingTypes;
  }

  /**
   * Renders a city to markdown format
   */
  renderCityToMarkdown(city: City): string {
    // Create the city map SVG
    const mapSvg = this.svgRenderer.generateCityMapSvg(city, this.buildingTypes);
    
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
      `*Generated with City Generator plugin for Obsidian*\n`;
    
    return markdown;
  }

  /**
   * Renders a compact city summary for preview
   */
  renderCitySummary(city: City): string {
    // Create a smaller version of the map
    const mapSvg = this.svgRenderer.generateCityMapSvg(city, this.buildingTypes);
    
    // Generate a summary of the city
    const buildingCounts: { [type: string]: number } = {};
    city.buildings.forEach(building => {
      buildingCounts[building.typeId] = (buildingCounts[building.typeId] || 0) + 1;
    });
    
    const buildingSummary = Object.entries(buildingCounts)
      .map(([typeId, count]) => {
        const type = this.buildingTypes.find(t => t.id === typeId);
        return `${type?.icon || '🏢'} ${type?.name || typeId}: ${count}`;
      })
      .join(', ');
    
    // Generate a compact summary
    const summary = `# ${city.name}\n\n` +
      `*A ${city.type} with ${city.population} residents*\n\n` +
      `## Map\n\n` +
      `\`\`\`svg\n${mapSvg}\n\`\`\`\n\n` +
      `**Buildings:** ${buildingSummary}\n\n` + 
      `**Prosperity:** ${city.economy.prosperity.toFixed(1)}\n\n` +
      `**Main Exports:** ${city.economy.mainExports.join(', ')}\n\n` +
      `**Main Imports:** ${city.economy.mainImports.join(', ')}\n\n`;
    
    return summary;
  }
}