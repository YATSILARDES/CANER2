
import React from 'react';
import { Room, Radiator } from '../types';
import { TOWEL_RAIL_SIZES } from '../constants';
import { TrashIcon, PlusCircleIcon } from './icons';
import { calculateRoomVolume, calculateRadiatorLength } from '../services/calculationService';

interface RoomCardProps {
    room: Room;
    onUpdateRoom: (roomId: number, field: keyof Room, value: string | number | boolean | Radiator[]) => void;
    onDeleteRoom: (roomId: number) => void;
    isEditMode: boolean;
    radiatorModels?: string[];
    onAddRadiatorModel?: (name: string) => void;
    onDeleteRadiatorModel?: (name: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ 
    room, 
    onUpdateRoom, 
    onDeleteRoom, 
    isEditMode,
    radiatorModels = ['DEMİRDÖKÜM', 'PİYASA'],
    onAddRadiatorModel,
    onDeleteRadiatorModel
}) => {
    const isBathroom = room.name.toLowerCase().includes('banyo');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === 'number' ? e.target.valueAsNumber || 0 : e.target.value;
        onUpdateRoom(room.id, e.target.name as keyof Room, value);
    };
    
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateRoom(room.id, e.target.name as keyof Room, e.target.value);
    };

    const handleTowelRailToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateRoom(room.id, 'isTowelRail', e.target.checked);
    };

    const handleAddRadiator = () => {
        const newRadiator = { id: `rad-${Date.now()}`, length: 0 };
        onUpdateRoom(room.id, 'radiators', [...(room.radiators || []), newRadiator]);
    };

    const handleRadiatorChange = (radiatorId: string, newValue: number) => {
        const updatedRadiators = (room.radiators || []).map(r => 
            r.id === radiatorId ? { ...r, length: newValue } : r
        );
        onUpdateRoom(room.id, 'radiators', updatedRadiators);
    };

    const handleDeleteRadiator = (radiatorId: string) => {
        const updatedRadiators = (room.radiators || []).filter(r => r.id !== radiatorId);
        onUpdateRoom(room.id, 'radiators', updatedRadiators);
    };

    // Dynamic Radiator Model Handlers
    const handleAddModelClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => {
            const name = window.prompt("Yeni Petek Modeli:");
            if (name && onAddRadiatorModel) onAddRadiatorModel(name);
        }, 10);
    };

    const handleDeleteModelClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (room.radiatorModel && onDeleteRadiatorModel) {
            onDeleteRadiatorModel(room.radiatorModel);
        }
    };
    
    const volume = calculateRoomVolume(room);
    const radiatorLength = calculateRadiatorLength(room);

    // Fallback for legacy data without radiators array
    const safeRadiators = room.radiators || [];

    return (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-grow mr-4">
                     <input
                        type="text"
                        name="name"
                        value={room.name}
                        onChange={handleInputChange}
                        placeholder="Oda Adı (örn. Mutfak)"
                        className="text-lg font-semibold text-slate-700 bg-transparent border-b-2 border-transparent focus:border-blue-500 focus:outline-none w-full"
                    />
                </div>
                {isEditMode && (
                    <button onClick={() => onDeleteRoom(room.id)} className="no-print text-red-500 hover:text-red-700 transition">
                        <TrashIcon />
                    </button>
                )}
            </div>

            {/* Bathroom Specific Toggle */}
            {isBathroom && (
                 <div className="mb-3 p-2 bg-blue-50 rounded-md border border-blue-100 flex items-center space-x-3">
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={!!room.isTowelRail} 
                                onChange={handleTowelRailToggle}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${room.isTowelRail ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${room.isTowelRail ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <div className="ml-3 text-sm font-medium text-slate-700">
                            {room.isTowelRail ? 'Havlupan' : 'Standart Petek'}
                        </div>
                    </label>
                 </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                    <label className="text-xs text-slate-500">Genişlik (m)</label>
                    <input 
                        type="number" 
                        name="width" 
                        value={room.width === 0 ? '' : room.width}
                        placeholder="0"
                        onChange={handleInputChange} 
                        className="w-full p-2 border rounded-md bg-white" 
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500">Uzunluk (m)</label>
                    <input 
                        type="number" 
                        name="length" 
                        value={room.length === 0 ? '' : room.length} 
                        placeholder="0"
                        onChange={handleInputChange} 
                        className="w-full p-2 border rounded-md bg-white" 
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500">Yükseklik (m)</label>
                    <input 
                        type="number" 
                        name="height" 
                        value={room.height === 0 ? '' : room.height} 
                        placeholder="0"
                        onChange={handleInputChange} 
                        className="w-full p-2 border rounded-md bg-white" 
                    />
                </div>
                 <div>
                    <label className="text-xs text-slate-500">Hacim (m³)</label>
                    <p className="w-full p-2 font-bold text-lg text-blue-700">{volume.toFixed(2)}</p>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="font-semibold text-sm text-slate-600 mb-2">
                    {room.isTowelRail ? 'Havlupan Seçimi' : 'Isı Kaybı & Petek Hesaplaması'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-start">
                    {!room.isTowelRail && (
                        <>
                            <div>
                                <label className="text-xs text-slate-500">Isı Kaybı Katsayısı</label>
                                <input 
                                    type="number" 
                                    name="heatLossCoefficient" 
                                    value={room.heatLossCoefficient} 
                                    onChange={handleInputChange} 
                                    className="w-full p-2 border rounded-md bg-white" 
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 flex justify-between">
                                    Petek Modeli
                                </label>
                                <div className="flex items-center space-x-1">
                                    <select name="radiatorModel" value={room.radiatorModel} onChange={handleSelectChange} className="w-full p-2 border rounded-md bg-white">
                                        {radiatorModels.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                    {isEditMode && onAddRadiatorModel && (
                                        <button
                                            onMouseDown={handleAddModelClick}
                                            className="bg-blue-50 border border-blue-200 text-blue-600 p-1.5 rounded hover:bg-blue-100"
                                            title="Yeni Model Ekle"
                                        >
                                            <PlusCircleIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    {isEditMode && onDeleteRadiatorModel && (
                                        <button
                                            onMouseDown={handleDeleteModelClick}
                                            className="bg-red-50 border border-red-200 text-red-500 p-1.5 rounded hover:bg-red-100"
                                            title="Seçili Modeli Sil"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">Gerekli Petek (m)</label>
                                <p className="w-full p-2 font-bold text-lg text-green-700">{radiatorLength.toFixed(2)}</p>
                            </div>
                        </>
                    )}
                    
                    <div className={room.isTowelRail ? 'col-span-4' : 'col-span-1'}>
                        <label className="text-xs text-slate-500 block mb-1">
                            {room.isTowelRail ? 'Seçilen Havlupan' : 'Seçilen Petekler (m)'}
                        </label>
                         {room.isTowelRail ? (
                            <select 
                                name="towelRailSize" 
                                value={room.towelRailSize || TOWEL_RAIL_SIZES[0]} 
                                onChange={handleSelectChange} 
                                className="w-full p-2 border rounded-md bg-white"
                            >
                                {TOWEL_RAIL_SIZES.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                         ) : (
                            <div className="space-y-2">
                                {safeRadiators.map((rad, idx) => (
                                    <div key={rad.id} className="flex items-center space-x-1">
                                        <input 
                                            type="number" 
                                            value={rad.length === 0 ? '' : rad.length}
                                            onChange={(e) => handleRadiatorChange(rad.id, e.target.valueAsNumber || 0)} 
                                            className="w-full p-2 border rounded-md bg-white" 
                                            placeholder="0"
                                        />
                                        {/* Only allow deleting if there is more than 1 OR allow clearing if locked/edit mode allows */}
                                        {(isEditMode || safeRadiators.length > 1) && (
                                            <button 
                                                onClick={() => handleDeleteRadiator(rad.id)} 
                                                className="text-red-400 hover:text-red-600 p-1"
                                                title="Peteği Sil"
                                                // Disable delete if it's the only radiator and edit mode is off to prevent empty room
                                                disabled={!isEditMode && safeRadiators.length <= 1}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {/* Always allow adding extra radiator, regardless of edit mode */}
                                <button 
                                    onClick={handleAddRadiator}
                                    className="w-full flex items-center justify-center space-x-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded py-1.5 transition"
                                >
                                    <PlusCircleIcon className="w-4 h-4" />
                                    <span>İlave Petek Ekle</span>
                                </button>
                            </div>
                         )}
                         {room.isTowelRail && <span className="text-[10px] text-slate-400 block mt-1">*Havlupanlar toplam radyatör metre hesabına dahil edilmez.</span>}
                    </div>
                </div>

                {/* Towel Rail Pricing Section */}
                {room.isTowelRail && (
                    <div className="mt-4 bg-blue-50/50 p-3 rounded border border-blue-100">
                        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 mb-1">
                             <div className="col-span-4">Havlupan Cinsi</div>
                             <div className="col-span-2">Birim (Adet)</div>
                             <div className="col-span-3">Birim Fiyat</div>
                             <div className="col-span-3 text-right">Tutar</div>
                        </div>
                        <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4">
                                <span className="text-sm font-semibold text-slate-700">{room.towelRailSize || TOWEL_RAIL_SIZES[0]}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-sm text-slate-700 font-medium pl-2">1</span>
                            </div>
                            <div className="col-span-3">
                                <input 
                                    type="number" 
                                    name="towelRailPrice"
                                    value={room.towelRailPrice === 0 ? '' : room.towelRailPrice}
                                    placeholder="0"
                                    onChange={handleInputChange}
                                    className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="col-span-3 text-right">
                                <span className="text-sm font-bold text-slate-800">{(room.towelRailPrice || 0).toLocaleString('tr-TR')} TL</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
