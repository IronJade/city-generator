import { App, PluginSettingTab, Setting, MarkdownView, Notice } from 'obsidian';
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
		
		// Settlement Types Section
		containerEl.createEl('h3', { text: 'Settlement Types' });
		
		const settlementTypeDiv = containerEl.createDiv({ cls: 'city-generator-settlement-types' });
		
		// Import/Export settings
		containerEl.createEl('h3', { text: 'Import/Export Settings' });
		
		new Setting(containerEl)
			.setName('Export Settings')
			.setDesc('Export all city generator settings as JSON')
			.addButton(button => button
				.setButtonText('Export')
				.onClick(() => {
					const jsonString = JSON.stringify(this.plugin.settings, null, 2);
					const blob = new Blob([jsonString], { type: 'application/json' });
					const url = URL.createObjectURL(blob);
					
					// Create a download link and click it
					const a = document.createElement('a');
					a.href = url;
					a.download = 'city-generator-settings.json';
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
				})
			);
		
		new Setting(containerEl)
			.setName('Import Settings')
			.setDesc('Import city generator settings from JSON')
			.addButton(button => button
				.setButtonText('Import')
				.onClick(() => {
					// Create file input and click it
					const input = document.createElement('input');
					input.type = 'file';
					input.accept = 'application/json';
					
					input.onchange = async (e) => {
						// @ts-ignore
						const file = e.target.files[0];
						if (file) {
							const reader = new FileReader();
							reader.onload = async (event) => {
								try {
									// @ts-ignore
									const settings = JSON.parse(event.target.result);
									this.plugin.settings = settings;
									await this.plugin.saveSettings();
									this.display(); // Refresh the settings tab
									new Notice('Settings imported successfully');
								} catch (error) {
									console.error('Failed to parse settings JSON', error);
									new Notice('Failed to import settings: Invalid JSON format');
								}
							};
							reader.readAsText(file);
						}
					};
					
					input.click();
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
						
						// Get the active view - Fix for TypeScript errors
						const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
						if (activeView) {
							activeView.editor.setValue(markdown);
							new Notice(`Opened ${city.name}!`);
						}
					})
				);
		}
	}
}