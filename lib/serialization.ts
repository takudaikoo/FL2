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
    customerInfo?: any; // strict typing later if needed, avoiding circular imports annoyance for now or just import types
    estimateId?: number;
    logoType?: 'FL' | 'LS';
    documentType?: 'quote' | 'invoice';
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
    attendeeLabel: string,
    customerInfo?: any,
    estimateId?: number,
    logoType?: 'FL' | 'LS',
    documentType: 'quote' | 'invoice' = 'quote'
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
        customerInfo,
        estimateId,
        logoType,
        documentType
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
    customerInfo?: any;
    estimateId?: number;
    logoType?: 'FL' | 'LS';
    documentType?: 'quote' | 'invoice';
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
            customerInfo: data.customerInfo,
            estimateId: data.estimateId,
            logoType: data.logoType,
            documentType: data.documentType,
        };
    } catch (e) {
        console.error('Failed to parse print data:', e);
        return null;
    }
};
