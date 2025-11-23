
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

    // --- GENERIC APPLIANCE MODELS MAP ---
    const [applianceModelMap, setApplianceModelMap] = useState<Record<string, string[]>>(() => {
        const saved = localStorage.getItem('appliance_model_map_v1');
        if (saved) {
            return JSON.parse(saved);
        }
        const oldCombis = localStorage.getItem('combi_models_v2');
        const initialCombis = oldCombis ? JSON.parse(oldCombis) : COMBI_MODELS;

        return {
            'KOMBİ': initialCombis,
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
        setApplianceModelMap(prev => ({ ...prev, [newName]: [] }));
    }, [applianceDefinitions]);

    const handleUpdateApplianceDefinition = useCallback((oldType: string, newName: string) => {
        if (!newName) return;
        const upperName = newName.toUpperCase();
        
        setApplianceDefinitions(prev => prev.map(d => d.type === oldType ? { ...d, name: upperName, type: upperName } : d));
        
        setApplianceModelMap(prev => {
            const newMap = { ...prev };
            if (newMap[oldType]) {
                newMap[upperName] = newMap[oldType];
                delete newMap[oldType];
            }
            return newMap;
        });

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

    // --- INITIAL DATA LOADING ---
    const LABOR_SUB_ITEMS_DEFAULT: PricingSubItem[] = [
        { id: 's-kirim', name: 'KIRIM', units: 0, rate: 1000, showInProposal: false },
        { id: 's-kaynak', name: 'KAYNAKLI DIŞ BAĞLANTI', units: 0, rate: 1500, showInProposal: false }
    ];

    const DEFAULT_PRICING_ITEMS: PricingItem[] = [
        { 
            id: 1, 
            name: 'İÇ TESİSAT MALZEMESİ', 
            units: 1, 
            rate: 0, 
            type: 'toggle', 
            subItems: [
                { id: 's-boru', name: 'DOĞALGAZ TESİSAT MALZEMESİ VE BORULAMA', units: 1, rate: 0, showInProposal: true },
                { id: 's-proje', name: 'MÜHENDİSLİK HİZMETLERİ (PROJE ÇİZİMİ VE GAZ AÇIMI)', units: 1, rate: 1500, showInProposal: true },
                { id: 's-menfez', name: 'CAM MENFEZİ VE ELEKTRİK ŞALTERİ MONTAJI', units: 1, rate: 250, showInProposal: true },
                { id: 's-exproof', name: 'EXPROOF GAZ ALARM CİHAZI (SELENOİD VANA BAĞLANTILI) MONTAJI', units: 0, rate: 1200, showInProposal: true }
            ]
        },
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
                        { id: 's1', name: 'KOMBİ KOLLEKTÖR MALZEMESİ', units: 1, rate: 0, showInProposal: false },
                        { id: 's2', name: 'DN32 PPRC BORU (METRE)', units: 1, rate: 0, showInProposal: false },
                        { id: 's3', name: 'DN25 PPRC BORU (METRE)', units: 1, rate: 0, showInProposal: false },
                        { id: 's4', name: 'DN20 PPRC BORU (METRE)', units: 1, rate: 0, showInProposal: false },
                    ]
                },
                { 
                    name: 'KOMBİ MONTAJI', 
                    rate: 0,
                    defaultSubItems: [
                        { id: 's5', name: 'KOMBİ MONTAJ MALZEMESİ', units: 1, rate: 1500, showInProposal: false },
                        { id: 's6', name: 'FLEX GRUBU(OCAK,KOMBİ,SAYAÇ BAĞLANTI FLEXİ)', units: 1, rate: 400, showInProposal: false },
                        { id: 's7', name: 'EXPROOF GAZ ALARM CİHAZI(SELENOİD VANA BAĞLANTILI)', units: 0, rate: 1200, showInProposal: false }
                    ]
                },
                { name: 'FULL TESİSAT', rate: 35000 },
                { 
                    name: 'PLASTİKSİZ FULL TESİSAT MONTAJI', 
                    rate: 0,
                    defaultSubItems: [
                        { id: 's10', name: 'KOMBİ MONTAJ MALZEMESİ', units: 1, rate: 0, showInProposal: false },
                        { id: 's11', name: 'RADYATÖR MONTAJ MALZEMESİ', units: 1, rate: 0, showInProposal: false },
                        { id: 's12', name: 'DN32 PPRC BORU (METRE)', units: 1, rate: 0, showInProposal: false },
                        { id: 's13', name: 'DN25 PPRC BORU (METRE)', units: 1, rate: 0, showInProposal: false },
                        { id: 's14', name: 'DN20 PPRC BORU (METRE)', units: 1, rate: 0, showInProposal: false },
                    ]
                },
                { 
                    name: 'RADYATÖR MONTAJI', 
                    rate: 5000,
                    defaultSubItems: [
                        { id: 's15', name: 'DN20 - 1/2 DIŞ DİŞLİ ADAPTÖR', units: 1, rate: 5000, showInProposal: false }
                    ]
                },
                {
                    name: 'İÇ GAZ KOMBİ MONTAJI',
                    rate: 3500,
                    defaultSubItems: [
                        { id: 's16', name: 'KOMBİ MONTAJ MALZEMESİ', units: 1, rate: 3500, showInProposal: false }
                    ]
                },
                {
                    name: 'ISI POMPASI MONTAJI',
                    rate: 5000,
                    defaultSubItems: [
                        { id: 's17', name: 'ISI POMPASI MONTAJ MALZEMESİ', units: 1, rate: 0, showInProposal: false },
                        { id: 's18', name: 'BUFFER TANK', units: 1, rate: 0, showInProposal: false },
                        { id: 's19', name: 'GENLEŞME TANKI', units: 1, rate: 0, showInProposal: false },
                        { id: 's20', name: 'DENGE KABI', units: 1, rate: 0, showInProposal: false }
                    ]
                }
            ],
            selectedOptionName: 'KOMBİ KOLLEKTÖR',
            subItems: [
                { id: '1-1', name: 'KOMBİ KOLLEKTÖR MALZEMESİ', units: 1, rate: 0, showInProposal: false },
                { id: '1-2', name: 'DN32 PPRC BORU (METRE)', units: 1, rate: 0, showInProposal: false },
                { id: '1-3', name: 'DN25 PPRC BORU (METRE)', units: 1, rate: 0, showInProposal: false },
                { id: '1-4', name: 'DN20 PPRC BORU (METRE)', units: 1, rate: 0, showInProposal: false },
            ]
        },
        { 
            id: 6, 
            name: 'İŞÇİLİK', 
            units: 1,
            rate: 5000, 
            type: 'selectableToggle',
            description: '(FULL TESİSAT, KOMBİ KOLLEKTÖR, PLASTİKSİZ FULL TESİSAT, KOMBİ MONTAJI, İÇ GAZ TESİSATI, İÇ GAZ KOMBİ MONTAJI, RADYATÖR MONTAJI, ISI POMPASI MONTAJI)',
            options: [
                { name: 'FULL TESİSAT', rate: 5000, defaultSubItems: [...LABOR_SUB_ITEMS_DEFAULT] },
                { name: 'KOMBİ KOLLEKTÖR', rate: 2000, defaultSubItems: [...LABOR_SUB_ITEMS_DEFAULT] },
                { name: 'PLASTİKSİZ FULL TESİSAT', rate: 6000, defaultSubItems: [...LABOR_SUB_ITEMS_DEFAULT] },
                { name: 'KOMBİ MONTAJI', rate: 1000, defaultSubItems: [...LABOR_SUB_ITEMS_DEFAULT] },
                { name: 'İÇ GAZ TESİSATI', rate: 2500, defaultSubItems: [...LABOR_SUB_ITEMS_DEFAULT] },
                { name: 'İÇ GAZ KOMBİ MONTAJI', rate: 3500, defaultSubItems: [...LABOR_SUB_ITEMS_DEFAULT] },
                { name: 'RADYATÖR MONTAJI', rate: 1500, defaultSubItems: [...LABOR_SUB_ITEMS_DEFAULT] },
                { name: 'ISI POMPASI MONTAJI', rate: 3000, defaultSubItems: [...LABOR_SUB_ITEMS_DEFAULT] },
            ],
            selectedOptionName: 'FULL TESİSAT',
            subItems: [...LABOR_SUB_ITEMS_DEFAULT]
        },
    ];

    const [surveyData, setSurveyData] = useState<SurveyData>(() => {
        const savedTemplate = localStorage.getItem('saved_survey_template');
        let data: SurveyData;

        if (savedTemplate) {
            try {
                data = JSON.parse(savedTemplate);
                
                // Migration for radiators (Previous)
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

                // Migration for New Pricing Structure
                if (data.pricingItems && data.pricingItems.some(i => i.id === 7 || i.id === 2)) {
                    data.pricingItems = DEFAULT_PRICING_ITEMS;
                } else if (!data.pricingItems) {
                    data.pricingItems = DEFAULT_PRICING_ITEMS;
                }

                return data;
            } catch (e) {
                console.error("Error loading template:", e);
            }
        }

        const savedItems = localStorage.getItem('saved_pricing_items');
        let initialItems = savedItems ? JSON.parse(savedItems) : DEFAULT_PRICING_ITEMS;
        
        if (initialItems.some((i: any) => i.id === 7 || i.id === 2)) {
            initialItems = DEFAULT_PRICING_ITEMS;
        }

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
            agreedPrice: undefined,
            rooms: [],
            appliances: [],
            pricingItems: initialItems,
            proposalNote: '',
        };
    });

    useEffect(() => {
        localStorage.setItem('saved_pricing_items', JSON.stringify(surveyData.pricingItems));
    }, [surveyData.pricingItems]);

    // --- HANDLERS ---

    const handleSaveTemplate = useCallback(() => {
        localStorage.setItem('saved_survey_template', JSON.stringify(surveyData));
        alert('Taslak tarayıcı hafızasına kaydedildi.');
    }, [surveyData]);

    const handleDownloadProject = useCallback(async () => {
        const fileName = `Proje_${surveyData.customerName.replace(/\s+/g, '_') || 'Taslak'}.json`;
        const jsonString = JSON.stringify(surveyData, null, 2);

        if ('showSaveFilePicker' in window) {
            try {
                // @ts-ignore
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{ description: 'Proje Dosyası', accept: { 'application/json': ['.json'] } }],
                });
                const writable = await handle.createWritable();
                await writable.write(jsonString);
                await writable.close();
                return; 
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    return; 
                }
                console.warn('File System Access API failed (likely cross-origin iframe), falling back to download link:', err.message);
            }
        }

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
                let parsedData = JSON.parse(content);
                
                if (parsedData.pricingItems && parsedData.pricingItems.some((i: any) => i.id === 7 || i.id === 2)) {
                    parsedData.pricingItems = DEFAULT_PRICING_ITEMS;
                    alert('Eski sürüm proje dosyası tespit edildi. Fiyatlandırma kalemleri yeni yapıya güncellendi.');
                }

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
        event.target.value = ''; 
    }, []);

    // --- SYNC LOGIC ---
    useEffect(() => {
        if (Object.keys(globalPrices).length === 0) return;

        setSurveyData(prevData => {
            const newPricingItems = prevData.pricingItems.map(item => {
                let newItem = { ...item };
                let mappedPrice = globalPrices[newItem.name];
                
                if (mappedPrice === undefined) {
                    if (newItem.name === 'İÇ TESİSAT MALZEMESİ') mappedPrice = globalPrices['İÇ GAZ TESİSATI (STANDART)'];
                }
                if (mappedPrice !== undefined) newItem.rate = mappedPrice;

                const syncSubItems = (subItems: PricingSubItem[]) => {
                    return subItems.map(sub => {
                        let subPrice = globalPrices[sub.name];
                        if (subPrice === undefined) {
                            if (sub.name === 'KOMBİ DOLABI' || sub.name === 'DOLAP') {
                                subPrice = globalPrices['KOMBİ DOLABI'] ?? globalPrices['KOMBİ DOLABI (STANDART)'] ?? globalPrices['KOMBİ KORUMA DOLABI'];
                            }
                            else if (sub.name === 'GAZ ALARM CİHAZI') subPrice = globalPrices['GAZ ALARM CİHAZI'];
                            else if (sub.name.includes('DN32 PPRC')) subPrice = globalPrices['DN32 KOMPOZİT BORU (MT)'];
                            else if (sub.name.includes('DN25 PPRC')) subPrice = globalPrices['DN25 KOMPOZİT BORU (MT)'];
                            else if (sub.name.includes('DN20 PPRC')) subPrice = globalPrices['DN20 KOMPOZİT BORU (MT)'];
                            else if (sub.name === 'FLEX GRUBU' || sub.name.includes('FLEX GRUBU')) subPrice = globalPrices['OCAK FLEXİ 150 CM']; 
                            else if (sub.name === 'EKSTRA BACA UZATMASI') subPrice = globalPrices['BACA UZATMASI 50 CM (YOĞUŞMALI)'];
                            else if (sub.name.includes('CAM MENFEZİ')) subPrice = globalPrices['CAM / DUVAR MENFEZİ AÇIMI'];
                            else if (sub.name.includes('PROJE')) subPrice = globalPrices['PROJE BEDELİ'];
                            else if (sub.name.includes('EXPROOF')) subPrice = globalPrices['EXPROOF GAZ ALARM CİHAZI'] || globalPrices['EXPROOF GAZ ALARM MONTAJI'];
                            else if (sub.name === 'KIRIM') subPrice = globalPrices['KAZIM İŞÇİLİĞİ'];
                        }
                        return subPrice !== undefined ? { ...sub, rate: subPrice } : sub;
                    });
                };

                if (newItem.options) {
                    newItem.options = newItem.options.map(opt => {
                        let optPrice = globalPrices[opt.name];
                        if (optPrice === undefined) {
                            if (opt.name === 'FULL TESİSAT') optPrice = globalPrices['FULL TESİSAT İŞÇİLİĞİ'];
                            else if (opt.name === 'PLASTİKSİZ FULL TESİSAT') optPrice = globalPrices['PLASTİKSİZ FULL TESİSAT'];
                            else if (opt.name === 'KOMBİ MONTAJI') optPrice = globalPrices['KOMBİ MONTAJI'];
                            else if (opt.name === 'RADYATÖR MONTAJI') optPrice = globalPrices['RADYATÖR MONTAJI (ADET)'];
                            else if (opt.name === 'İÇ GAZ TESİSATI') optPrice = globalPrices['İÇ GAZ TESİSATI İŞÇİLİĞİ'];
                            else if (opt.name === 'KOMBİ KOLLEKTÖR') optPrice = globalPrices['KOMBİ KOLLEKTÖR MONTAJI'];
                        }
                        let newDefaultSubItems = opt.defaultSubItems ? syncSubItems(opt.defaultSubItems) : undefined;
                        if (optPrice !== undefined) return { ...opt, rate: optPrice, defaultSubItems: newDefaultSubItems };
                        return { ...opt, defaultSubItems: newDefaultSubItems };
                    });
                }
                if (newItem.subItems) newItem.subItems = syncSubItems(newItem.subItems);
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
                if (newItem.subItems && newItem.subItems.length > 0 && newItem.type === 'toggle') {
                    newItem.rate = newItem.subItems.reduce((sum, s) => sum + (s.units * s.rate), 0);
                }

                return newItem;
            });

            const newAppliances = prevData.appliances.map(app => {
                let appPrice = app.price;
                if (globalPrices[app.name] !== undefined) appPrice = globalPrices[app.name];
                else if (globalPrices[app.type] !== undefined) appPrice = globalPrices[app.type];
                else if (app.type === ApplianceType.Cabinet || app.name === 'KOMBİ DOLABI') {
                     const customLabel = localStorage.getItem('cabinet_custom_label');
                     const cabinetPrice = (customLabel && globalPrices[customLabel]) ?? globalPrices['KOMBİ DOLABI'] ?? globalPrices['KOMBİ DOLABI (STANDART)'];
                     if (cabinetPrice !== undefined) appPrice = cabinetPrice;
                } else if (app.type === ApplianceType.Stove || app.name === 'OCAK') {
                     appPrice = globalPrices['OCAK (4 GÖZLÜ)'] !== undefined ? globalPrices['OCAK (4 GÖZLÜ)'] : appPrice;
                }

                let newSubItems = app.subItems;
                if (newSubItems) {
                    newSubItems = newSubItems.map(sub => {
                        let subPrice = globalPrices[sub.name];
                        if (subPrice === undefined && (sub.name === 'KOMBİ DOLABI' || sub.name.includes('DOLAP'))) {
                             subPrice = globalPrices['KOMBİ DOLABI'] ?? globalPrices['KOMBİ DOLABI (STANDART)'] ?? globalPrices['SAÇ DOLAP'];
                        }
                        return subPrice !== undefined ? { ...sub, rate: subPrice } : sub;
                    });
                }

                return { ...app, price: appPrice, subItems: newSubItems };
            });

            let radMeter = prevData.radiatorMeterPrice;
            if (globalPrices['DEMİR DÖKÜM PLUS RADYATÖR (MT)'] !== undefined) radMeter = globalPrices['DEMİR DÖKÜM PLUS RADYATÖR (MT)'];
            else if (globalPrices['RADYATÖR (MT)'] !== undefined) radMeter = globalPrices['RADYATÖR (MT)'];

            let radValve = prevData.radiatorValvePrice;
            if (globalPrices['RADYATÖR VANASI (KÖŞE)'] !== undefined) radValve = globalPrices['RADYATÖR VANASI (KÖŞE)'];
            else if (globalPrices['RADYATÖR VANASI'] !== undefined) radValve = globalPrices['RADYATÖR VANASI'];

            const newExtraOffers = prevData.extraOffers.map(offer => {
                return globalPrices[offer.name] !== undefined ? { ...offer, price: globalPrices[offer.name] } : offer;
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

    const handleProposalNoteChange = useCallback((note: string) => {
        setSurveyData(prev => ({ ...prev, proposalNote: note }));
    }, []);

    const handleRadiatorPriceChange = useCallback((field: 'radiatorMeterPrice' | 'radiatorValvePrice', value: number) => {
        setSurveyData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleFinalBidChange = useCallback((value: number) => {
        setSurveyData(prev => ({ ...prev, finalBidPrice: value }));
    }, []);

    const handleAgreedPriceChange = useCallback((value: number) => {
        setSurveyData(prev => ({ ...prev, agreedPrice: value }));
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
                            updatedItem.subItems = selectedOpt.defaultSubItems.map((sub, idx) => ({ ...sub, id: sub.id || `${itemId}-${Date.now()}-${idx}` }));
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
                            return { ...opt, rate: updatedItem.rate, defaultSubItems: updatedItem.subItems ? updatedItem.subItems.map(s => ({...s})) : undefined };
                        }
                        return opt;
                    });
                }
                return updatedItem;
            }),
        }));
    }, []);

    // ... Add/Delete Item/Option/SubItem logic ...
    const handleAddPricingItem = useCallback((name: string) => {
        setSurveyData(prev => ({ ...prev, pricingItems: [...prev.pricingItems, { id: Date.now(), name: name.toUpperCase(), units: 1, rate: 0, type: 'toggle' }] }));
    }, []);
    const handleDeletePricingItem = useCallback((id: number) => {
        setSurveyData(prev => ({ ...prev, pricingItems: prev.pricingItems.filter(item => item.id !== id) }));
    }, []);
    const handleAddOption = useCallback((itemId: number, optionName: string) => {
        setSurveyData(prev => ({
            ...prev,
            pricingItems: prev.pricingItems.map(item => {
                if (item.id !== itemId) return item;
                let newDefaultSubItems: PricingSubItem[] = [];
                if (itemId === 6) {
                    newDefaultSubItems = [
                        { id: `s-kirim-${Date.now()}`, name: 'KIRIM', units: 0, rate: 1000, showInProposal: false },
                        { id: `s-kaynak-${Date.now()}`, name: 'KAYNAKLI DIŞ BAĞLANTI', units: 0, rate: 1500, showInProposal: false }
                    ];
                }
                return { ...item, options: [...(item.options || []), { name: optionName.toUpperCase(), rate: 0, defaultSubItems: newDefaultSubItems }], selectedOptionName: item.selectedOptionName || optionName.toUpperCase() };
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
                         newSelected = newOptions[0].name; newRate = newOptions[0].rate; newSubItems = newOptions[0].defaultSubItems ? [...newOptions[0].defaultSubItems] : undefined;
                     } else {
                         newSelected = undefined; newRate = 0; newSubItems = undefined;
                     }
                }
                return { ...item, options: newOptions, selectedOptionName: newSelected, rate: newRate, subItems: newSubItems };
            })
        }));
    }, []);
    const handleAddSubItem = useCallback((itemId: number, subItemName: string) => {
        setSurveyData(prev => ({
            ...prev,
            pricingItems: prev.pricingItems.map(item => {
                if (item.id !== itemId) return item;
                const newSubItem: PricingSubItem = { id: `sub-${Date.now()}`, name: subItemName.toUpperCase(), units: 1, rate: 0, showInProposal: false };
                const updatedSubItems = [...(item.subItems || []), newSubItem];
                let updatedOptions = item.options;
                if (item.selectedOptionName && item.options) {
                    updatedOptions = item.options.map(opt => {
                        if (opt.name === item.selectedOptionName) return { ...opt, defaultSubItems: [...(opt.defaultSubItems || []), newSubItem] };
                        return opt;
                    });
                }
                return { ...item, subItems: updatedSubItems, options: updatedOptions };
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
                        if (opt.name === item.selectedOptionName) return { ...opt, defaultSubItems: opt.defaultSubItems?.filter(s => s.id !== subItemId) };
                        return opt;
                    });
                }
                return { ...item, subItems: updatedSubItems, options: updatedOptions };
            })
        }));
    }, []);

    const addRoom = useCallback(() => {
        setSurveyData(prev => ({ ...prev, rooms: [{ id: Date.now(), name: `ODA ${surveyData.rooms.length + 1}`, width: 0, length: 0, height: 2.8, heatLossCoefficient: 45, radiatorModel: 'DEMİRDÖKÜM', radiators: [{ id: `rad-${Date.now()}`, length: 0 }], isTowelRail: false, towelRailSize: TOWEL_RAIL_SIZES[0], towelRailPrice: 0 }, ...prev.rooms] }));
    }, [surveyData.rooms.length]);

    const updateRoom = useCallback((roomId: number, field: keyof Room, value: string | number | boolean | Radiator[]) => {
        setSurveyData(prev => ({ ...prev, rooms: prev.rooms.map(room => room.id === roomId ? { ...room, [field]: value } : room) }));
    }, []);
    
    const deleteRoom = useCallback((roomId: number) => {
        setSurveyData(prev => ({ ...prev, rooms: prev.rooms.filter(room => room.id !== roomId) }));
    }, []);

    const addAppliance = useCallback((applianceType: ApplianceType | string, initialPrice: number = 0) => {
        const applianceDef = applianceDefinitions.find(def => def.type === applianceType);
        const defaultDef = { name: applianceType, type: applianceType, consumptionKw: 0 };
        const def = applianceDef || defaultDef;

        let priceToUse = initialPrice;
        const customLabel = localStorage.getItem('cabinet_custom_label');
        const cabinetPrice = (customLabel && globalPrices[customLabel]) ?? globalPrices['KOMBİ DOLABI'] ?? globalPrices['KOMBİ DOLABI (STANDART)'];

        if (globalPrices[def.name] !== undefined) priceToUse = globalPrices[def.name];
        else if (globalPrices[applianceType] !== undefined) priceToUse = globalPrices[applianceType];
        else if ((applianceType === ApplianceType.Cabinet || def.name === 'KOMBİ DOLABI') && cabinetPrice !== undefined) priceToUse = cabinetPrice;

        let initialSubItems: PricingSubItem[] = [];
        if (applianceType === ApplianceType.Combi || applianceType.includes('KOMBİ')) {
            initialSubItems.push({
                id: `sub-${Date.now()}`,
                name: 'KOMBİ DOLABI',
                units: 0, 
                rate: cabinetPrice || 0,
                showInProposal: true
            });
        }

        const newAppliance: Appliance = {
            id: `app-${Date.now()}`,
            type: def.type,
            name: def.name,
            consumptionKw: def.consumptionKw,
            count: 1,
            price: priceToUse,
            subItems: initialSubItems
        };

        setSurveyData(prev => ({ ...prev, appliances: [...prev.appliances, newAppliance]}));
    }, [applianceDefinitions, globalPrices]);

    const updateAppliance = useCallback((id: string, updates: Partial<Appliance>) => {
        setSurveyData(prev => ({ ...prev, appliances: prev.appliances.map(app => app.id === id ? { ...app, ...updates } : app) }));
    }, []);

    const deleteAppliance = useCallback((applianceIndex: number) => {
        setSurveyData(prev => ({ ...prev, appliances: prev.appliances.filter((_, index) => index !== applianceIndex) }));
    }, []);

    const handleAddApplianceSubItem = useCallback((applianceId: string, name: string) => {
        setSurveyData(prev => ({
            ...prev,
            appliances: prev.appliances.map(app => {
                if (app.id !== applianceId) return app;
                const price = globalPrices[name.toUpperCase()] || 0;
                const newSub: PricingSubItem = {
                    id: `asub-${Date.now()}`,
                    name: name.toUpperCase(),
                    units: 1,
                    rate: price,
                    showInProposal: true // Set to true by default for manually added items
                };
                return { ...app, subItems: [...(app.subItems || []), newSub] };
            })
        }));
    }, [globalPrices]);

    const handleUpdateApplianceSubItem = useCallback((applianceId: string, subId: string, updates: Partial<PricingSubItem>) => {
        setSurveyData(prev => ({
            ...prev,
            appliances: prev.appliances.map(app => {
                if (app.id !== applianceId) return app;
                return {
                    ...app,
                    subItems: app.subItems?.map(sub => sub.id === subId ? { ...sub, ...updates } : sub)
                };
            })
        }));
    }, []);

    const handleDeleteApplianceSubItem = useCallback((applianceId: string, subId: string) => {
        setSurveyData(prev => ({
            ...prev,
            appliances: prev.appliances.map(app => {
                if (app.id !== applianceId) return app;
                return { ...app, subItems: app.subItems?.filter(sub => sub.id !== subId) };
            })
        }));
    }, []);

    const addExtraOffer = useCallback((name: string, price: number) => {
        setSurveyData(prev => ({ ...prev, extraOffers: [...(prev.extraOffers || []), { id: `extra-${Date.now()}`, name, price }] }));
    }, []);
    const deleteExtraOffer = useCallback((id: string) => {
        setSurveyData(prev => ({ ...prev, extraOffers: (prev.extraOffers || []).filter(offer => offer.id !== id) }));
    }, []);
    
    const totalConsumptionKw = useMemo(() => calculateTotalConsumptionKw(surveyData.appliances), [surveyData.appliances]);
    
    const totalPricingCost = useMemo(() => {
        const pricingCost = surveyData.pricingItems.reduce((total, item) => total + (item.units * item.rate), 0);
        
        const appliancesCost = surveyData.appliances.reduce((total, app) => {
            const mainTotal = app.count * app.price;
            const subTotal = app.subItems ? app.subItems.reduce((sTotal, sub) => sTotal + (sub.units * sub.rate), 0) : 0;
            return total + mainTotal + (subTotal * app.count);
        }, 0);

        const totalRadiatorMeters = surveyData.rooms.filter(r => !r.isTowelRail).reduce((sum, r) => sum + (r.radiators ? r.radiators.reduce((rSum, rad) => rSum + (rad.length || 0), 0) : 0), 0);
        const roomCountWithTowelRail = surveyData.rooms.filter(r => r.isTowelRail).length;
        const radiatorCount = surveyData.rooms.filter(r => !r.isTowelRail).reduce((sum, r) => sum + (r.radiators ? r.radiators.length : 0), 0);
        const totalValves = (radiatorCount + roomCountWithTowelRail) * 2;
        const totalTowelRailCost = surveyData.rooms.filter(r => r.isTowelRail).reduce((sum, r) => sum + (r.towelRailPrice || 0), 0);
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
                                suggestions={priceListSuggestions}
                                globalPrices={globalPrices}
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
                                suggestions={priceListSuggestions}
                            />

                            <ApplianceList 
                                appliances={surveyData.appliances}
                                extraOffers={surveyData.extraOffers}
                                onAddAppliance={addAppliance}
                                onUpdateAppliance={updateAppliance}
                                onDeleteAppliance={deleteAppliance}
                                handleAddApplianceSubItem={handleAddApplianceSubItem}
                                handleUpdateApplianceSubItem={handleUpdateApplianceSubItem}
                                handleDeleteApplianceSubItem={handleDeleteApplianceSubItem}
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
                                suggestions={priceListSuggestions}
                            />
                        </div>
                        <div className="lg:col-span-1 mt-6 lg:mt-0">
                             <Summary
                                totalConsumptionKw={totalConsumptionKw}
                                totalPricingCost={totalPricingCost}
                                surveyData={surveyData}
                                onFinalBidChange={handleFinalBidChange}
                                onAgreedPriceChange={handleAgreedPriceChange}
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
                        onUpdateNote={handleProposalNoteChange}
                    />
                </main>
            )}
        </div>
    );
};

export default App;
