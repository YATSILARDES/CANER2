
import React from 'react';
import { SurveyData, ApplianceType } from '../types';

interface CustomerProposalProps {
    surveyData: SurveyData;
    totalConsumptionKw: number;
    totalPricingCost: number; // This now receives the 'finalBidPrice' or 'calculatedCost' from App.tsx
}

export const CustomerProposal: React.FC<CustomerProposalProps> = ({ 
    surveyData, 
    totalPricingCost 
}) => {
    const currentDate = new Date().toLocaleDateString('tr-TR');

    // --- DATA EXTRACTION & LOGIC ---

    // 1. Identify the Main Installation Type
    const heatingItem = surveyData.pricingItems.find(i => i.id === 3);
    const laborItem = surveyData.pricingItems.find(i => i.id === 6);
    const exproofItem = surveyData.pricingItems.find(i => i.id === 5);
    
    const mainServiceType = heatingItem?.selectedOptionName || laborItem?.selectedOptionName || 'Standart Tesisat';

    // Logic to determine what sections to show
    const isFullInstallation = mainServiceType.toLowerCase().includes('full');
    const isPlasticFree = mainServiceType.toLowerCase().includes('plastiksiz');
    const isInteriorGasOnly = mainServiceType.toLowerCase().includes('iç gaz');
    const isCombiMountOnly = mainServiceType === 'Kombi Montajı'; // Check for specific Combi Mount selection
    
    const hasExproofDevice = exproofItem && exproofItem.units > 0;

    // Check specific sub-items for Kombi Montajı
    const activeSubItems = heatingItem?.subItems?.filter(s => s.units > 0) || [];
    const hasFlexGroup = activeSubItems.some(s => s.name.includes('Flex'));
    const hasGasAlarm = activeSubItems.some(s => s.name.includes('Alarm') && !s.name.includes('Exproof'));
    const hasCombiCabinet = activeSubItems.some(s => s.name.includes('Dolabı'));
    const hasChimneyExtension = activeSubItems.some(s => s.name.includes('Baca'));
    const hasMountingMaterials = activeSubItems.some(s => s.name.includes('Montaj Malzemesi'));


    // 2. Appliances
    const combis = surveyData.appliances.filter(a => a.type === ApplianceType.Combi);
    const mainCombi = combis.length > 0 ? combis[0] : null;
    const combiName = mainCombi ? mainCombi.name : '................................................................';
    const combiKw = mainCombi ? `${mainCombi.consumptionKw} KW` : '';
    
    // Calculate Base System Price Logic for Alternative Offers
    // We use the 'totalPricingCost' passed to this component (which might be the manually increased bid)
    // minus the main combi's raw price. This implies the profit margin is distributed across the system.
    const mainCombiPriceTotal = mainCombi ? (mainCombi.price * mainCombi.count) : 0;
    const baseSystemPrice = totalPricingCost - mainCombiPriceTotal;

    // 3. Radiators & Towel Rails
    const totalRadiatorMeters = surveyData.rooms
        .filter(r => !r.isTowelRail)
        .reduce((sum, r) => {
            const roomTotal = r.radiators ? r.radiators.reduce((acc, rad) => acc + (rad.length || 0), 0) : 0;
            return sum + roomTotal;
        }, 0);
    
    const towelRails = surveyData.rooms.filter(r => r.isTowelRail);
    const hasRadiators = totalRadiatorMeters > 0 || towelRails.length > 0;

    // Pricing Table Description Logic
    const pricingTableDescription = isCombiMountOnly
        ? `${combiName} + İmalat Montaj ve İşçilik`
        : `${combiName} + ${totalRadiatorMeters.toFixed(1)} Metre Radyatör + İmalat Montaj ve İşçilik`;

    // --- STYLES ---
    const gridPatternStyle: React.CSSProperties = {
        backgroundImage: `
            linear-gradient(to right, rgba(249, 115, 22, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(249, 115, 22, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
    };

    // Base64 encoded SVGs for reliable PDF generation and Print
    const headerLogoBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNTAgMTIwIj48cGF0aCBmaWxsPSIjZWE1ODBjIiBkPSJNMzAgNTUgTDYwIDk1IEwxMzAgMTUgTDExMCA1IEw2MCA2NSBMNTAgNDAgWiIgLz48L3N2Zz4=";
    const watermarkLogoBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cGF0aCBmaWxsPSIjZWE1ODBjIiBkPSJNNDAgODAgTDc1IDEyNSBMMTcwIDIwIEwxNTAgNSBMNzUgOTUgTDYwIDcwIFoiIC8+PC9zdmc+";

    return (
        // Added 'yazdirma-alani' class here as requested for print logic
        <div id="printable-area" className="w-full max-w-[210mm] mx-auto bg-white shadow-2xl min-h-[297mm] relative font-inter text-slate-900 overflow-hidden">
            
            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none z-0" style={gridPatternStyle}></div>

            {/* Watermark Logo (Onay Tick) - Positioned next to Section 1 */}
            <div className="absolute top-[220px] right-[-10px] w-[300px] h-[300px] opacity-[0.06] print:opacity-[0.06] pointer-events-none z-0 transform -rotate-12">
                 <img 
                    src={watermarkLogoBase64} 
                    alt="" 
                    className="w-full h-full object-contain" 
                />
            </div>

            {/* CONTENT CONTAINER */}
            <div className="relative z-10 p-6 md:p-8 print:p-[10mm] flex flex-col h-full justify-between">
                
                {/* --- HEADER --- */}
                <div>
                    {/* Framed Header Section */}
                    <div className="border-2 border-slate-800 rounded-lg p-3 mb-3 relative bg-white">
                         {/* Orange Accent Line inside - MOVED TO BOTTOM */}
                        <div className="absolute bottom-0 left-4 right-4 h-1 bg-orange-500 rounded-t-sm print:bg-orange-500"></div>
                        
                        <div className="flex justify-between items-end pt-1 pb-1">
                            <div className="flex items-center">
                                {/* Custom Logo Image for PDF safety */}
                                <div className="w-20 h-16 flex items-center justify-center mr-2">
                                    <img 
                                        src={headerLogoBase64} 
                                        alt="Onay Mühendislik Logo" 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                                <div className="flex flex-col justify-center -ml-1">
                                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-[0.85] mb-0.5">ONAY</h1>
                                    <h2 className="text-base font-medium text-orange-600 tracking-[0.35em] uppercase leading-none print:text-orange-600">Mühendislik</h2>
                                    <div className="w-full h-0.5 bg-orange-500 mt-1 mb-0.5 print:bg-orange-500"></div>
                                    <p className="text-[8px] font-bold text-slate-700 uppercase tracking-wide">Necati Koray KARADAĞ &bull; Makina Mühendisi</p>
                                </div>
                            </div>
                            <div className="text-right mb-1">
                                <div className="inline-flex flex-col items-end">
                                    <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider mb-0.5 print:text-orange-600">Teklif Tarihi</span>
                                    <span className="text-base font-bold text-slate-900 border-b-2 border-slate-300 px-2">{currentDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- CUSTOMER CARD (COMPRESSED) --- */}
                    <div className="bg-white border border-slate-300 shadow-sm rounded-lg p-3 mb-4 relative overflow-hidden print:border-slate-300 print:shadow-none">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 print:bg-orange-500"></div>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-0.5">SAYIN</span>
                                <h3 className="text-xl font-bold text-slate-900 uppercase leading-tight">{surveyData.customerName || '.......................................'}</h3>
                                <p className="text-xs text-slate-800 mt-1 max-w-md leading-tight">
                                    <span className="font-semibold text-orange-600 print:text-orange-600">Adres:</span> {surveyData.address || '................................................................................'}
                                </p>
                                <p className="text-xs text-slate-800 mt-0.5 leading-tight">
                                    <span className="font-semibold text-orange-600 print:text-orange-600">Tel:</span> {surveyData.phoneNumber || '.......................'}
                                </p>
                            </div>
                            <div className="text-right hidden sm:block print:block">
                                <p className="text-[10px] text-slate-600 italic">Keşif No: #2024-{Math.floor(Math.random() * 1000)}</p>
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-700 italic leading-tight">
                            Binanızda yapmış olduğumuz teknik keşif neticesinde, {mainServiceType} işi için hazırlanan teknik şartname ve fiyat teklifimiz aşağıda sunulmuştur.
                        </div>
                    </div>

                    {/* --- SPECIFICATION LISTS --- */}
                    <div className="space-y-4 relative z-10">
                        
                        {/* SECTION 1: Only show if NOT Kombi Montajı */}
                        {!isCombiMountOnly && (
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                {/* 1. DOĞALGAZ TESİSATI (Left Side) */}
                                <div className="relative flex-1 w-full">
                                    <div className="absolute -left-2.5 top-1.5 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-[10px] z-20 ring-4 ring-white print:ring-0">1</div>
                                    <div className="border-l-2 border-slate-300 pl-6 py-1 ml-0 h-full">
                                        <h4 className="text-sm font-bold text-slate-900 uppercase mb-2 border-b border-slate-300 inline-block pb-0.5">Doğal Gaz İç Tesisat</h4>
                                        <ul className="space-y-1 text-xs text-slate-900 font-medium leading-tight">
                                            <li className="flex items-center"><span className="w-1 h-1 bg-orange-500 rounded-full mr-2 print:bg-orange-500 shrink-0"></span>Mühendislik Hizmetleri (Proje Çizimi ve Gaz Açımı)</li>
                                            <li className="flex items-center"><span className="w-1 h-1 bg-orange-500 rounded-full mr-2 print:bg-orange-500 shrink-0"></span>Doğal Gaz Tesisat Malzemeleri ve Borulama</li>
                                            <li className="flex items-center"><span className="w-1 h-1 bg-orange-500 rounded-full mr-2 print:bg-orange-500 shrink-0"></span>Ocak ve Kombi Flex Bağlantıları</li>
                                            <li className="flex items-center"><span className="w-1 h-1 bg-orange-500 rounded-full mr-2 print:bg-orange-500 shrink-0"></span>Cam Menfezi ve Elektrik Şalteri Montajı</li>
                                            {/* Only show Kolon Tesisatı line if explicit */}
                                            {surveyData.pricingItems.some(i => i.name.includes('Kolon')) && (
                                                <li className="flex items-center"><span className="w-1 h-1 bg-orange-500 rounded-full mr-2 print:bg-orange-500 shrink-0"></span>Bina Ana Kolon Tesisatı ve Vana Kutusu</li>
                                            )}
                                            {/* Exproof Device Condition */}
                                            {hasExproofDevice && (
                                                <li className="flex items-center"><span className="w-1 h-1 bg-orange-500 rounded-full mr-2 print:bg-orange-500 shrink-0"></span>Exproof Gaz Alarm Cihazı ve Montajı</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                {/* ROOM DISTRIBUTION LIST (Right Side) */}
                                {!isInteriorGasOnly && surveyData.rooms.length > 0 && (
                                    <div className="w-full sm:w-64 mt-2 sm:mt-0">
                                        <div className="bg-white/90 border border-slate-200 shadow-sm rounded p-2 relative z-20">
                                            <h5 className="text-[9px] font-bold text-orange-600 uppercase mb-1 border-b border-orange-100 pb-0.5 print:text-orange-600">Petek & Oda Dağılımı</h5>
                                            <div className="grid grid-cols-1 gap-y-0.5">
                                                {surveyData.rooms.map((room) => {
                                                    // Display Logic: If multiple radiators, show "1.2 + 0.8 m"
                                                    const radiatorDisplay = room.radiators && room.radiators.length > 0
                                                        ? room.radiators.map(r => r.length).join(' + ')
                                                        : '0';

                                                    return (
                                                        <div key={room.id} className="flex justify-between items-center text-[9px] border-b border-dashed border-slate-100 last:border-0 pb-0.5 last:pb-0">
                                                            <span className="text-slate-800 truncate mr-2 font-semibold">{room.name}</span>
                                                            <span className="font-bold text-slate-900 whitespace-nowrap bg-slate-100 px-1 rounded-[2px]">
                                                                {room.isTowelRail 
                                                                    ? `${room.towelRailSize || 'Std'} (Hvl)` 
                                                                    : `${radiatorDisplay} m`}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. ISITMA VE CİHAZ */}
                        <div className="relative">
                            <div className="absolute -left-2.5 top-1.5 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-[10px] z-20 ring-4 ring-white print:ring-0 print:bg-orange-500">
                                {isCombiMountOnly ? '1' : '2'}
                            </div>
                            <div className="border-l-2 border-orange-200 pl-6 py-1 ml-0">
                                <h4 className="text-sm font-bold text-slate-900 uppercase mb-2 border-b border-slate-300 inline-block pb-0.5">Kombi ve Isıtma Sistemi</h4>
                                
                                {/* Combi Box */}
                                <div className="bg-orange-50 border border-orange-100 rounded p-2 mb-2 flex justify-between items-center print:bg-orange-50 print:border-orange-100">
                                    <div>
                                        <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider print:text-orange-600 block mb-0.5">CİHAZ</span>
                                        <p className="font-bold text-slate-900 text-xs">{combiName}</p>
                                    </div>
                                    {combiKw && <span className="bg-white text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-orange-200 print:text-orange-700 whitespace-nowrap ml-2">{combiKw}</span>}
                                </div>

                                <ul className="space-y-1 text-xs text-slate-900 font-medium leading-tight">
                                    
                                    {/* Radyatörler Summary (Only show if NOT strictly Combi Mount) */}
                                    {hasRadiators && !isInteriorGasOnly && !isCombiMountOnly && (
                                        <li className="flex justify-between border-b border-slate-200 pb-0.5 border-dotted max-w-md">
                                            <span className="flex items-center"><span className="w-1 h-1 bg-slate-500 rounded-full mr-2 shrink-0"></span>Demir Döküm Plus Panel Radyatörler (Toplam)</span>
                                            <span className="font-bold text-slate-900">{totalRadiatorMeters.toFixed(1)} Metre</span>
                                        </li>
                                    )}

                                    {/* 
                                        DYNAMIC TEXT LOGIC FOR 'KOMBI MONTAJI' 
                                        If user selected 'Kombi Montajı', list items based on active toggles.
                                    */}
                                    {isCombiMountOnly ? (
                                        <>
                                            {/* Moved Items from Section 1 for Combi Mount */}
                                            <li className="flex items-center"><span className="w-1 h-1 bg-orange-500 rounded-full mr-2 print:bg-orange-500 shrink-0"></span>Mühendislik Hizmetleri (Proje Çizimi ve Gaz Açımı)</li>
                                            <li className="flex items-center"><span className="w-1 h-1 bg-orange-500 rounded-full mr-2 print:bg-orange-500 shrink-0"></span>Cam Menfezi ve Elektrik Şalteri Montajı</li>
                                            
                                            {/* Combi Mount Specific Items */}
                                            <li className="flex items-center"><span className="w-1 h-1 bg-slate-500 rounded-full mr-2 shrink-0"></span>Kombi Montajı Hizmeti</li>
                                            {hasMountingMaterials && <li className="flex items-center"><span className="w-1 h-1 bg-slate-500 rounded-full mr-2 shrink-0"></span>Kombi Montaj Seti (Vana ve Filtreler Dahil)</li>}
                                            {hasFlexGroup && <li className="flex items-center"><span className="w-1 h-1 bg-slate-500 rounded-full mr-2 shrink-0"></span>Kombi ve Ocak Flex Bağlantı Grubu</li>}
                                            {hasCombiCabinet && <li className="flex items-center"><span className="w-1 h-1 bg-slate-500 rounded-full mr-2 shrink-0"></span>Kombi Koruma Dolabı (Montaj Dahil)</li>}
                                            {hasGasAlarm && <li className="flex items-center"><span className="w-1 h-1 bg-slate-500 rounded-full mr-2 shrink-0"></span>Gaz Alarm Cihazı (Solenoid Vana Bağlantılı)</li>}
                                            {hasChimneyExtension && <li className="flex items-center"><span className="w-1 h-1 bg-slate-500 rounded-full mr-2 shrink-0"></span>Ekstra Baca Uzatması ve Bağlantı Parçaları</li>}
                                        </>
                                    ) : (
                                        // Default Text for other types (Full, Plastiksiz, etc.)
                                        <>
                                            {isFullInstallation && (
                                                <li className="flex items-center"><span className="w-1 h-1 bg-slate-500 rounded-full mr-2 shrink-0"></span>Komple Kalorifer Tesisatı (PPRC / Mobil Sistem)</li>
                                            )}
                                            
                                            {isPlasticFree && (
                                                <li className="flex items-center"><span className="w-1 h-1 bg-slate-500 rounded-full mr-2 shrink-0"></span>Mevcut Tesisata Kombi ve Radyatör Montajı (Plastiksiz)</li>
                                            )}

                                            {isInteriorGasOnly && (
                                                <li className="flex items-center"><span className="w-1 h-1 bg-slate-500 rounded-full mr-2 shrink-0"></span>Sadece Kombi Montajı ve Gaz Bağlantısı</li>
                                            )}

                                            {!isInteriorGasOnly && <li className="flex items-center"><span className="w-1 h-1 bg-slate-500 rounded-full mr-2 shrink-0"></span>Kombi Alt Bağlantı Seti (Vana ve Filtreler)</li>}
                                            <li className="flex items-center"><span className="w-1 h-1 bg-slate-500 rounded-full mr-2 shrink-0"></span>Tüm Sistem İmalat, Montaj ve Test İşçiliği</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BOTTOM SECTION --- */}
                <div className="mt-auto relative z-20">
                    
                    {/* TOTALS TABLE (COMPRESSED) */}
                    <div className="mb-4">
                        <h4 className="font-bold text-right text-[10px] text-slate-600 uppercase mb-0.5">Fiyatlandırma Tablosu</h4>
                        <table className="w-full border-collapse border border-slate-800">
                            <thead>
                                <tr className="bg-slate-900 text-white text-xs uppercase print:bg-slate-900 print:text-white">
                                    <th className="py-1.5 px-3 text-left font-semibold border-r border-slate-700">Ürün / Hizmet Açıklaması</th>
                                    <th className="py-1.5 px-3 text-center w-24 font-semibold">Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-400">
                                    <td className="py-1.5 px-3 text-xs font-semibold text-slate-900">
                                        {pricingTableDescription}
                                    </td>
                                    <td className="py-1.5 px-3 text-center bg-orange-50 text-[10px] font-bold text-orange-700 border-l border-slate-400 print:bg-orange-50 print:text-orange-700">
                                        DAHİL
                                    </td>
                                </tr>
                                <tr className="border-b border-slate-800">
                                    <td className="py-1.5 px-3 text-right text-[10px] font-bold text-slate-600 uppercase tracking-wide">Genel Toplam</td>
                                    <td className="py-1.5 px-3 text-center text-lg font-extrabold text-slate-900 border-l border-slate-800 bg-slate-100 print:bg-slate-100 whitespace-nowrap">
                                        {totalPricingCost.toLocaleString('tr-TR')} <span className="text-sm font-bold">TL</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* ALTERNATIVE OFFERS SECTION */}
                    {surveyData.extraOffers && surveyData.extraOffers.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-bold text-left text-[9px] text-slate-600 uppercase mb-0.5 pl-1">Alternatif Kombi Seçenekleri</h4>
                            <table className="w-full border-collapse border border-slate-300">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-700 text-[9px] uppercase print:bg-slate-100">
                                        <th className="py-1 px-2 text-left font-semibold border border-slate-300">Kombi Marka / Model</th>
                                        <th className="py-1 px-2 text-right w-32 font-semibold border border-slate-300">Bu Seçenekle Toplam</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {surveyData.extraOffers.map(offer => {
                                         const totalWithOffer = baseSystemPrice + offer.price;
                                         return (
                                            <tr key={offer.id} className="border-b border-slate-200">
                                                <td className="py-0.5 px-2 text-[9px] font-bold text-slate-800 border border-slate-300">
                                                    {offer.name}
                                                </td>
                                                <td className="py-0.5 px-2 text-right text-xs font-bold text-emerald-700 border border-slate-300 whitespace-nowrap">
                                                    {totalWithOffer.toLocaleString('tr-TR')} TL
                                                </td>
                                            </tr>
                                         );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* NOTES & SIGNATURE */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 border-t-2 border-slate-300">
                        
                        {/* Notes Column */}
                        <div className="md:col-span-2">
                            <h5 className="text-[9px] font-bold text-slate-900 uppercase mb-1">Teknik Şartlar ve Notlar:</h5>
                            <ul className="text-[8px] text-slate-700 space-y-0.5 list-disc list-inside leading-tight font-medium">
                                <li>Fiyatlarımıza KDV dahil olup, teklifimiz 3 iş günü geçerlidir.</li>
                                <li>Isıtma tesisatında kullanılan tüm plastik borular CAM ELYAFLI KOMPOZİT boru olacaktır.</li>
                                <li>Cam menfezi ve baca deliği açılması camın yapısına bağlıdır (Temperli cam kesilmez).</li>
                                <li>Kombi elektrik hattı en yakın buattan çekilir, ilave hat talepleri elektrikçiye aittir.</li>
                                <li>Ödeme: Nakit, Kredi Kartı veya Anlaşmalı Banka Kredisi ile yapılabilir.</li>
                            </ul>
                        </div>

                        {/* Signatures */}
                        <div className="md:col-span-1 flex flex-col justify-end h-full">
                            <div className="flex justify-between items-end mt-2">
                                <div className="text-center w-1/2 px-2">
                                    <p className="text-[9px] font-bold text-slate-600 mb-6 uppercase">Müşteri Onayı</p>
                                    <div className="border-b border-slate-400 w-full"></div>
                                </div>
                                <div className="text-center w-1/2 px-2">
                                    <p className="text-[9px] font-bold text-orange-600 mb-6 uppercase print:text-orange-600">Onay Müh.</p>
                                    <div className="border-b border-orange-400 w-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Footer Branding */}
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-orange-500 print:visible print:bg-orange-500"></div>
        </div>
    );
};
