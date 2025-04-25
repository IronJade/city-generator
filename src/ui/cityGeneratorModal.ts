import { App, Modal, MarkdownView, Notice } from 'obsidian';
import CityGeneratorPlugin from '../main';
import { NameGenerator } from '../generators/nameGenerator';

export class CityGeneratorModal extends Modal {
  plugin: CityGeneratorPlugin;
  cityName: string = '';
  selectedType: string = 'town';
  private nameGenerator: NameGenerator;

  constructor(app: App, plugin: CityGeneratorPlugin) {
    super(app);
    this.plugin = plugin;
    this.nameGenerator = new NameGenerator();
  }

  onOpen() {
    const { contentEl } = this;
    
    contentEl.createEl('h2', { text: 'Generate New City' });
    
    // Name input
    const nameContainer = contentEl.createDiv({ cls: 'city-generator-input' });
    nameContainer.createEl('label', { text: 'City Name:' });
    const nameInput = nameContainer.createEl('input', { 
      type: 'text',
      value: this.generateRandomCityName()
    });
    nameInput.addEventListener('input', (e) => {
      this.cityName = (e.target as HTMLInputElement).value;
    });
    this.cityName = nameInput.value;
    
    // Type selector
    const typeContainer = contentEl.createDiv({ cls: 'city-generator-input' });
    typeContainer.createEl('label', { text: 'Settlement Type:' });
    const typeSelect = typeContainer.createEl('select');
    
    this.plugin.settings.settlementTypes.forEach(type => {
      const option = typeSelect.createEl('option', {
        value: type.id,
        text: `${type.name} (${type.minPopulation}-${type.maxPopulation} people)`
      });
      
      if (type.id === 'town') {
        option.selected = true;
      }
    });
    
    typeSelect.addEventListener('change', (e) => {
      this.selectedType = (e.target as HTMLSelectElement).value;
    });
    this.selectedType = typeSelect.value;
    
    // Generate button
    const buttonContainer = contentEl.createDiv({ cls: 'city-generator-buttons' });
    const generateButton = buttonContainer.createEl('button', {
      text: 'Generate City',
      cls: 'mod-cta'
    });
    
    generateButton.addEventListener('click', async () => {
      try {
        if (!this.cityName) {
          new Notice('Please enter a city name');
          return;
        }
        
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
        new Notice('Failed to generate city: ' + (error as Error).message);
      }
    });
    
    // Random name button
    const randomNameButton = buttonContainer.createEl('button', {
      text: 'Random Name'
    });
    
    randomNameButton.addEventListener('click', () => {
      const randomName = this.generateRandomCityName();
      nameInput.value = randomName;
      this.cityName = randomName;
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  generateRandomCityName(): string {
    return this.nameGenerator.generateThemedName(this.selectedType || 'town');
  }
}