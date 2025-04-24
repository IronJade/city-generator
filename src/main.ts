import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { CityGeneratorSettings, City } from './models/interfaces';
import { DEFAULT_SETTLEMENT_TYPES } from './data/settlementTypes';
import { DEFAULT_BUILDING_TYPES } from './data/buildingTypes';
import { DEFAULT_ECONOMY_FACTORS } from './data/economyFactors';
import { DEFAULT_MAP_SETTINGS } from './data/mapSettings';
import { CityGenerator } from './generators/cityGenerator';
import { CityGeneratorModal } from './ui/cityGeneratorModal';
import { CityGeneratorSettingTab } from './ui/settingsTab';

const DEFAULT_SETTINGS: CityGeneratorSettings = {
	settlementTypes: DEFAULT_SETTLEMENT_TYPES,
	buildingTypes: DEFAULT_BUILDING_TYPES,
	economyFactors: DEFAULT_ECONOMY_FACTORS,
	mapSettings: DEFAULT_MAP_SETTINGS,
	lastGeneratedCity: null
};

export default class CityGeneratorPlugin extends Plugin {
	settings: CityGeneratorSettings;
	cityGenerator: CityGenerator;

	async onload() {
		await this.loadSettings();
		
		// Initialize city generator
		this.cityGenerator = new CityGenerator(
			this.settings.settlementTypes,
			this.settings.buildingTypes,
			this.settings.economyFactors,
			this.settings.mapSettings
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

	/**
	 * Generates a city with the given type and name
	 * This delegates to the cityGenerator instance
	 */
	generateCity(type: string, name: string): City {
		// Generate the city
		const city = this.cityGenerator.generateCity(type, name);
		
		// Save as last generated city
		this.settings.lastGeneratedCity = city;
		this.saveSettings();
		
		return city;
	}

	/**
	 * Exports city data to JSON
	 */
	exportCityToJson(city: City): string {
		return this.cityGenerator.exportCityToJson(city);
	}

	/**
	 * Imports city from JSON
	 */
	importCityFromJson(json: string): City {
		try {
			const city = this.cityGenerator.importCityFromJson(json);
			this.settings.lastGeneratedCity = city;
			this.saveSettings();
			return city;
		} catch (error) {
			console.error('Failed to parse city JSON', error);
			throw new Error('Invalid city JSON format');
		}
	}

	/**
	 * Renders a city map as SVG
	 */
	renderCityMapSvg(city: City): string {
		return this.cityGenerator.renderCityMapSvg(city);
	}

	/**
	 * Renders a complete city to markdown
	 */
	async renderCityToMarkdown(city: City): Promise<string> {
		return this.cityGenerator.renderCityToMarkdown(city);
	}
}