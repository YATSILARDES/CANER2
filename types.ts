
export enum ApplianceType {
    Combi = 'KOMBİ',
    Stove = 'OCAK',
    GasWaterHeater = 'DOĞALGAZLI ŞOFBEN',
    Boiler = 'KAZAN',
    RadiantHeater = 'RADYANT ISITICI',
    HeatPump = 'ISI POMPASI',
    Cabinet = 'KOMBİ DOLABI',
}

export enum RadiatorModel {
    Demirdokum = 'DEMİRDÖKÜM',
    Piyasa = 'PİYASA',
}

export type PricingItemType = 'numeric' | 'toggle' | 'selectableToggle' | 'selectable';

export interface PricingSubItem {
    id: string;
    name: string;
    units: number;
    rate: number;
    showInProposal?: boolean; // New field to control visibility in proposal
}

export interface SelectableOption {
    name: string;
    rate: number;
    defaultSubItems?: PricingSubItem[];
}

export interface Appliance {
    id: string;
    type: ApplianceType | string; // Allow custom strings
    name: string; 
    consumptionKw: number;
    count: number;
    price: number;
    subItems?: PricingSubItem[]; // Added subItems for appliances (e.g. Cabinet under Combi)
}

export interface Radiator {
    id: string;
    length: number;
}

export interface Room {
    id: number;
    name: string;
    width: number;
    length: number;
    height: number;
    heatLossCoefficient: number;
    radiatorModel: string; // Changed from enum to string to support dynamic models
    radiators: Radiator[]; 
    isTowelRail?: boolean;
    towelRailSize?: string; 
    towelRailPrice?: number; 
}

export interface PricingItem {
    id: number;
    name: string;
    units: number; 
    rate: number; 
    type: PricingItemType;
    description?: string;
    options?: SelectableOption[];
    selectedOptionName?: string;
    subItems?: PricingSubItem[]; 
}

export interface ExtraOffer {
    id: string;
    name: string;
    price: number;
}

export interface SurveyData {
    customerName: string;
    address: string;
    surveyDate: string;
    technicianName: string;
    phoneNumber: string; 
    rooms: Room[];
    appliances: Appliance[];
    pricingItems: PricingItem[];
    radiatorMeterPrice: number; 
    radiatorValvePrice: number; 
    extraOffers: ExtraOffer[];
    finalBidPrice?: number;
    agreedPrice?: number; // Added agreed price field
    proposalNote?: string; // Added proposal note field
}

export interface PipeDiameterRule {
    minKw: number;
    maxKw: number;
    diameter: string;
}

export interface ApplianceDefinition {
    name: string;
    type: string; // Changed from ApplianceType to string to allow custom types
    consumptionKw: number;
}
