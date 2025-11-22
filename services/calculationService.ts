
import { Room, PipeDiameterRule, Appliance } from '../types';
import { RADIATOR_DIVISORS } from '../constants';

export const calculateTotalConsumptionKw = (appliances: Appliance[]): number => {
    return appliances.reduce((total, appliance) => total + (appliance.consumptionKw * appliance.count), 0);
};

export const calculateVentilationArea = (totalConsumptionKw: number, constant: number): number => {
    return totalConsumptionKw * constant;
};

export const calculatePipeDiameter = (totalConsumptionKw: number, pipeLength: number, chart: PipeDiameterRule[]): string => {
    // Note: This is a simplified calculation. Real-world scenarios involve pressure drop, pipe length, and fittings.
    const rule = chart.find(r => totalConsumptionKw > r.minKw && totalConsumptionKw <= r.maxKw);
    return rule ? rule.diameter : 'Hesaplama Dışı';
};

export const calculateRoomVolume = (room: Room): number => {
    return room.width * room.length * room.height;
};

export const calculateRadiatorLength = (room: Room): number => {
    if (!room.heatLossCoefficient || !room.radiatorModel) {
        return 0;
    }
    const volume = calculateRoomVolume(room);
    const heatLoss = volume * room.heatLossCoefficient;
    
    // Dynamic lookup or default to Piyasa (1250) if model not found in constant map
    // @ts-ignore
    const divisor = RADIATOR_DIVISORS[room.radiatorModel] || 1250;
    
    if (divisor > 0) {
        return heatLoss / divisor;
    }

    return 0;
};
