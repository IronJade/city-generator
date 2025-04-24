import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface CityGeneratorSettings {
	settlementTypes: SettlementType[];
	buildingTypes: BuildingType[];
	economyFactors: EconomyFactor[];
	mapSettings: MapSettings;
	lastGeneratedCity: City | null;
}

interface SettlementType {
	id: string;
	name: string;
	minPopulation: number;
	maxPopulation: number;
	minBuildings: number;
	maxBuildings: number;
	buildingDistribution: { [buildingTypeId: string]: number };
}

interface BuildingType {
	id: string;
	name: string;
	description: string;
	icon: string;
	possibleNames: string[];
	possibleOwners: string[];
	possibleWares: { wareId: string, probability: number }[];
}

interface EconomyFactor {
	id: string;
	name: string;
	description: string;
	waresModifiers: { [wareId: string]: number };
}

interface MapSettings {
	width: number;
	height: number;
	roadDensity: number;
	waterFeatureProbability: number;
}

interface City {
	id: string;
	name: string;
	type: string;
	population: number;
	buildings: Building[];
	layout: CityLayout;
	economy: Economy;
	generatedDate: string;
}

interface Building {
	id: string;
	typeId: string;
	name: string;
	owner: string;
	wares: Ware[];
	position: { x: number, y: number };
}

interface Ware {
	id: string;
	name: string;
	basePrice: number;
	currentPrice: number;
	quantity: number;
	quality: string;
	description: string;
}

interface CityLayout {
	width: number;
	height: number;
	roads: { start: { x: number, y: number }, end: { x: number, y: number } }[];
	waterFeatures: { type: string, points: { x: number, y: number }[] }[];
}

interface Economy {
	prosperity: number;
	mainExports: string[];
	mainImports: string[];
	priceModifiers: { [wareId: string]: number };
}

const DEFAULT_SETTINGS: CityGeneratorSettings = {
	settlementTypes: [
		{
			id: 'village',
			name: 'Village',
			minPopulation: 50,
			maxPopulation: 500,
			minBuildings: 5,
			maxBuildings: 20,
			buildingDistribution: {
				'residence': 60,
				'tavern': 10,
				'blacksmith': 10,
				'generalStore': 10,
				'farm': 10
			}
		},
		{
			id: 'town',
			name: 'Town',
			minPopulation: 500,
			maxPopulation: 5000,
			minBuildings: 20,
			maxBuildings: 100,
			buildingDistribution: {
				'residence': 50,
				'tavern': 10,
				'blacksmith': 5,
				'generalStore': 5,
				'tailor': 5,
				'temple': 5,
				'townHall': 5,
				'farm': 5,
				'bakery': 5,
				'butcher': 5
			}
		},
		{
			id: 'city',
			name: 'City',
			minPopulation: 5000,
			maxPopulation: 50000,
			minBuildings: 100,
			maxBuildings: 500,
			buildingDistribution: {
				'residence': 40,
				'tavern': 5,
				'blacksmith': 5,
				'generalStore': 5,
				'tailor': 5,
				'temple': 5,
				'cityHall': 5,
				'market': 5,
				'bakery': 5,
				'butcher': 5,
				'jeweler': 5,
				'library': 5,
				'alchemist': 5
			}
		}
	],
	buildingTypes: [
		{
			id: 'residence',
			name: 'Residence',
			description: 'A residential building where people live',
			icon: '🏠',
			possibleNames: ['Small House', 'Cottage', 'Apartment', 'Villa', 'Manor'],
			possibleOwners: ['Local Family', 'Retired Adventurer', 'Merchant', 'Craftsperson'],
			possibleWares: []
		},
		{
			id: 'tavern',
			name: 'Tavern',
			description: 'A place to drink, eat, and hear the latest rumors',
			icon: '🍺',
			possibleNames: ['The Prancing Pony', 'The Green Dragon', 'The Rusty Anchor', 'The Golden Goose'],
			possibleOwners: ['Jolly Barkeep', 'Retired Soldier', 'Local Family'],
			possibleWares: [
				{ wareId: 'ale', probability: 0.9 },
				{ wareId: 'wine', probability: 0.7 },
				{ wareId: 'meal', probability: 0.8 }
			]
		},
		{
			id: 'blacksmith',
			name: 'Blacksmith',
			description: 'A forge for creating and repairing metal items',
			icon: '⚒️',
			possibleNames: ['The Anvil', 'Red Forge', 'Hammer & Tongs', 'Steel Works'],
			possibleOwners: ['Burly Smith', 'Master Craftsman', 'Guild Member'],
			possibleWares: [
				{ wareId: 'sword', probability: 0.7 },
				{ wareId: 'armor', probability: 0.6 },
				{ wareId: 'tools', probability: 0.9 }
			]
		},
		{
			id: 'generalStore',
			name: 'General Store',
			description: 'A shop selling various common goods',
			icon: '🛒',
			possibleNames: ['Market Goods', 'Village Supplies', 'Trading Post', 'General Wares'],
			possibleOwners: ['Shopkeeper', 'Trading Family', 'Retired Explorer'],
			possibleWares: [
				{ wareId: 'rope', probability: 0.9 },
				{ wareId: 'lantern', probability: 0.8 },
				{ wareId: 'backpack', probability: 0.7 }
			]
		}
	],
	economyFactors: [
		{
			id: 'prosperity',
			name: 'Prosperity',
			description: 'The general economic wellbeing of the settlement',
			waresModifiers: {
				'ale': 0.2,
				'wine': 0.3,
				'meal': 0.1,
				'sword': 0.5,
				'armor': 0.6,
				'tools': 0.2,
				'rope': 0.1,
				'lantern': 0.2,
				'backpack': 0.3
			}
		},
		{
			id: 'tradeRoute',
			name: 'Trade Route',
			description: 'Whether the settlement is on a major trade route',
			waresModifiers: {
				'ale': -0.1,
				'wine': -0.2,
				'meal': -0.05,
				'sword': -0.2,
				'armor': -0.3,
				'tools': -0.1,
				'rope': -0.05,
				'lantern': -0.1,
				'backpack': -0.15
			}
		}
	],
	mapSettings: {
		width: 800,
		height: 600,
		roadDensity: 0.5,
		waterFeatureProbability: 0.3
	},
	lastGeneratedCity: null
};

export default class CityGeneratorPlugin extends Plugin {
	settings: CityGeneratorSettings;

	async onload() {
		await this.loadSettings();

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
		const settlementType = this.settings.settlementTypes.find(t => t.id === type);
		if (!settlementType) {
			throw new Error(`Settlement type ${type} not found`);
		}

		// Generate a unique ID
		const cityId = `city_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
		
		// Generate population
		const population = Math.floor(
			Math.random() * (settlementType.maxPopulation - settlementType.minPopulation) + 
			settlementType.minPopulation
		);
		
		// Determine number of buildings
		const buildingCount = Math.floor(
			Math.random() * (settlementType.maxBuildings - settlementType.minBuildings) + 
			settlementType.minBuildings
		);
		
		// Generate buildings
		const buildings: Building[] = [];
		for (let i = 0; i < buildingCount; i++) {
			// Determine building type based on distribution
			const buildingTypeId = this.determineRandomBuildingType(settlementType.buildingDistribution);
			const buildingType = this.settings.buildingTypes.find(t => t.id === buildingTypeId);
			
			if (buildingType) {
				// Generate a building of this type
				const building = this.generateBuilding(buildingType);
				buildings.push(building);
			}
		}
		
		// Generate city layout
		const layout = this.generateCityLayout(buildingCount);
		
		// Assign positions to buildings
		this.assignBuildingPositions(buildings, layout);
		
		// Generate economy
		const economy = this.generateEconomy(buildings);
		
		// Create the city object
		const city: City = {
			id: cityId,
			name: name,
			type: type,
			population: population,
			buildings: buildings,
			layout: layout,
			economy: economy,
			generatedDate: new Date().toISOString()
		};
		
		// Save as last generated city
		this.settings.lastGeneratedCity = city;
		this.saveSettings();
		
		return city;
	}

	determineRandomBuildingType(distribution: { [id: string]: number }): string {
		// Convert distribution to array of ranges
		const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
		let currentSum = 0;
		const ranges: { id: string, min: number, max: number }[] = [];
		
		for (const [id, value] of Object.entries(distribution)) {
			const normalizedValue = value / total;
			ranges.push({
				id: id,
				min: currentSum,
				max: currentSum + normalizedValue
			});
			currentSum += normalizedValue;
		}
		
		// Generate random number and find corresponding building type
		const random = Math.random();
		const selectedRange = ranges.find(range => random >= range.min && random < range.max);
		
		return selectedRange ? selectedRange.id : Object.keys(distribution)[0];
	}

	generateBuilding(buildingType: BuildingType): Building {
		// Generate a unique ID
		const buildingId = `building_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
		
		// Select a random name from possible names
		const nameIndex = Math.floor(Math.random() * buildingType.possibleNames.length);
		const name = buildingType.possibleNames[nameIndex];
		
		// Select a random owner from possible owners
		const ownerIndex = Math.floor(Math.random() * buildingType.possibleOwners.length);
		const owner = buildingType.possibleOwners[ownerIndex];
		
		// Generate wares based on probabilities
		const wares: Ware[] = [];
		buildingType.possibleWares.forEach(wareProb => {
			if (Math.random() < wareProb.probability) {
				const ware = this.generateWare(wareProb.wareId);
				if (ware) {
					wares.push(ware);
				}
			}
		});
		
		// Create the building object
		const building: Building = {
			id: buildingId,
			typeId: buildingType.id,
			name: name,
			owner: owner,
			wares: wares,
			position: { x: 0, y: 0 } // Will be assigned later
		};
		
		return building;
	}

	generateWare(wareId: string): Ware | null {
		// This would ideally come from a more extensive database
		const waresDatabase: { [id: string]: { name: string, basePrice: number, description: string } } = {
			'ale': { name: 'Ale', basePrice: 4, description: 'A mug of local brew' },
			'wine': { name: 'Wine', basePrice: 10, description: 'A bottle of wine' },
			'meal': { name: 'Hot Meal', basePrice: 5, description: 'A hot cooked meal' },
			'sword': { name: 'Sword', basePrice: 50, description: 'A metal sword' },
			'armor': { name: 'Armor', basePrice: 100, description: 'Protective gear' },
			'tools': { name: 'Tools', basePrice: 25, description: 'Crafting tools' },
			'rope': { name: 'Rope (50ft)', basePrice: 1, description: 'Sturdy hemp rope' },
			'lantern': { name: 'Lantern', basePrice: 5, description: 'A hooded lantern' },
			'backpack': { name: 'Backpack', basePrice: 2, description: 'A leather backpack' }
		};
		
		const wareTemplate = waresDatabase[wareId];
		if (!wareTemplate) {
			return null;
		}
		
		// Generate a quantity
		const quantity = Math.floor(Math.random() * 10) + 1;
		
		// Generate quality
		const qualities = ['Poor', 'Common', 'Good', 'Excellent', 'Masterwork'];
		const qualityIndex = Math.floor(Math.random() * qualities.length);
		const quality = qualities[qualityIndex];
		
		// Modify price based on quality
		const qualityModifier = 0.8 + (qualityIndex * 0.2);
		const currentPrice = Math.round(wareTemplate.basePrice * qualityModifier);
		
		// Create the ware object
		const ware: Ware = {
			id: wareId,
			name: wareTemplate.name,
			basePrice: wareTemplate.basePrice,
			currentPrice: currentPrice,
			quantity: quantity,
			quality: quality,
			description: wareTemplate.description
		};
		
		return ware;
	}

	generateCityLayout(buildingCount: number): CityLayout {
		const { width, height, roadDensity, waterFeatureProbability } = this.settings.mapSettings;
		
		// Calculate road count based on density and building count
		const roadCount = Math.floor(buildingCount * roadDensity / 10);
		
		// Generate roads
		const roads: { start: { x: number, y: number }, end: { x: number, y: number } }[] = [];
		for (let i = 0; i < roadCount; i++) {
			const road = {
				start: {
					x: Math.floor(Math.random() * width),
					y: Math.floor(Math.random() * height)
				},
				end: {
					x: Math.floor(Math.random() * width),
					y: Math.floor(Math.random() * height)
				}
			};
			roads.push(road);
		}
		
		// Generate water features
		const waterFeatures: { type: string, points: { x: number, y: number }[] }[] = [];
		if (Math.random() < waterFeatureProbability) {
			const waterType = Math.random() < 0.5 ? 'river' : 'lake';
			
			if (waterType === 'river') {
				// Generate a river (a line with multiple points)
				const riverPoints: { x: number, y: number }[] = [];
				const startX = Math.random() < 0.5 ? 0 : width;
				const startY = Math.floor(Math.random() * height);
				
				riverPoints.push({ x: startX, y: startY });
				
				// Add 3-5 additional points to make the river curve
				const pointCount = Math.floor(Math.random() * 3) + 3;
				for (let i = 0; i < pointCount; i++) {
					riverPoints.push({
						x: Math.floor(Math.random() * width),
						y: Math.floor(Math.random() * height)
					});
				}
				
				// End on the opposite side
				const endX = startX === 0 ? width : 0;
				const endY = Math.floor(Math.random() * height);
				riverPoints.push({ x: endX, y: endY });
				
				waterFeatures.push({
					type: 'river',
					points: riverPoints
				});
			} else {
				// Generate a lake (a circular set of points)
				const centerX = Math.floor(Math.random() * width);
				const centerY = Math.floor(Math.random() * height);
				const radius = Math.floor(Math.random() * (width / 6)) + (width / 12);
				
				const lakePoints: { x: number, y: number }[] = [];
				for (let angle = 0; angle < 360; angle += 30) {
					const radian = angle * Math.PI / 180;
					const x = centerX + Math.cos(radian) * radius;
					const y = centerY + Math.sin(radian) * radius;
					lakePoints.push({ x, y });
				}
				
				waterFeatures.push({
					type: 'lake',
					points: lakePoints
				});
			}
		}
		
		return {
			width,
			height,
			roads,
			waterFeatures
		};
	}

	assignBuildingPositions(buildings: Building[], layout: CityLayout) {
		// Create a grid to track occupied positions
		const grid: boolean[][] = Array(layout.height).fill(false).map(() => Array(layout.width).fill(false));
		
		// Mark road positions as occupied
		layout.roads.forEach(road => {
			// Simplified line-drawing to mark approximate road positions
			const dx = road.end.x - road.start.x;
			const dy = road.end.y - road.start.y;
			const steps = Math.max(Math.abs(dx), Math.abs(dy));
			
			for (let i = 0; i <= steps; i++) {
				const x = Math.floor(road.start.x + (dx * i / steps));
				const y = Math.floor(road.start.y + (dy * i / steps));
				
				if (x >= 0 && x < layout.width && y >= 0 && y < layout.height) {
					grid[y][x] = true;
				}
			}
		});
		
		// Mark water positions as occupied
		layout.waterFeatures.forEach(feature => {
			feature.points.forEach(point => {
				const x = Math.floor(point.x);
				const y = Math.floor(point.y);
				
				if (x >= 0 && x < layout.width && y >= 0 && y < layout.height) {
					grid[y][x] = true;
				}
			});
		});
		
		// Assign positions to buildings
		buildings.forEach(building => {
			let positioned = false;
			
			// Try to place buildings near roads for better layouts
			for (const road of layout.roads) {
				if (positioned) break;
				
				// Try positions near the road
				for (let dist = 1; dist <= 10; dist++) {
					const directions = [
						{ dx: dist, dy: 0 },
						{ dx: -dist, dy: 0 },
						{ dx: 0, dy: dist },
						{ dx: 0, dy: -dist }
					];
					
					for (const direction of directions) {
						const x = Math.floor(road.start.x + direction.dx);
						const y = Math.floor(road.start.y + direction.dy);
						
						if (x >= 0 && x < layout.width && y >= 0 && y < layout.height && !grid[y][x]) {
							building.position = { x, y };
							grid[y][x] = true;
							positioned = true;
							break;
						}
					}
					
					if (positioned) break;
				}
			}
			
			// If still not positioned, find any available spot
			if (!positioned) {
				let attempts = 0;
				while (!positioned && attempts < 100) {
					const x = Math.floor(Math.random() * layout.width);
					const y = Math.floor(Math.random() * layout.height);
					
					if (!grid[y][x]) {
						building.position = { x, y };
						grid[y][x] = true;
						positioned = true;
					}
					
					attempts++;
				}
				
				// Last resort if all else fails
				if (!positioned) {
					building.position = {
						x: Math.floor(Math.random() * layout.width),
						y: Math.floor(Math.random() * layout.height)
					};
				}
			}
		});
	}

	generateEconomy(buildings: Building[]): Economy {
		// Calculate prosperity based on building types
		const prosperityByBuildingType: { [type: string]: number } = {
			'residence': 0.5,
			'tavern': 1.0,
			'blacksmith': 1.5,
			'generalStore': 1.2,
			'temple': 1.3,
			'market': 2.0,
			'jeweler': 2.5
		};
		
		let prosperitySum = 0;
		let prosperityCount = 0;
		
		buildings.forEach(building => {
			const typeValue = prosperityByBuildingType[building.typeId];
			if (typeValue) {
				prosperitySum += typeValue;
				prosperityCount++;
			}
		});
		
		const prosperity = prosperityCount > 0 ? prosperitySum / prosperityCount : 1.0;
		
		// Determine main exports and imports
		const wareCountsByType: { [wareId: string]: number } = {};
		buildings.forEach(building => {
			building.wares.forEach(ware => {
				wareCountsByType[ware.id] = (wareCountsByType[ware.id] || 0) + 1;
			});
		});
		
		const waresEntries = Object.entries(wareCountsByType).sort((a, b) => b[1] - a[1]);
		const mainExports = waresEntries.slice(0, 3).map(entry => entry[0]);
		
		// Calculate imports (wares not commonly available)
		const allPossibleWares = new Set<string>();
		this.settings.buildingTypes.forEach(type => {
			type.possibleWares.forEach(ware => {
				allPossibleWares.add(ware.wareId);
			});
		});
		
		const mainImports = Array.from(allPossibleWares)
			.filter(wareId => !wareCountsByType[wareId] || wareCountsByType[wareId] < 2)
			.slice(0, 3);
		
		// Generate price modifiers
		const priceModifiers: { [wareId: string]: number } = {};
		
		// Apply prosperity to base prices
		for (const wareId of allPossibleWares) {
			let modifier = 1.0;
			
			// More expensive in prosperous cities
			modifier *= (0.8 + (prosperity * 0.2));
			
			// Exports are cheaper
			if (mainExports.includes(wareId)) {
				modifier *= 0.8;
			}
			
			// Imports are more expensive
			if (mainImports.includes(wareId)) {
				modifier *= 1.2;
			}
			
			// Apply economy factors
			this.settings.economyFactors.forEach(factor => {
				const factorModifier = factor.waresModifiers[wareId];
				if (factorModifier) {
					modifier += factorModifier;
				}
			});
			
			// Ensure modifier is within reasonable bounds
			modifier = Math.max(0.5, Math.min(modifier, 2.0));
			
			priceModifiers[wareId] = modifier;
		}
		
		return {
			prosperity,
			mainExports,
			mainImports,
			priceModifiers
		};
	}

	exportCityToJson(city: City): string {
		return JSON.stringify(city, null, 2);
	}

	importCityFromJson(json: string): City {
		try {
			const city = JSON.parse(json) as City;
			this.settings.lastGeneratedCity = city;
			this.saveSettings();
			return city;
		} catch (error) {
			console.error('Failed to parse city JSON', error);
			throw new Error('Invalid city JSON format');
		}
	}

	async renderCityToMarkdown(city: City): Promise<string> {
		// Create the city map SVG
		const mapSvg = this.generateCityMapSvg(city);
		
		// Generate buildings information
		const buildingsInfo = city.buildings.map(building => {
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
			`*Generated with City Generator plugin for Obsidian*\n\n` +
			`\`\`\`json\n${this.exportCityToJson(city)}\n\`\`\``;
		
		return markdown;
	}

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
			const buildingType = this.settings.buildingTypes.find(t => t.id === building.typeId);
			const icon = buildingType ? buildingType.icon : '🏢';
			
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
					default: color = '#8e8e8e';
				}
			}
			
			// Draw building (rect with icon)
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
}

class CityGeneratorModal extends Modal {
	plugin: CityGeneratorPlugin;
	cityName: string = '';
	selectedType: string = 'town';

	constructor(app: App, plugin: CityGeneratorPlugin) {
		super(app);
		this.plugin = plugin;
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
				new Notice('Failed to generate city: ' + error.message);
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
		const prefixes = ['Green', 'Red', 'Blue', 'Black', 'White', 'Silver', 'Gold', 'Iron', 'Stone', 'River', 'Lake', 'Hill', 'Mountain', 'East', 'West', 'North', 'South', 'Old', 'New', 'High', 'Low', 'Royal', 'Far'];
		const suffixes = ['wood', 'water', 'ford', 'bridge', 'ton', 'wick', 'ham', 'bury', 'field', 'vale', 'dale', 'haven', 'gate', 'cross', 'watch', 'port', 'harbor', 'keep', 'fall', 'spring', 'grove', 'ridge'];
		
		const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
		const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
		
		return prefix + suffix;
	}
}

class CityGeneratorSettingTab extends PluginSettingTab {
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
						
						// Get the active view
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