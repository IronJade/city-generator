// src/ui/settingsTab.ts

import { App, PluginSettingTab, Setting } from 'obsidian';
import CityGeneratorPlugin from '../main';

export class CityGeneratorSettingTab extends PluginSettingTab {
  plugin: CityGeneratorPlugin;

  constructor(app: App, plugin: CityGeneratorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'City Generator Settings' });
    
    // Map Settings
    containerEl.createEl('h3', { text: 'Map Settings' });
    
    new Setting(containerEl)
      .setName('Map Width')
      .setDesc('Width of generated maps in pixels')
      .addSlider(slider => slider
        .setLimits(400, 1200, 100)
        .setValue(this.plugin.settings.mapSettings.width)
        .onChange(async (value) => {
          this.plugin.settings.mapSettings.width = value;
          await this.plugin.saveSettings();
        })
      );
    
    new Setting(containerEl)
      .setName('Map Height')
      .setDesc('Height of generated maps in pixels')
      .addSlider(slider => slider
        .setLimits(300, 900, 100)
        .setValue(this.plugin.settings.mapSettings.height)
        .onChange(async (value) => {
          this.plugin.settings.mapSettings.height = value;
          await this.plugin.saveSettings();
        })
      );
    
    new Setting(containerEl)
      .setName('Road Density')
      .setDesc('Density of roads in the settlement (0.1 = few roads, 1.0 = many roads)')
      .addSlider(slider => slider
        .setLimits(0.1, 1, 0.1)
        .setValue(this.plugin.settings.mapSettings.roadDensity)
        .onChange(async (value) => {
          this.plugin.settings.mapSettings.roadDensity = value;
          await this.plugin.saveSettings();
        })
      );
    
    new Setting(containerEl)
      .setName('Water Feature Probability')
      .setDesc('Chance of including rivers or lakes (0 = never, 1 = always)')
      .addSlider(slider => slider
        .setLimits(0, 1, 0.1)
        .setValue(this.plugin.settings.mapSettings.waterFeatureProbability)
        .onChange(async (value) => {
          this.plugin.settings.mapSettings.waterFeatureProbability = value;
          await this.plugin.saveSettings();
        })
      );
    
    // Add info about last generated city
    if (this.plugin.settings.lastGeneratedCity) {
      const city = this.plugin.settings.lastGeneratedCity;
      
      containerEl.createEl('h3', { text: 'Last Generated City' });
      
      const cityInfo = containerEl.createDiv({ cls: 'city-generator-last-city' });
      cityInfo.createEl('p', { text: `${city.name} (${city.type})` });
      cityInfo.createEl('p', { text: `Population: ${city.population}` });
      cityInfo.createEl('p', { text: `Buildings: ${city.buildings.length}` });
      cityInfo.createEl('p', { text: `Generated: ${new Date(city.generatedDate).toLocaleString()}` });
      
      new Setting(containerEl)
        .setName('Re-open Last Generated City')
        .setDesc('Open the last generated city in a new note')
        .addButton(button => button
          .setButtonText('Open')
          .onClick(async () => {
            // Generate markdown content
            const markdown = await this.plugin.renderCityToMarkdown(city);
            
            // Create new note with the content
            await this.app.workspace.openLinkText(
              city.name.replace(/\s+/g, '-'),
              '',
              true,
              { state: { mode: 'source' } }
            );
            
            // Get the active view
            const activeView = this.app.workspace.getActiveViewOfType('markdown');
            if (activeView && activeView.editor) {
              activeView.editor.setValue(markdown);
              new Notice(`Opened ${city.name}!`);
            }
          })
        );
    }
  }
}