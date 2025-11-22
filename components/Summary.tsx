
import React from 'react';
import { SaveIcon, DownloadIcon, UploadIcon } from './icons';
import { SurveyData } from '../types';

interface SummaryProps {
    totalConsumptionKw: number;
    totalPricingCost: number;
    surveyData: SurveyData;
    onFinalBidChange: (value: number) => void;
    onSaveTemplate: () => void;
    onDownloadProject?: () => void;
    onLoadProject?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SummaryItem: React.FC<{label: string, value: string | number, unit: string, isSecondary?: boolean}> = ({ label, value, unit, isSecondary }) => (
    <div className={`flex justify-between items-baseline py-2 border-b border-slate-100 ${isSecondary ? 'text-slate-500 text-sm' : 'text-slate-800'}`}>
        <span className={isSecondary ? '' : 'font-medium'}>{label}</span>
        <span className={`font-bold ${isSecondary ? '' : 'text-lg'}`}>{value} <span className="text-xs font-normal">{unit}</span></span>
    </div>
);

export const Summary: React.FC<SummaryProps> = ({ 
    totalConsumptionKw, 
    totalPricingCost,
    surveyData,
    onFinalBidChange,
    onSaveTemplate,
    onDownloadProject,
    onLoadProject
}) => {
    
    const calculateProfit = (percent: number) => {
        const price = Math.ceil(totalPricingCost * (1 + percent / 100));
        onFinalBidChange(price);
    };

    // Calculate Profit Display
    const finalPrice = surveyData.finalBidPrice || totalPricingCost;
    const netProfit = finalPrice - totalPricingCost;
    const profitMargin = totalPricingCost > 0 ? (netProfit / totalPricingCost) * 100 : 0;

    return (
        <>
            <div className="sticky top-8 bg-white p-6 rounded-lg shadow-md print-container">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Özet ve Hesaplamalar</h2>
                </div>
                
                <div className="space-y-2 mb-6">
                    <SummaryItem label="Toplam Tüketim" value={totalConsumptionKw.toFixed(2)} unit="kW" />
                    
                    {/* PRIMARY ACTION: Save Template (Quick Save) */}
                    <div className="pt-4 pb-2">
                        <button 
                            onClick={onSaveTemplate}
                            className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-all font-bold text-sm"
                        >
                            <SaveIcon className="w-5 h-5" />
                            <span>Taslağı Kaydet</span>
                        </button>
                        <p className="text-[10px] text-slate-400 text-center mt-1">
                            Son çalışmanızı tarayıcı hafızasına kaydeder.
                        </p>
                    </div>

                    {/* SECONDARY ACTIONS: File Operations */}
                    <div className="py-3 border-t border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase mb-2 block">Dosya İşlemleri</span>
                        <div className="grid grid-cols-2 gap-2">
                            {onDownloadProject && (
                                <button 
                                    onClick={onDownloadProject}
                                    className="flex items-center justify-center space-x-1 px-2 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-md transition-colors text-xs font-semibold border border-slate-200 hover:border-emerald-200"
                                    title="Projeyi bilgisayara dosya olarak kaydet"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    <span>Farklı Kaydet (.json)</span>
                                </button>
                            )}
                            
                            {onLoadProject && (
                                <label className="flex items-center justify-center space-x-1 px-2 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md transition-colors text-xs font-semibold border border-slate-200 hover:border-blue-200 cursor-pointer">
                                    <UploadIcon className="w-4 h-4" />
                                    <span>Dosya Aç</span>
                                    <input 
                                        type="file" 
                                        accept=".json" 
                                        onChange={onLoadProject} 
                                        className="hidden" 
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-2 pt-2">
                        <SummaryItem 
                            label="Ham Maliyet (Hesaplanan)" 
                            value={totalPricingCost.toLocaleString('tr-TR')} 
                            unit="TL" 
                            isSecondary={true}
                        />
                    </div>
                </div>

                {/* Profit Calculation Section */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Kâr Marjı Önerileri</h4>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <button 
                            onClick={() => calculateProfit(15)}
                            className="px-2 py-2 bg-white border border-slate-300 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition text-xs font-semibold"
                        >
                            %15 Kar
                            <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                                {Math.ceil(totalPricingCost * 1.15).toLocaleString('tr-TR')}
                            </span>
                        </button>
                        <button 
                            onClick={() => calculateProfit(20)}
                            className="px-2 py-2 bg-white border border-slate-300 rounded hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition text-xs font-semibold"
                        >
                            %20 Kar
                            <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                                {Math.ceil(totalPricingCost * 1.20).toLocaleString('tr-TR')}
                            </span>
                        </button>
                        <button 
                            onClick={() => calculateProfit(25)}
                            className="px-2 py-2 bg-white border border-slate-300 rounded hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition text-xs font-semibold"
                        >
                            %25 Kar
                            <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                                {Math.ceil(totalPricingCost * 1.25).toLocaleString('tr-TR')}
                            </span>
                        </button>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Müşteriye Sunulacak Son Fiyat</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={surveyData.finalBidPrice || ''} 
                                onChange={(e) => onFinalBidChange(e.target.valueAsNumber)}
                                placeholder={totalPricingCost.toString()}
                                className="w-full pl-3 pr-12 py-3 bg-white border-2 border-emerald-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 font-bold text-lg text-slate-800"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-bold">TL</span>
                        </div>
                        
                        {/* Dynamic Profit Display */}
                        <div className="mt-3 flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded px-3 py-2">
                            <span className="text-xs font-semibold text-emerald-800 uppercase">Tahmini Net Kar:</span>
                            <div className="text-right">
                                <span className="block text-sm font-bold text-emerald-700">
                                    +{netProfit.toLocaleString('tr-TR')} TL
                                </span>
                                <span className="block text-[10px] font-medium text-emerald-600">
                                    (%{profitMargin.toFixed(1)})
                                </span>
                            </div>
                        </div>

                        <p className="text-[10px] text-slate-500 mt-2 italic">
                            * Teklif formunda görünecek nihai tutardır. Boş bırakılırsa ham maliyet kullanılır.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};
