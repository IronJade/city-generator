// src/ui/cityGeneratorModal.ts

import { App, Modal, Setting, Notice, MarkdownView } from 'obsidian';
import CityGeneratorPlugin from '../main';
import { NameGenerator } from '../generators/nameGenerator';

export class CityGeneratorModal extends Modal {
  plugin: CityGeneratorPlugin;
  cityName: string = '';
  selectedType: string = 'town';
  includeWater: boolean = true;
  previewSvg: string = '';
  nameGenerator: NameGenerator;

  constructor(app: App, plugin: CityGeneratorPlugin) {
    super(app);
    this.plugin = plugin;
    this.nameGenerator = new NameGenerator();
    this.cityName = this.nameGenerator.generateThemedName('town');
  }

  onOpen() {
    const { contentEl } = this;
    
    contentEl.createEl('h2', { text: 'Generate New Settlement' });
    
    // Create a two-column layout
    const container = contentEl.createDiv({ cls: 'city-generator-container' });
    const leftColumn = container.createDiv({ cls: 'city-generator-column' });
    const rightColumn = container.createDiv({ cls: 'city-generator-column' });
    
    // Left column - Settings
    this.createSettingsArea(leftColumn);
    
    // Right column - Preview & buttons
    this.createPreviewArea(rightColumn);
    
    // Generate a preview
    this.updatePreview();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  createSettingsArea(containerEl: HTMLElement) {
    // Name input
    new Setting(containerEl)
      .setName('Settlement Name')
      .setDesc('The name of your settlement')
      .addText(text => text
        .setValue(this.cityName)
        .onChange(value => {
          this.cityName = value;
        }))
      .addExtraButton(button => button
        .setIcon('dice')
        .setTooltip('Generate Random Name')
        .onClick(() => {
          const randomName = this.nameGenerator.generateThemedName(this.selectedType);
          const nameInput = containerEl.querySelector('.setting-item input') as HTMLInputElement;
          if (nameInput) {
            nameInput.value = randomName;
            this.cityName = randomName;
          }
        }));
    
    // Type selector
    new Setting(containerEl)
      .setName('Settlement Type')
      .setDesc('The size and type of your settlement')
      .addDropdown(dropdown => {
        this.plugin.settings.settlementTypes.forEach(type => {
          dropdown.addOption(type.id, `${type.name} (${type.minPopulation}-${type.maxPopulation} people)`);
        });
        
        dropdown.setValue(this.selectedType);
        dropdown.onChange(value => {
          this.selectedType = value;
          this.updatePreview();
        });
      });
    
    // Include water feature option
    new Setting(containerEl)
      .setName('Include Water Features')
      .setDesc('Add rivers, lakes, or coastal features to the map')
      .addToggle(toggle => toggle
        .setValue(this.includeWater)
        .onChange(value => {
          this.includeWater = value;
          // Save to settings temporarily
          const originalWaterProb = this.plugin.settings.mapSettings.waterFeatureProbability;
          this.plugin.settings.mapSettings.waterFeatureProbability = value ? 0.8 : 0;
          this.updatePreview();
          // Restore original setting
          setTimeout(() => {
            this.plugin.settings.mapSettings.waterFeatureProbability = originalWaterProb;
          }, 100);
        }));
    
    // Advanced options - Road density
    new Setting(containerEl)
      .setName('Road Density')
      .setDesc('How many roads should appear in the settlement')
      .addSlider(slider => slider
        .setLimits(0.2, 1, 0.1)
        .setValue(this.plugin.settings.mapSettings.roadDensity)
        .setDynamicTooltip()
        .onChange(value => {
          // Temporarily update setting for preview
          const originalDensity = this.plugin.settings.mapSettings.roadDensity;
          this.plugin.settings.mapSettings.roadDensity = value;
          this.updatePreview();
          // Restore original setting
          setTimeout(() => {
            this.plugin.settings.mapSettings.roadDensity = originalDensity;
          }, 100);
        }));
  }

  createPreviewArea(containerEl: HTMLElement) {
    // Preview header
    containerEl.createEl('h3', { text: 'Map Preview' });
    
    // Preview container
    const previewContainer = containerEl.createDiv({ cls: 'city-generator-preview' });
    
    // Buttons container
    const buttonContainer = containerEl.createDiv({ cls: 'city-generator-buttons' });
    
    // Refresh preview button
    const refreshButton = buttonContainer.createEl('button', {
      text: 'Refresh Preview',
      cls: 'mod-cta'
    });
    
    refreshButton.addEventListener('click', () => {
      this.updatePreview();
    });
    
    // Generate button
    const generateButton = buttonContainer.createEl('button', {
      text: 'Generate Settlement',
      cls: 'mod-cta'
    });
    
    generateButton.addEventListener('click', async () => {
      try {
        if (!this.cityName) {
          new Notice('Please enter a settlement name');
          return;
        }
        
        // Show generating message
        new Notice(`Generating ${this.cityName}...`);
        
        // Generate the city
        const city = this.plugin.generateCity(this.selectedType, this.cityName);
        
        // Generate markdown content
        const markdown = await this.plugin.renderCityToMarkdown(city);
        
        // Create new note with the content
        await this.app.workspace.openLinkText(
          this.cityName.replace(/\s+/g, '-'),
          '',
          true,
          { state: { mode: 'source' } }
        );
        
        // Get the active view
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
          activeView.editor.setValue(markdown);
          new Notice(`Generated ${this.cityName}!`);
        }
        
        this.close();
      } catch (error) {
        console.error('Failed to generate city', error);
        new Notice('Failed to generate settlement: ' + (error as Error).message);
      }
    });
  }

  updatePreview() {
    try {
      // Generate a small temporary city for the preview
      const previewMapSettings = { ...this.plugin.settings.mapSettings };
      previewMapSettings.width = 400;
      previewMapSettings.height = 300;
      
      // Store original settings
      const originalMapSettings = { ...this.plugin.settings.mapSettings };
      
      // Set temporary settings
      this.plugin.settings.mapSettings = previewMapSettings;
      
      // Generate a smaller city for preview
      const settlementType = this.plugin.settings.settlementTypes.find(t => t.id === this.selectedType);
      if (!settlementType) throw new Error('Invalid settlement type');
      
      // Generate a preview city
      const previewCity = this.plugin.generateCity(this.selectedType, this.cityName || 'Preview');
      
      // Get SVG
      const previewSvg = this.plugin.renderCityMapSvg(previewCity);
      
      // Update the preview container
      const previewContainer = this.contentEl.querySelector('.city-generator-preview');
      if (previewContainer) {
        previewContainer.innerHTML = previewSvg;
      }
      
      // Restore original settings
      this.plugin.settings.mapSettings = originalMapSettings;
      
    } catch (error) {
      console.error('Failed to generate preview', error);
      
      // Show error message in preview area
      const previewContainer = this.contentEl.querySelector('.city-generator-preview');
      if (previewContainer) {
        previewContainer.innerHTML = `<div class="city-generator-preview-error">
          <p>Failed to generate preview: ${(error as Error).message}</p>
        </div>`;
      }
    }
  }
}