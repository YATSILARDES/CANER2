
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { SurveyData, Room, Appliance, ApplianceType, RadiatorModel, PricingItem, PricingSubItem, ExtraOffer, SelectableOption, Radiator, ApplianceDefinition } from './types';
import { APPLIANCE_DEFINITIONS, VENTILATION_CONSTANT_CM2_PER_KW, PIPE_DIAMETER_CHART, TOWEL_RAIL_SIZES, COMBI_MODELS, ALL_DEFAULT_ITEMS } from './constants';
import { ProjectInfoForm } from './components/ProjectInfoForm';
import { RoomList } from './components/RoomList';
import { ApplianceList } from './components/ApplianceList';
import { Summary } from './components/Summary';
import { Header } from './components/Header';
import { PricingForm } from './components/PricingForm';
import { CustomerProposal } from './components/CustomerProposal';
import { PriceList } from './components/PriceList';
import { calculateTotalConsumptionKw, calculateVentilationArea } from './services/calculationService';

const App: React.FC = () => {
    const [viewMode, setViewMode] = useState<'editor' | 'proposal' | 'pricelist'>('editor');
    
    // --- GLOBAL PRICE LIST STATE ---
    const [globalPrices, setGlobalPrices] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('global_combi_prices');
        return saved ? JSON.parse(saved) : {};
    });

    // Memoize the keys of globalPrices for autocomplete suggestions
    // Merge with ALL_DEFAULT_ITEMS to ensure suggestions are available even if no price is saved
    const priceListSuggestions = useMemo(() => {
        const savedKeys = Object.keys(globalPrices);
        return Array.from(new Set([...savedKeys, ...ALL_DEFAULT_ITEMS])).sort();
    }, [globalPrices]);

    const handleSaveGlobalPrices = useCallback((newPrices: Record<string, number>) => {
        setGlobalPrices(newPrices);
        localStorage.setItem('global_combi_prices', JSON.stringify(newPrices));
    }, []);

    // --- DYNAMIC APPLIANCE DEFINITIONS ---
    const [applianceDefinitions, setApplianceDefinitions] = useState<ApplianceDefinition[]>(() => {
        const saved = localStorage.getItem('appliance_definitions_v2');
        return saved ? JSON.parse(saved) : APPLIANCE_DEFINITIONS;
    });

    useEffect(() => {
        localStorage.setItem('appliance_definitions_v2', JSON.stringify(applianceDefinitions));
    }, [applianceDefinitions]);

    // --- DYNAMIC RADIATOR MODELS ---
    const [radiatorModels, setRadiatorModels] = useState<string[]>(() => {
        const saved = localStorage.getItem('radiator_models');
        return saved ? JSON.parse(saved) : ['DEMİRDÖKÜM', 'PİYASA'];
    });

    useEffect(() => {
        localStorage.setItem('radiator_models', JSON.stringify(radiatorModels));
    }, [radiatorModels]);

    const handleAddRadiatorModel = useCallback((name: string) => {
        const upperName = name.toUpperCase();
        if (!radiatorModels.includes(upperName)) {
            setRadiatorModels(prev => [...prev, upperName]);
        }
    }, [radiatorModels]);

    const handleDeleteRadiatorModel = useCallback((name: string) => {
        setRadiatorModels(prev => prev.filter(m => m !== name));
    }, []);

    // --- GENERIC APPLIANCE MODELS MAP (Replaces combiModels) ---
    // Structure: { "KOMBİ": ["Model A", "Model B"], "ISI POMPASI": ["Model X"] }
    const [applianceModelMap, setApplianceModelMap] = useState<Record<string, string[]>>(() => {
        const saved = localStorage.getItem('appliance_model_map_v1');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // Migration: Import old combi models if they exist
        const oldCombis = localStorage.getItem('combi_models_v2');
        const initialCombis = oldCombis ? JSON.parse(oldCombis) : COMBI_MODELS;

        return {
            'KOMBİ': initialCombis,
            // Initialize other types with empty arrays or defaults if needed
            'OCAK': [],
            'DOĞALGAZLI ŞOFBEN': [],
            'KAZAN': [],
            'RADYANT ISITICI': [],
            'ISI POMPASI': []
        };
    });

    useEffect(() => {
        localStorage.setItem('appliance_model_map_v1', JSON.stringify(applianceModelMap));
    }, [applianceModelMap]);

    const handleAddApplianceDefinition = useCallback((name?: string, consumptionKw: number = 0) => {
        const newName = name ? name.toUpperCase() : `YENİ CİHAZ TÜRÜ ${applianceDefinitions.length + 1}`;
        setApplianceDefinitions(prev => [...prev, { name: newName, type: newName, consumptionKw }]);
        // Also initialize an empty model list for this new type
        setApplianceModelMap(prev => ({ ...prev, [newName]: [] }));
    }, [applianceDefinitions]);

    const handleUpdateApplianceDefinition = useCallback((oldType: string, newName: string) => {
        if (!newName) return;
        const upperName = newName.toUpperCase();
        
        // Update definitions
        setApplianceDefinitions(prev => prev.map(d => d.type === oldType ? { ...d, name: upperName, type: upperName } : d));
        
        // Update model map key
        setApplianceModelMap(prev => {
            const newMap = { ...prev };
            if (newMap[oldType]) {
                newMap[upperName] = newMap[oldType];
                delete newMap[oldType];
            }
            return newMap;
        });

        // Update existing appliances in survey
        setSurveyData(prev => ({
            ...prev,
            appliances: prev.appliances.map(app => app.type === oldType ? { ...app, type: upperName } : app)
        }));

    }, []);

    const handleDeleteApplianceDefinition = useCallback((type: string) => {
        setApplianceDefinitions(prev => prev.filter(d => d.type !== type));
        setApplianceModelMap(prev => {
            const newMap = { ...prev };
            delete newMap[type];
            return newMap;
        });
    }, []);

    // --- GENERIC MODEL HANDLERS ---
    const handleAddModel = useCallback((type: string, modelName?: string) => {
        const upperType = type.toUpperCase();
        const existingModels = applianceModelMap[upperType] || [];
        const newModel = modelName ? modelName.toUpperCase() : `YENİ ${upperType} MODELİ ${existingModels.length + 1}`;
        
        setApplianceModelMap(prev => ({
            ...prev,
            [upperType]: [...(prev[upperType] || []), newModel]
        }));
    }, [applianceModelMap]);

    const handleUpdateModel = useCallback((type: string, oldModel: string, newModel: string) => {
        if (!newModel) return;
        const upperType = type.toUpperCase();
        const upperModel = newModel.toUpperCase();
        
        setApplianceModelMap(prev => ({
            ...prev,
            [upperType]: (prev[upperType] || []).map(m => m === oldModel ? upperModel : m)
        }));
    }, []);

    const handleDeleteModel = useCallback((type: string, model: string) => {
        const upperType = type.toUpperCase();
        setApplianceModelMap(prev => ({
            ...prev,
            [upperType]: (prev[upperType] || []).filter(m => m !== model)
        }));
    }, []);

    // --- INITIAL DATA LOADING WITH PERSISTENCE FOR CUSTOM NAMES ---
    const DEFAULT_PRICING_ITEMS: PricingItem[] = [
        // 1. İÇ TESİSAT MALZEMESİ
        { id: 1, name: 'İÇ TESİSAT MALZEMESİ', units: 1, rate: 9000, type: 'toggle' },
        
        // 2. PROJE BEDELİ
        { id: 2, name: 'PROJE BEDELİ', units: 1, rate: 1500, type: 'toggle' },
        
        // 3. CAM MENFEZİ (ID 4 in logic)
        { id: 4, name: 'CAM MENFEZİ', units: 1, rate: 250, type: 'toggle' }, 
        
        // 4. EXPROOF GAZ ALARM CİHAZI (ID 5 in logic)
        { id: 5, name: 'EXPROOF GAZ ALARM CİHAZI', units: 0, rate: 1200, type: 'toggle', description: '(CİHAZ VE MONTAJI)' },
        
        // 5. İŞÇİLİK (ID 6 in logic)
        { 
            id: 6, 
            name: 'İŞÇİLİK', 
            units: 1,
            rate: 5000, 
            type: 'selectableToggle',
            description: '(FULL TESİSAT, KOMBİ KOLLEKTÖR, PLASTİKSİZ FULL TESİSAT, KOMBİ MONTAJI, İÇ GAZ TESİSATI, İÇ GAZ KOMBİ MONTAJI, RADYATÖR MONTAJI, ISI POMPASI MONTAJI)',
            options: [
                { name: 'FULL TESİSAT', rate: 5000 },
                { name: 'KOMBİ KOLLEKTÖR', rate: 2000 },
                { name: 'PLASTİKSİZ FULL TESİSAT', rate: 6000 },
                { name: 'KOMBİ MONTAJI', rate: 1000 },
                { name: 'İÇ GAZ TESİSATI', rate: 2500 },
                { name: 'İÇ GAZ KOMBİ MONTAJI', rate: 3500 },
                { name: 'RADYATÖR MONTAJI', rate: 1500 },
                { name: 'ISI POMPASI MONTAJI', rate: 3000 },
            ],
            selectedOptionName: 'FULL TESİSAT'
        },

        // 6. KIRIM (ID 7 in logic)
        { 
            id: 7, 
            name: 'KIRIM', 
            units: 0,
            rate: 1000, 
            type: 'toggle',
            description: '(GEREKLİ KIRIM İŞLEMLERİ)'
        },

        // 7. ISITMA TESİSATI (ID 3 in logic)
        { 
            id: 3, 
            name: 'ISITMA TESİSATI', 
            units: 1,
            rate: 0, 
            type: 'selectableToggle', 
            description: '(KOMBİ KOLLEKTÖR, KOMBİ MONTAJI, FULL TESİSAT, RADYATÖR MONTAJI, İÇ GAZ KOMBİ MONTAJI, ISI POMPASI MONTAJI)',
            options: [
                { 
                    name: 'KOMBİ KOLLEKTÖR', 
                    rate: 0, 
                    defaultSubItems: [
                        { id: 's1', name: 'KOMBİ KOLLEKTÖR MALZEMESİ', units: 1, rate: 0 },
                        { id: 's2', name: 'DN32 PPRC BORU (METRE)', units: 1, rate: 0 },
                        { id: 's3', name: 'DN25 PPRC BORU (METRE)', units: 1, rate: 0 },
                        { id: 's4', name: 'DN20 PPRC BORU (METRE)', units: 1, rate: 0 },
                    ]
                },
                { 
                    name: 'KOMBİ MONTAJI', 
                    rate: 0,
                    defaultSubItems: [
                        { id: 's5', name: 'KOMBİ MONTAJ MALZEMESİ', units: 1, rate: 1500 },
                        { id: 's6', name: 'FLEX GRUBU', units: 1, rate: 400 },
                        { id: 's7', name: 'GAZ ALARM CİHAZI', units: 0, rate: 500 },
                        { id: 's8', name: 'KOMBİ DOLABI', units: 0, rate: 750 },
                        { id: 's9', name: 'EKSTRA BACA UZATMASI', units: 0, rate: 350 }
                    ]
                },
                { name: 'FULL TESİSAT', rate: 35000 },
                { 
                    name: 'PLASTİKSİZ FULL TESİSAT MONTAJI', 
                    rate: 0,
                    defaultSubItems: [
                        { id: 's10', name: 'KOMBİ MONTAJ MALZEMESİ', units: 1, rate: 0 },
                        { id: 's11', name: 'RADYATÖR MONTAJ MALZEMESİ', units: 1, rate: 0 },
                        { id: 's12', name: 'DN32 PPRC BORU (METRE)', units: 1, rate: 0 },
                        { id: 's13', name: 'DN25 PPRC BORU (METRE)', units: 1, rate: 0 },
                        { id: 's14', name: 'DN20 PPRC BORU (METRE)', units: 1, rate: 0 },
                    ]
                },
                { 
                    name: 'RADYATÖR MONTAJI', 
                    rate: 5000,
                    defaultSubItems: [
                        { id: 's15', name: 'DN20 - 1/2 DIŞ DİŞLİ ADAPTÖR', units: 1, rate: 5000 }
                    ]
                },
                {
                    name: 'İÇ GAZ KOMBİ MONTAJI',
                    rate: 3500,
                    defaultSubItems: [
                        { id: 's16', name: 'KOMBİ MONTAJ MALZEMESİ', units: 1, rate: 3500 }
                    ]
                },
                {
                    name: 'ISI POMPASI MONTAJI',
                    rate: 5000,
                    defaultSubItems: [
                        { id: 's17', name: 'ISI POMPASI MONTAJ MALZEMESİ', units: 1, rate: 0 },
                        { id: 's18', name: 'BUFFER TANK', units: 1, rate: 0 },
                        { id: 's19', name: 'GENLEŞME TANKI', units: 1, rate: 0 },
                        { id: 's20', name: 'DENGE KABI', units: 1, rate: 0 }
                    ]
                }
            ],
            selectedOptionName: 'KOMBİ KOLLEKTÖR',
            subItems: [
                { id: '1-1', name: 'KOMBİ KOLLEKTÖR MALZEMESİ', units: 1, rate: 0 },
                { id: '1-2', name: 'DN32 PPRC BORU (METRE)', units: 1, rate: 0 },
                { id: '1-3', name: 'DN25 PPRC BORU (METRE)', units: 1, rate: 0 },
                { id: '1-4', name: 'DN20 PPRC BORU (METRE)', units: 1, rate: 0 },
            ]
        },
    ];

    const [surveyData, setSurveyData] = useState<SurveyData>(() => {
        // Try to load the FULL survey template first
        const savedTemplate = localStorage.getItem('saved_survey_template');
        let data: SurveyData;

        if (savedTemplate) {
            try {
                data = JSON.parse(savedTemplate);
                
                // --- MIGRATION LOGIC FOR RADIATORS ---
                if (data.rooms && data.rooms.length > 0) {
                    data.rooms = data.rooms.map((room: any) => {
                        if (!room.radiators) {
                            return {
                                ...room,
                                radiators: [{ id: `rad-${Date.now()}`, length: room.selectedRadiatorLength || 0 }]
                            };
                        }
                        return room;
                    });
                }
                
                if (!data.pricingItems) data.pricingItems = DEFAULT_PRICING_ITEMS;

                return data;
            } catch (e) {
                console.error("Error loading template:", e);
            }
        }

        // Fallback
        const savedItems = localStorage.getItem('saved_pricing_items');
        const initialItems = savedItems ? JSON.parse(savedItems) : DEFAULT_PRICING_ITEMS;

        return {
            customerName: '',
            address: '',
            surveyDate: new Date().toISOString().split('T')[0],
            technicianName: '',
            phoneNumber: '',
            radiatorMeterPrice: 0,
            radiatorValvePrice: 0,
            extraOffers: [],
            finalBidPrice: undefined,
            rooms: [],
            appliances: [],
            pricingItems: initialItems,
        };
    });

    useEffect(() => {
        localStorage.setItem('saved_pricing_items', JSON.stringify(surveyData.pricingItems));
    }, [surveyData.pricingItems]);

    // --- TEMPLATE & FILE SAVE/LOAD HANDLERS ---

    const handleSaveTemplate = useCallback(() => {
        localStorage.setItem('saved_survey_template', JSON.stringify(surveyData));
        alert('Taslak tarayıcı hafızasına kaydedildi. Uygulamayı bir sonraki açışınızda bu veriler otomatik yüklenecek.');
    }, [surveyData]);

    const handleDownloadProject = useCallback(async () => {
        const fileName = `Proje_${surveyData.customerName.replace(/\s+/g, '_') || 'Taslak'}.json`;
        const jsonString = JSON.stringify(surveyData, null, 2);

        // 1. Modern API (Allows folder selection)
        if ('showSaveFilePicker' in window) {
            try {
                // @ts-ignore - Typescript might not know this API yet depending on config
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'Proje Dosyası',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(jsonString);
                await writable.close();
                return;
            } catch (err: any) {
                // Ignore if user cancelled
                if (err.name !== 'AbortError') {
                    console.error('Dosya kaydetme hatası:', err);
                    // Fallback to simple download on error
                } else {
                    return; 
                }
            }
        }

        // 2. Fallback (Standard Download)
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }, [surveyData]);

    const handleLoadProject = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedData = JSON.parse(content);
                
                // Basic validation
                if (parsedData.rooms && parsedData.pricingItems) {
                    setSurveyData(parsedData);
                    alert('Proje dosyası başarıyla yüklendi.');
                } else {
                    alert('Hata: Geçersiz proje dosyası formatı.');
                }
            } catch (error) {
                console.error("File parsing error:", error);
                alert('Hata: Dosya okunamadı.');
            }
        };
        reader.readAsText(file);
        // Reset input value to allow loading same file again if needed
        event.target.value = ''; 
    }, []);


    // --- AUTO SYNC PRICES FROM GLOBAL PRICE LIST ---
    useEffect(() => {
        if (Object.keys(globalPrices).length === 0) return;

        setSurveyData(prevData => {
            // 1. Sync Pricing Items
            const newPricingItems = prevData.pricingItems.map(item => {
                let newItem = { ...item };
                let mappedPrice = globalPrices[newItem.name];
                
                // Explicit Mappings for legacy/different naming conventions
                if (mappedPrice === undefined) {
                    if (newItem.name === 'CAM MENFEZİ') mappedPrice = globalPrices['CAM / DUVAR MENFEZİ AÇIMI'];
                    else if (newItem.name === 'KIRIM') mappedPrice = globalPrices['KAZIM İŞÇİLİĞİ'];
                    else if (newItem.name === 'PROJE BEDELİ') mappedPrice = globalPrices['PROJE BEDELİ'];
                    else if (newItem.name === 'İÇ TESİSAT MALZEMESİ') mappedPrice = globalPrices['İÇ GAZ TESİSATI (STANDART)'];
                    else if (newItem.name === 'EXPROOF GAZ ALARM CİHAZI') mappedPrice = globalPrices['EXPROOF GAZ ALARM CİHAZI'] || globalPrices['EXPROOF GAZ ALARM MONTAJI'];
                }
                
                if (mappedPrice !== undefined) {
                    newItem.rate = mappedPrice;
                }

                // Helper function to sync sub items
                const syncSubItems = (subItems: PricingSubItem[]) => {
                    return subItems.map(sub => {
                        let subPrice = globalPrices[sub.name];
                        
                        // Fallback mappings if exact name not found
                        if (subPrice === undefined) {
                            // CABINET SYNC FOR SUB ITEMS
                            if (sub.name === 'KOMBİ DOLABI' || sub.name === 'DOLAP') {
                                subPrice = globalPrices['KOMBİ DOLABI'] ?? 
                                           globalPrices['KOMBİ DOLABI (STANDART)'] ??
                                           globalPrices['KOMBİ KORUMA DOLABI'] ??
                                           globalPrices['SAÇ DOLAP'] ??
                                           globalPrices['DOLAP'];
                            }
                            else if (sub.name === 'GAZ ALARM CİHAZI') subPrice = globalPrices['GAZ ALARM CİHAZI'];
                            else if (sub.name.includes('DN32 PPRC')) subPrice = globalPrices['DN32 KOMPOZİT BORU (MT)'];
                            else if (sub.name.includes('DN25 PPRC')) subPrice = globalPrices['DN25 KOMPOZİT BORU (MT)'];
                            else if (sub.name.includes('DN20 PPRC')) subPrice = globalPrices['DN20 KOMPOZİT BORU (MT)'];
                            else if (sub.name === 'FLEX GRUBU') subPrice = globalPrices['OCAK FLEXİ 150 CM']; 
                            else if (sub.name === 'EKSTRA BACA UZATMASI') subPrice = globalPrices['BACA UZATMASI 50 CM (YOĞUŞMALI)'];
                        }

                        return subPrice !== undefined ? { ...sub, rate: subPrice } : sub;
                    });
                };

                if (newItem.options) {
                    newItem.options = newItem.options.map(opt => {
                        let optPrice = globalPrices[opt.name];
                        
                        // Mappings for Options
                        if (optPrice === undefined) {
                            if (opt.name === 'FULL TESİSAT') optPrice = globalPrices['FULL TESİSAT İŞÇİLİĞİ'];
                            else if (opt.name === 'PLASTİKSİZ FULL TESİSAT') optPrice = globalPrices['PLASTİKSİZ FULL TESİSAT'];
                            else if (opt.name === 'KOMBİ MONTAJI') optPrice = globalPrices['KOMBİ MONTAJI'];
                            else if (opt.name === 'RADYATÖR MONTAJI') optPrice = globalPrices['RADYATÖR MONTAJI (ADET)'];
                            else if (opt.name === 'İÇ GAZ TESİSATI') optPrice = globalPrices['İÇ GAZ TESİSATI İŞÇİLİĞİ'];
                            else if (opt.name === 'KOMBİ KOLLEKTÖR') optPrice = globalPrices['KOMBİ KOLLEKTÖR MONTAJI'];
                        }

                        // Sync Option's Default Sub Items
                        let newDefaultSubItems = opt.defaultSubItems;
                        if (newDefaultSubItems) {
                            newDefaultSubItems = syncSubItems(newDefaultSubItems);
                        }

                        if (optPrice !== undefined) {
                            return { ...opt, rate: optPrice, defaultSubItems: newDefaultSubItems };
                        }
                        return { ...opt, defaultSubItems: newDefaultSubItems };
                    });
                }

                // Sync Active Sub Items
                if (newItem.subItems) {
                    newItem.subItems = syncSubItems(newItem.subItems);
                }

                // Recalculate Rate if based on SubItems or Option
                if (newItem.selectedOptionName && newItem.options) {
                     const activeOpt = newItem.options.find(o => o.name === newItem.selectedOptionName);
                     if (activeOpt) {
                         if (newItem.subItems && newItem.subItems.length > 0) {
                              newItem.rate = newItem.subItems.reduce((sum, s) => sum + (s.units * s.rate), 0);
                         } else {
                              newItem.rate = activeOpt.rate;
                         }
                     }
                }

                return newItem;
            });

            // 2. Sync Appliances (Cabinet, Combi, Stove, etc.)
            const newAppliances = prevData.appliances.map(app => {
                let appPrice = app.price; // Start with existing price

                // A. Exact Match by Name (Model)
                if (globalPrices[app.name] !== undefined) {
                    appPrice = globalPrices[app.name];
                }
                // B. Match by Type (e.g., "OCAK", "KOMBİ DOLABI") if no model match
                else if (globalPrices[app.type] !== undefined) {
                    appPrice = globalPrices[app.type];
                }
                // C. Special Mappings for Appliances
                else if (app.type === ApplianceType.Cabinet || app.name === 'KOMBİ DOLABI' || app.name.includes('DOLAP')) {
                     // Try multiple variations for Cabinet
                     // Also try the Custom Label stored in LocalStorage for Cabinet
                     const customLabel = localStorage.getItem('cabinet_custom_label');
                     const cabinetPrice = (customLabel && globalPrices[customLabel]) ?? 
                                          globalPrices['KOMBİ DOLABI'] ?? 
                                          globalPrices['KOMBİ DOLABI (STANDART)'] ??
                                          globalPrices['KOMBİ KORUMA DOLABI'] ??
                                          globalPrices['SAÇ DOLAP'] ??
                                          globalPrices['DOLAP'];
                     
                     if (cabinetPrice !== undefined) appPrice = cabinetPrice;
                }
                else if (app.type === ApplianceType.Stove || app.name === 'OCAK') {
                     appPrice = globalPrices['OCAK (4 GÖZLÜ)'] !== undefined ? globalPrices['OCAK (4 GÖZLÜ)'] : appPrice;
                }

                return { ...app, price: appPrice };
            });

            // 3. Sync Radiator & Valve Prices
            let radMeter = prevData.radiatorMeterPrice;
            let radValve = prevData.radiatorValvePrice;

            // Try to find "DEMİR DÖKÜM PLUS RADYATÖR (MT)" or just "RADYATÖR (MT)"
            if (globalPrices['DEMİR DÖKÜM PLUS RADYATÖR (MT)'] !== undefined) radMeter = globalPrices['DEMİR DÖKÜM PLUS RADYATÖR (MT)'];
            else if (globalPrices['RADYATÖR (MT)'] !== undefined) radMeter = globalPrices['RADYATÖR (MT)'];

            // Try to find "RADYATÖR VANASI (KÖŞE)" or "RADYATÖR VANASI"
            if (globalPrices['RADYATÖR VANASI (KÖŞE)'] !== undefined) radValve = globalPrices['RADYATÖR VANASI (KÖŞE)'];
            else if (globalPrices['RADYATÖR VANASI'] !== undefined) radValve = globalPrices['RADYATÖR VANASI'];

            // 4. Sync Alternative Offers
            const newExtraOffers = prevData.extraOffers.map(offer => {
                let offerPrice = offer.price;
                if (globalPrices[offer.name] !== undefined) {
                    offerPrice = globalPrices[offer.name];
                }
                return { ...offer, price: offerPrice };
            });

            return {
                ...prevData,
                pricingItems: newPricingItems,
                appliances: newAppliances,
                radiatorMeterPrice: radMeter,
                radiatorValvePrice: radValve,
                extraOffers: newExtraOffers
            };
        });

    }, [globalPrices]);

    const handleProjectInfoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSurveyData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleRadiatorPriceChange = useCallback((field: 'radiatorMeterPrice' | 'radiatorValvePrice', value: number) => {
        setSurveyData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleFinalBidChange = useCallback((value: number) => {
        setSurveyData(prev => ({ ...prev, finalBidPrice: value }));
    }, []);

    const handlePricingItemChange = useCallback((itemId: number, newValues: Partial<PricingItem>) => {
        setSurveyData(prev => ({
            ...prev,
            pricingItems: prev.pricingItems.map(item => {
                if (item.id !== itemId) return item;

                const isSelectable = item.type === 'selectableToggle' || item.type === 'selectable';
                let updatedItem = { ...item, ...newValues };

                if (newValues.selectedOptionName && isSelectable && item.options) {
                    const selectedOpt = item.options.find(o => o.name === newValues.selectedOptionName);
                    if (selectedOpt) {
                        updatedItem.rate = selectedOpt.rate;
                        if (selectedOpt.defaultSubItems) {
                            updatedItem.subItems = selectedOpt.defaultSubItems.map((sub, idx) => ({
                                ...sub,
                                id: sub.id || `${itemId}-${Date.now()}-${idx}`
                            }));
                        } else {
                            updatedItem.subItems = [];
                        }
                    }
                }

                if (updatedItem.subItems && updatedItem.subItems.length > 0) {
                     const subItemsTotal = updatedItem.subItems.reduce((sum, sub) => sum + (sub.units * sub.rate), 0);
                     updatedItem.rate = subItemsTotal;
                }
                
                if (isSelectable && updatedItem.options && updatedItem.selectedOptionName) {
                    updatedItem.options = updatedItem.options.map(opt => {
                        if (opt.name === updatedItem.selectedOptionName) {
                            return {
                                ...opt,
                                rate: updatedItem.rate,
                                defaultSubItems: updatedItem.subItems ? updatedItem.subItems.map(s => ({...s})) : undefined 
                            };
                        }
                        return opt;
                    });
                }

                return updatedItem;
            }),
        }));
    }, []);

    const handleAddPricingItem = useCallback((name: string) => {
        setSurveyData(prev => ({
            ...prev,
            pricingItems: [
                ...prev.pricingItems,
                {
                    id: Date.now(),
                    name: name.toUpperCase(),
                    units: 1,
                    rate: 0,
                    type: 'toggle'
                }
            ]
        }));
    }, []);

    const handleDeletePricingItem = useCallback((id: number) => {
        setSurveyData(prev => ({
            ...prev,
            pricingItems: prev.pricingItems.filter(item => item.id !== id)
        }));
    }, []);

    const handleAddOption = useCallback((itemId: number, optionName: string) => {
        setSurveyData(prev => ({
            ...prev,
            pricingItems: prev.pricingItems.map(item => {
                if (item.id !== itemId) return item;
                const newOptions = [...(item.options || []), { name: optionName.toUpperCase(), rate: 0, defaultSubItems: [] }];
                const newSelected = item.selectedOptionName || optionName.toUpperCase();
                return {
                    ...item,
                    options: newOptions,
                    selectedOptionName: newSelected
                };
            })
        }));
    }, []);

    const handleDeleteOption = useCallback((itemId: number, optionName: string) => {
        setSurveyData(prev => ({
            ...prev,
            pricingItems: prev.pricingItems.map(item => {
                if (item.id !== itemId || !item.options) return item;
                const newOptions = item.options.filter(o => o.name !== optionName);
                let newSelected = item.selectedOptionName;
                let newRate = item.rate;
                let newSubItems = item.subItems;

                if (item.selectedOptionName === optionName) {
                     if (newOptions.length > 0) {
                         newSelected = newOptions[0].name;
                         newRate = newOptions[0].rate;
                         newSubItems = newOptions[0].defaultSubItems ? [...newOptions[0].defaultSubItems] : undefined;
                     } else {
                         newSelected = undefined;
                         newRate = 0;
                         newSubItems = undefined;
                     }
                }

                return {
                    ...item,
                    options: newOptions,
                    selectedOptionName: newSelected,
                    rate: newRate,
                    subItems: newSubItems
                };
            })
        }));
    }, []);

    const handleAddSubItem = useCallback((itemId: number, subItemName: string) => {
        setSurveyData(prev => ({
            ...prev,
            pricingItems: prev.pricingItems.map(item => {
                if (item.id !== itemId) return item;
                const newSubItem: PricingSubItem = {
                    id: `sub-${Date.now()}`,
                    name: subItemName.toUpperCase(),
                    units: 1,
                    rate: 0
                };
                const updatedSubItems = [...(item.subItems || []), newSubItem];
                let updatedOptions = item.options;
                if (item.selectedOptionName && item.options) {
                    updatedOptions = item.options.map(opt => {
                        if (opt.name === item.selectedOptionName) {
                            return {
                                ...opt,
                                defaultSubItems: [...(opt.defaultSubItems || []), newSubItem]
                            };
                        }
                        return opt;
                    });
                }
                return {
                    ...item,
                    subItems: updatedSubItems,
                    options: updatedOptions
                };
            })
        }));
    }, []);

    const handleDeleteSubItem = useCallback((itemId: number, subItemId: string) => {
        setSurveyData(prev => ({
            ...prev,
            pricingItems: prev.pricingItems.map(item => {
                if (item.id !== itemId) return item;
                const updatedSubItems = item.subItems?.filter(s => s.id !== subItemId);
                let updatedOptions = item.options;
                if (item.selectedOptionName && item.options) {
                    updatedOptions = item.options.map(opt => {
                        if (opt.name === item.selectedOptionName) {
                            return {
                                ...opt,
                                defaultSubItems: opt.defaultSubItems?.filter(s => s.id !== subItemId)
                            };
                        }
                        return opt;
                    });
                }
                return {
                    ...item,
                    subItems: updatedSubItems,
                    options: updatedOptions
                };
            })
        }));
    }, []);

    const addRoom = useCallback(() => {
        const newRoom: Room = {
            id: Date.now(),
            name: `ODA ${surveyData.rooms.length + 1}`,
            width: 0,
            length: 0,
            height: 2.8,
            heatLossCoefficient: 45,
            radiatorModel: 'DEMİRDÖKÜM', // Default
            radiators: [{ id: `rad-${Date.now()}`, length: 0 }],
            isTowelRail: false,
            towelRailSize: TOWEL_RAIL_SIZES[0],
            towelRailPrice: 0
        };
        setSurveyData(prev => ({ ...prev, rooms: [newRoom, ...prev.rooms] }));
    }, [surveyData.rooms.length]);

    const updateRoom = useCallback((roomId: number, field: keyof Room, value: string | number | boolean | Radiator[]) => {
        setSurveyData(prev => ({
            ...prev,
            rooms: prev.rooms.map(room => room.id === roomId ? { ...room, [field]: value } : room),
        }));
    }, []);
    
    const deleteRoom = useCallback((roomId: number) => {
        setSurveyData(prev => ({
            ...prev,
            rooms: prev.rooms.filter(room => room.id !== roomId),
        }));
    }, []);

    const addAppliance = useCallback((applianceType: ApplianceType | string, initialPrice: number = 0) => {
        const applianceDef = applianceDefinitions.find(def => def.type === applianceType);
        const defaultDef = { name: applianceType, type: applianceType, consumptionKw: 0 }; // Fallback
        const def = applianceDef || defaultDef;

        // DETERMINE PRICE FROM GLOBAL LIST OR INITIAL
        let priceToUse = initialPrice;

        // Check Global Prices with fallbacks
        // We check globalPrices immediately to ensure accurate pricing on add
        const customLabel = localStorage.getItem('cabinet_custom_label');
        const cabinetPrice = (customLabel && globalPrices[customLabel]) ?? 
                             globalPrices['KOMBİ DOLABI'] ?? 
                             globalPrices['KOMBİ DOLABI (STANDART)'];

        if (globalPrices[def.name] !== undefined) {
            priceToUse = globalPrices[def.name];
        } else if (globalPrices[applianceType] !== undefined) {
            priceToUse = globalPrices[applianceType];
        } else if ((applianceType === ApplianceType.Cabinet || def.name === 'KOMBİ DOLABI') && cabinetPrice !== undefined) {
             priceToUse = cabinetPrice;
        }

        const newAppliance: Appliance = {
            id: `app-${Date.now()}`,
            type: def.type,
            name: def.name,
            consumptionKw: def.consumptionKw,
            count: 1,
            price: priceToUse
        };

        setSurveyData(prev => ({ ...prev, appliances: [...prev.appliances, newAppliance]}));
    }, [applianceDefinitions, globalPrices]);

    const updateAppliance = useCallback((id: string, updates: Partial<Appliance>) => {
        setSurveyData(prev => ({
            ...prev,
            appliances: prev.appliances.map(app => app.id === id ? { ...app, ...updates } : app)
        }));
    }, []);

    const deleteAppliance = useCallback((applianceIndex: number) => {
        setSurveyData(prev => ({
            ...prev,
            appliances: prev.appliances.filter((_, index) => index !== applianceIndex),
        }));
    }, []);

    const addExtraOffer = useCallback((name: string, price: number) => {
        setSurveyData(prev => ({
            ...prev,
            extraOffers: [...(prev.extraOffers || []), { id: `extra-${Date.now()}`, name, price }]
        }));
    }, []);

    const deleteExtraOffer = useCallback((id: string) => {
        setSurveyData(prev => ({
            ...prev,
            extraOffers: (prev.extraOffers || []).filter(offer => offer.id !== id)
        }));
    }, []);
    
    const totalConsumptionKw = useMemo(() => calculateTotalConsumptionKw(surveyData.appliances), [surveyData.appliances]);
    const requiredVentilationCm2 = useMemo(() => calculateVentilationArea(totalConsumptionKw, VENTILATION_CONSTANT_CM2_PER_KW), [totalConsumptionKw]);
    
    const totalPricingCost = useMemo(() => {
        const pricingCost = surveyData.pricingItems.reduce((total, item) => {
            return total + (item.units * item.rate);
        }, 0);

        const appliancesCost = surveyData.appliances.reduce((total, app) => total + (app.count * app.price), 0);

        const totalRadiatorMeters = surveyData.rooms
            .filter(r => !r.isTowelRail)
            .reduce((sum, r) => {
                const roomTotal = r.radiators ? r.radiators.reduce((rSum, rad) => rSum + (rad.length || 0), 0) : 0;
                return sum + roomTotal;
            }, 0);
        
        const roomCountWithTowelRail = surveyData.rooms.filter(r => r.isTowelRail).length;
        
        const radiatorCount = surveyData.rooms
            .filter(r => !r.isTowelRail)
            .reduce((sum, r) => sum + (r.radiators ? r.radiators.length : 0), 0);

        const totalValves = (radiatorCount + roomCountWithTowelRail) * 2;

        const totalTowelRailCost = surveyData.rooms
            .filter(r => r.isTowelRail)
            .reduce((sum, r) => sum + (r.towelRailPrice || 0), 0);

        const radiatorCost = totalRadiatorMeters * surveyData.radiatorMeterPrice;
        const valveCost = totalValves * surveyData.radiatorValvePrice;

        return pricingCost + appliancesCost + radiatorCost + valveCost + totalTowelRailCost;
    }, [surveyData.pricingItems, surveyData.appliances, surveyData.rooms, surveyData.radiatorMeterPrice, surveyData.radiatorValvePrice]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <Header viewMode={viewMode} setViewMode={setViewMode} />
            
            {viewMode === 'editor' && (
                <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <ProjectInfoForm surveyData={surveyData} onChange={handleProjectInfoChange} />
                            
                            <PricingForm 
                                items={surveyData.pricingItems}
                                onItemChange={handlePricingItemChange}
                                onAddItem={handleAddPricingItem}
                                onDeleteItem={handleDeletePricingItem}
                                onAddOption={handleAddOption}
                                onDeleteOption={handleDeleteOption}
                                onAddSubItem={handleAddSubItem}
                                onDeleteSubItem={handleDeleteSubItem}
                                suggestions={priceListSuggestions} // Pass suggestions
                                globalPrices={globalPrices} // Pass global prices for instant lookup
                            />

                            <RoomList
                                rooms={surveyData.rooms}
                                onAddRoom={addRoom}
                                onUpdateRoom={updateRoom}
                                onDeleteRoom={deleteRoom}
                                radiatorMeterPrice={surveyData.radiatorMeterPrice}
                                radiatorValvePrice={surveyData.radiatorValvePrice}
                                onPriceChange={handleRadiatorPriceChange}
                                radiatorModels={radiatorModels}
                                onAddRadiatorModel={handleAddRadiatorModel}
                                onDeleteRadiatorModel={handleDeleteRadiatorModel}
                                suggestions={priceListSuggestions} // Pass suggestions
                            />

                            <ApplianceList 
                                appliances={surveyData.appliances}
                                extraOffers={surveyData.extraOffers}
                                onAddAppliance={addAppliance}
                                onUpdateAppliance={updateAppliance}
                                onDeleteAppliance={deleteAppliance}
                                onAddExtraOffer={addExtraOffer}
                                onDeleteExtraOffer={deleteExtraOffer}
                                globalPrices={globalPrices}
                                applianceDefinitions={applianceDefinitions}
                                applianceModelMap={applianceModelMap} 
                                onAddDefinition={handleAddApplianceDefinition}
                                onUpdateDefinition={handleUpdateApplianceDefinition}
                                onDeleteDefinition={handleDeleteApplianceDefinition}
                                onAddModel={handleAddModel} 
                                onUpdateModel={handleUpdateModel} 
                                onDeleteModel={handleDeleteModel} 
                                suggestions={priceListSuggestions} // Pass suggestions
                            />
                        </div>
                        <div className="lg:col-span-1 mt-6 lg:mt-0">
                             <Summary
                                totalConsumptionKw={totalConsumptionKw}
                                totalPricingCost={totalPricingCost}
                                surveyData={surveyData}
                                onFinalBidChange={handleFinalBidChange}
                                onSaveTemplate={handleSaveTemplate}
                                onDownloadProject={handleDownloadProject}
                                onLoadProject={handleLoadProject}
                            />
                        </div>
                    </div>
                </main>
            )}

            {viewMode === 'pricelist' && (
                 <main className="p-4 sm:p-6 lg:p-8">
                     <PriceList globalPrices={globalPrices} onSave={handleSaveGlobalPrices} />
                 </main>
            )}
            
            {viewMode === 'proposal' && (
                <main className="p-0 sm:p-8 flex justify-center bg-slate-200 min-h-screen">
                    <CustomerProposal 
                        surveyData={surveyData}
                        totalConsumptionKw={totalConsumptionKw}
                        totalPricingCost={surveyData.finalBidPrice || totalPricingCost} 
                    />
                </main>
            )}
        </div>
    );
};

export default App;
