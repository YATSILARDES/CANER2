
import { ApplianceType, PipeDiameterRule, RadiatorModel, ApplianceDefinition } from './types';

export const APPLIANCE_DEFINITIONS: ApplianceDefinition[] = [
    { name: 'KOMBİ (24KW)', type: ApplianceType.Combi, consumptionKw: 24 },
    { name: 'OCAK (4 GÖZLÜ)', type: ApplianceType.Stove, consumptionKw: 7 },
    { name: 'DOĞALGAZLI ŞOFBEN', type: ApplianceType.GasWaterHeater, consumptionKw: 11 },
    { name: 'KAZAN (50KW)', type: ApplianceType.Boiler, consumptionKw: 50 },
    { name: 'RADYANT ISITICI', type: ApplianceType.RadiantHeater, consumptionKw: 15 },
    { name: 'ISI POMPASI', type: ApplianceType.HeatPump, consumptionKw: 30 },
    { name: 'KOMBİ DOLABI', type: ApplianceType.Cabinet, consumptionKw: 0 },
];

// Updated Combi List based on the PDF OCR data - ALL UPPERCASE
export const COMBI_MODELS = [
    // DEMİRDÖKÜM
    "DEMİR DÖKÜM NİTROMİX P 24 TAM YOĞUŞMALI KOMBİ (24 KW)",
    "DEMİR DÖKÜM NİTROMİX P 28 TAM YOĞUŞMALI KOMBİ (28 KW)",
    "DEMİR DÖKÜM NİTROMİX P 35 TAM YOĞUŞMALI KOMBİ (35 KW)",
    "DEMİR DÖKÜM NİTROMİX IONİ 24/26 KW TAM YOĞUŞMALI KOMBİ",
    "DEMİR DÖKÜM NİTROMİX IONİ 28/36 KW TAM YOĞUŞMALI KOMBİ",
    "DEMİR DÖKÜM NİTROMİX IONİ 34/36 KW TAM YOĞUŞMALI KOMBİ",
    "DEMİR DÖKÜM ATROMİX P 24 TAM YOĞUŞMALI KOMBİ (24 KW)",
    "DEMİR DÖKÜM ATROMİX P 28 TAM YOĞUŞMALI KOMBİ (28 KW)",
    "DEMİR DÖKÜM ADEMİX 18/24 TAM YOĞUŞMALI KOMBİ (18/24 KW)",
    "DEMİR DÖKÜM ADEMİX 24/28 TAM YOĞUŞMALI KOMBİ (24/28 KW)",
    "DEMİR DÖKÜM VENTOMİX 18/24 TAM YOĞUŞMALI KOMBİ (18/24 KW)",
    "DEMİR DÖKÜM VENTOMİX 24/28 TAM YOĞUŞMALI KOMBİ (24/28 KW)",
    "DEMİR DÖKÜM İSOMİX P 30 TAM YOĞUŞMALI KOMBİ (30 KW)",
    "DEMİR DÖKÜM ATRON CONDENSE (YARI YOĞUŞMALI)",

    // VIESSMANN
    "VIESSMANN TREND 19/27 KW TAM YOĞUŞMALI KOMBİ (19 KW)",
    "VIESSMANN TREND 25/31 KW TAM YOĞUŞMALI KOMBİ (25 KW)",
    "VIESSMANN CONNECT 19/27 KW WİFİ TAM YOĞUŞMALI KOMBİ (19 KW)",
    "VIESSMANN CONNECT 25/31 KW WİFİ TAM YOĞUŞMALI KOMBİ (25 KW)",
    "VIESSMANN CONNECT 32/35 KW WİFİ TAM YOĞUŞMALI KOMBİ (32/35 KW)",
    "VIESSMANN VITODENS 100-W 19/27 TAM YOĞUŞMALI KOMBİ (19/27 KW)",
    "VIESSMANN VITODENS 100-W 25/31 TAM YOĞUŞMALI KOMBİ (25/31 KW)",
    "VIESSMANN VITODENS 100-W 32/35 TAM YOĞUŞMALI KOMBİ (32/35 KW)",

    // VAILLANT
    "VAILLANT INTRO 18/24 TAM YOĞUŞMALI KOMBİ (18/24 KW)",
    "VAILLANT INTRO 24/28 TAM YOĞUŞMALI KOMBİ (24/28 KW)",
    "VAILLANT ECOTEC PURE 236/7-2 TAM YOĞUŞMALI KOMBİ (20 KW)",
    "VAILLANT ECOTEC PURE 286/7-2 TAM YOĞUŞMALI KOMBİ (25 KW)",
    "VAILLANT ECOTEC PRO 236/5-3 TAM YOĞUŞMALI KOMBİ (20 KW)",
    "VAILLANT ECOTEC PRO 286/5-3 TAM YOĞUŞMALI KOMBİ (25 KW)",

    // ECA
    "ECA CITIUS PREMİX 24 TAM YOĞUŞMALI KOMBİ (24 KW)",
    "ECA CITIUS PREMİX 28 TAM YOĞUŞMALI KOMBİ (28 KW)",
    "ECA PROTEUS PREMİX 24 TAM YOĞUŞMALI KOMBİ (24 KW)",
    "ECA PROTEUS PREMİX 28 TAM YOĞUŞMALI KOMBİ (28 KW)",
    "ECA PROTEUS PREMİX 30 TAM YOĞUŞMALI KOMBİ (30 KW)",
    "ECA PROTEUS PREMİX 35 TAM YOĞUŞMALI KOMBİ (35 KW)",
    "ECA PROTEUS PREMİX 42 TAM YOĞUŞMALI KOMBİ (42 KW)",
    "ECA PROTEUS PREMİX 45 TAM YOĞUŞMALI KOMBİ (45 KW)",
    "ECA CONFEO PREMİX PREMİUM 24 SİYAH TAM YOĞUŞMALI KOMBİ (24 KW)",
    "ECA CONFEO PREMİX PREMİUM 30 SİYAH TAM YOĞUŞMALI KOMBİ (30 KW)",
    "ECA CONFEO PREMİX PREMİUM 35 SİYAH TAM YOĞUŞMALI KOMBİ (35 KW)",

    // PROTHERM
    "PROTHERM PUMA CONDENSE 18/24 TAM YOĞUŞMALI KOMBİ (18/24 KW)",
    "PROTHERM LYNX CONDENS 24 KW TAM YOĞUŞMALI KOMBİ (24 KW)",
    "PROTHERM LYNX CONDENS 28 KW TAM YOĞUŞMALI KOMBİ (28 KW)",

    // BAYMAK
    "BAYMAK LAMBERT LPY COMPACT 24 TAM YOĞUŞMALI KOMBİ (24 KW)",
    "BAYMAK LAMBERT LPY COMPACT 30 TAM YOĞUŞMALI KOMBİ (30 KW)",
    "BAYMAK LAMBERT LPY COMPACT 33 TAM YOĞUŞMALI KOMBİ (33 KW)",
    "BAYMAK LAMBERT LPY COMPACT 42 TAM YOĞUŞMALI KOMBİ (42 KW)",
    "BAYMAK LAMBERT LPY COMPACT 45 TAM YOĞUŞMALI KOMBİ (45 KW)",
    "BAYMAK DUOTEC COMPACT 24 TAM YOĞUŞMALI KOMBİ (24 KW)",
    "BAYMAK DUOTEC COMPACT 30 TAM YOĞUŞMALI KOMBİ (30 KW)",

    // WARMHAUS
    "WARMHAUS EWA 24 TAM YOĞUŞMALI KOMBİ (24 KW)"
];

// --- DEFAULT LISTS FOR PRICE LIST COMPONENT ---

export const DEFAULT_RADIATOR_ITEMS = [
    "DEMİR DÖKÜM PLUS RADYATÖR (MT)",
    "HAVLUPAN 50/80 CM",
    "HAVLUPAN 50/100 CM",
    "HAVLUPAN 50/120 CM",
    "HAVLUPAN 60/80 CM",
    "HAVLUPAN 60/100 CM",
    "HAVLUPAN 60/120 CM"
];

export const DEFAULT_HEATING_INSTALLATION_ITEMS = [
    "DN32 KOMPOZİT BORU (MT)",
    "DN25 KOMPOZİT BORU (MT)",
    "DN20 KOMPOZİT BORU (MT)",
    "DN32 DİRSEK",
    "DN25 DİRSEK",
    "DN20 DİRSEK",
    "DN32 DİRSEK 45°",
    "DN25 DİRSEK 45°",
    "DN20 DİRSEK 45°",
    "DN32 MANŞON",
    "DN25 MANŞON",
    "DN20 MANŞON",
    "32-25 REDÜKSİYON",
    "25-20 REDÜKSİYON",
    "32-20 REDÜKSİYON",
    "32 OJR TE",
    "25 ORJ TE",
    "20 ORJ TE",
    "32-20-32 TE",
    "25-20-25 TE",
    "32-25-32 TE",
    "32-20-25 TE",
    "DN32 KAVİS",
    "DN25 KAVİS",
    "DN20 KAVİS",
    "İÇ DİŞLİ ADAPTÖR 20-1/2\"",
    "DIŞ DİŞLİ ADAPTÖR 20-1/2\"",
    "İÇ DİŞLİ TE 20-1/2\"-20",
    "İÇ DİŞLİ DİRSEK 20-1/2\"",
    "DIŞ DİŞLİ DİRSEK 20-1/2\"",
    "DN32 TEKLİ KELEPÇE",
    "DN25 TEKLİ KELEPÇE",
    "DN20 TEKLİ KELEPÇE",
    "DN32 ÇİFTLİ KELEPÇE",
    "DN25 ÇİFTLİ KELEPÇE",
    "DN20 ÇİFTLİ KELEPÇE",
    "KOMBİ ALT BAĞLANTI SETİ",
    "5,60 VİDA",
    "ALÇI"
];

export const DEFAULT_PIPE_ITEMS = [
    "1\" DOĞALGAZ BORUSU (MT)",
    "3/4\" DOĞALGAZ BORUSU (MT)",
    "1/2\" DOĞALGAZ BORUSU (MT)",
    "1\" DİRSEK",
    "3/4\" DİRSEK",
    "1/2\" DİRSEK",
    "1\" TE",
    "3/4\" TE",
    "1\" KUYRUKLU DİRSEK",
    "3/4\" KUYRUKLU DİRSEK",
    "KELEPÇE (STANDART)",
    "KONSOL"
];

export const DEFAULT_VALVE_ITEMS = [
    "1\" DOĞALGAZ VANASI",
    "3/4\" DOĞALGAZ VANASI",
    "1/2\" DOĞALGAZ VANASI",
    "1\" FLANŞLI DG VANASI",
    "FLANŞLI DEPREM VANASI",
    "3/4\" KİLİTLİ VANA",
    "1/2\" KİLİTLİ VANA",
    "RADYATÖR VANASI (KÖŞE)",
    "RADYATÖR VANASI (DÜZ)",
    "TERMOSTATİK VANA",
    "KOMBİ BAĞLANTI SETİ (DÜZ)",
    "KOMBİ BAĞLANTI SETİ (FİLTRELİ)",
    "30X30 SAÇ DOLAP",
    "60X30 SAÇ DOLAP",
    "KOMBİ DOLABI (STANDART)",
    "GAZ ALARM CİHAZI",
    "EXPROOF GAZ ALARM CİHAZI",
    "BACA UZATMASI 50 CM (YOĞUŞMALI)",
    "BACA UZATMASI 100 CM (YOĞUŞMALI)",
    "BACA DİRSEĞİ 90° (YOĞUŞMALI)",
    "BACA DİRSEĞİ 45° (YOĞUŞMALI)",
    "ODA TERMOSTATI (KABLOLU)",
    "ODA TERMOSTATI (KABLOSUZ)",
    "ODA TERMOSTATI (AKILLI/WIFI)"
];

export const DEFAULT_LABOR_ITEMS = [
    "İÇ GAZ TESİSATI İŞÇİLİĞİ",
    "KALORİFER TESİSATI İŞÇİLİĞİ",
    "RADYATÖR MONTAJI (ADET)",
    "KOMBİ MONTAJI",
    "KOMBİ KOLLEKTÖR MONTAJI",
    "KOMBİ KOLLEKTÖR KIRIMLI",
    "FULL TESİSAT İŞÇİLİĞİ",
    "FULL KIRIMLI İŞÇİLİĞİ",
    "PLASTİKSİZ FULL TESİSAT",
    "KAYNAKLI TESİSAT İŞÇİLİĞİ",
    "EXTRA PETEK MONTAJI",
    "EXTRA TRV MONTAJI",
    "DEMİR BORU KESİMİ",
    "KAZIM İŞÇİLİĞİ",
    "KAYNAK İŞÇİLİĞİ (MT)",
    "PROJE BEDELİ",
    "KAROT",
    "CAM / DUVAR MENFEZİ AÇIMI",
    "TESİSAT BOYAMASI"
];

export const ALL_DEFAULT_ITEMS = [
    ...COMBI_MODELS,
    ...DEFAULT_RADIATOR_ITEMS,
    ...DEFAULT_HEATING_INSTALLATION_ITEMS,
    ...DEFAULT_PIPE_ITEMS,
    ...DEFAULT_VALVE_ITEMS,
    ...DEFAULT_LABOR_ITEMS
];

export const TOWEL_RAIL_SIZES = ['5-10', '6-10', '7-10'];

export const VENTILATION_CONSTANT_CM2_PER_KW = 15;

export const PIPE_DIAMETER_CHART: PipeDiameterRule[] = [
    { minKw: 0, maxKw: 20, diameter: 'DN20 (3/4")' },
    { minKw: 20, maxKw: 45, diameter: 'DN25 (1")' },
    { minKw: 45, maxKw: 80, diameter: 'DN32 (1 1/4")' },
    { minKw: 80, maxKw: 120, diameter: 'DN40 (1 1/2")' },
    { minKw: 120, maxKw: Infinity, diameter: 'DN50 (2")' },
];

export const RADIATOR_DIVISORS: { [key in RadiatorModel]: number } = {
    [RadiatorModel.Demirdokum]: 1450,
    [RadiatorModel.Piyasa]: 1250,
};
