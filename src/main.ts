import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { CityGeneratorModal } from './ui/cityGeneratorModal';
import { CityGeneratorSettingTab } from './ui/settingsTab';
import { CityGenerator } from './generators/cityGenerator';
import { MapGenerator } from './generators/mapGenerator';
import { SvgRenderer } from './renderers/svgRenderer';
import { MarkdownRenderer } from './renderers/markdownRenderer';
import { DEFAULT_SETTLEMENT_TYPES } from './data/settlementTypes';
import { DEFAULT_BUILDING_TYPES } from './data/buildingTypes';
import { DEFAULT_ECONOMY_FACTORS } from './data/economyFactors';
import { DEFAULT_MAP_SETTINGS } from './data/mapSettings';
import { City, CityGeneratorSettings } from './models/interfaces';

const DEFAULT_SETTINGS: CityGeneratorSettings = {
  settlementTypes: DEFAULT_SETTLEMENT_TYPES,
  buildingTypes: DEFAULT_BUILDING_TYPES,
  economyFactors: DEFAULT_ECONOMY_FACTORS,
  mapSettings: DEFAULT_MAP_SETTINGS,
  lastGeneratedCity: null
};

export default class CityGeneratorPlugin extends Plugin {
  settings: CityGeneratorSettings;
  private cityGenerator: CityGenerator;
  private mapGenerator: MapGenerator;
  private svgRenderer: SvgRenderer;
  private markdownRenderer: MarkdownRenderer;

  async onload() {
    await this.loadSettings();

    // Initialize generators and renderers
    this.cityGenerator = new CityGenerator(
      this.settings.settlementTypes,
      this.settings.buildingTypes,
      this.settings.economyFactors,
      this.settings.mapSettings
    );
    
    this.mapGenerator = new MapGenerator(this.settings.buildingTypes);
    this.svgRenderer = new SvgRenderer();
    this.markdownRenderer = new MarkdownRenderer(
      this.mapGenerator, 
      this.svgRenderer, 
      this.settings
    );

    // Add a ribbon icon
    this.addRibbonIcon('map', 'Generate City', () => {
      new CityGeneratorModal(this.app, this).open();
    });

    // Add a command to generate city
    this.addCommand({
      id: 'generate-city',
      name: 'Generate City',
      callback: () => {
        new CityGeneratorModal(this.app, this).open();
      }
    });

    // Register the settings tab
    this.addSettingTab(new CityGeneratorSettingTab(this.app, this));
  }

  onunload() {
    console.log('Unloading City Generator plugin');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  generateCity(type: string, name: string): City {
    const city = this.cityGenerator.generateCity(type, name);
    
    // Save as last generated city
    this.settings.lastGeneratedCity = city;
    this.saveSettings();
    
    return city;
  }

  exportCityToJson(city: City): string {
    return this.cityGenerator.exportCityToJson(city);
  }

  importCityFromJson(json: string): City {
    const city = this.cityGenerator.importCityFromJson(json);
    
    // Save as last generated city
    this.settings.lastGeneratedCity = city;
    this.saveSettings();
    
    return city;
  }

  async renderCityToMarkdown(city: City): Promise<string> {
    return this.markdownRenderer.renderCityToMarkdown(city);
  }
}