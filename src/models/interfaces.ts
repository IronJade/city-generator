// Core interfaces for the City Generator plugin

export interface CityGeneratorSettings {
    settlementTypes: SettlementType[];
    buildingTypes: BuildingType[];
    economyFactors: EconomyFactor[];
    mapSettings: MapSettings;
    lastGeneratedCity: City | null;
  }
  
  export interface SettlementType {
    id: string;
    name: string;
    minPopulation: number;
    maxPopulation: number;
    minBuildings: number;
    maxBuildings: number;
    buildingDistribution: { [buildingTypeId: string]: number };
  }
  
  export interface BuildingType {
    id: string;
    name: string;
    description: string;
    icon: string;
    possibleNames: string[];
    possibleOwners: string[];
    possibleWares: { wareId: string, probability: number }[];
  }
  
  export interface EconomyFactor {
    id: string;
    name: string;
    description: string;
    waresModifiers: { [wareId: string]: number };
  }
  
  export interface MapSettings {
    width: number;
    height: number;
    roadDensity: number;
    waterFeatureProbability: number;
  }
  
  export interface City {
    id: string;
    name: string;
    type: string;
    population: number;
    buildings: Building[];
    layout: CityLayout;
    economy: Economy;
    generatedDate: string;
  }
  
  export interface Building {
    id: string;
    typeId: string;
    name: string;
    owner: string;
    wares: Ware[];
    position: { x: number, y: number };
  }
  
  export interface Ware {
    id: string;
    name: string;
    basePrice: number;
    currentPrice: number;
    quantity: number;
    quality: string;
    description: string;
  }
  
  export interface CityLayout {
    width: number;
    height: number;
    roads: { start: { x: number, y: number }, end: { x: number, y: number } }[];
    waterFeatures: { type: string, points: { x: number, y: number }[] }[];
  }
  
  export interface Economy {
    prosperity: number;
    mainExports: string[];
    mainImports: string[];
    priceModifiers: { [wareId: string]: number };
  }
  
  export interface District {
    x: number;
    y: number;
    radius: number;
  }
  
  export interface WareDatabase {
    [id: string]: {
      name: string;
      basePrice: number;
      description: string;
    };
  }