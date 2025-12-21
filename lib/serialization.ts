import { Plan, Item, AttendeeTier } from '../types';

export interface PrintData {
    plan: Plan;
    items: Item[];
    selectedOptions: number[]; // serialized Set
    selectedGrades: [number, string][]; // serialized Map
    attendeeTier: AttendeeTier;
    customAttendeeCount: string;
    freeInputValues: [number, number][]; // serialized Map
    totalCost: number;
    attendeeLabel: string;
}

export const serializePrintData = (
    plan: Plan,
    items: Item[],
    selectedOptions: Set<number>,
    selectedGrades: Map<number, string>,
    attendeeTier: AttendeeTier,
    customAttendeeCount: string,
    freeInputValues: Map<number, number>,
    totalCost: number,
    attendeeLabel: string
): string => {
    const data: PrintData = {
        plan,
        items,
        selectedOptions: Array.from(selectedOptions),
        selectedGrades: Array.from(selectedGrades.entries()),
        attendeeTier,
        customAttendeeCount,
        freeInputValues: Array.from(freeInputValues.entries()),
        totalCost,
        attendeeLabel,
    };
    return JSON.stringify(data);
};

export const deserializePrintData = (json: string): {
    plan: Plan;
    items: Item[];
    selectedOptions: Set<number>;
    selectedGrades: Map<number, string>;
    attendeeTier: AttendeeTier;
    customAttendeeCount: string;
    freeInputValues: Map<number, number>;
    totalCost: number;
    attendeeLabel: string;
} | null => {
    try {
        const data: PrintData = JSON.parse(json);
        return {
            plan: data.plan,
            items: data.items,
            selectedOptions: new Set(data.selectedOptions),
            selectedGrades: new Map(data.selectedGrades),
            attendeeTier: data.attendeeTier,
            customAttendeeCount: data.customAttendeeCount,
            freeInputValues: new Map(data.freeInputValues),
            totalCost: data.totalCost,
            attendeeLabel: data.attendeeLabel,
        };
    } catch (e) {
        console.error('Failed to parse print data:', e);
        return null;
    }
};
