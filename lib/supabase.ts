import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbifluukpqhbjmhhvbgg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaWZsdXVrcHFoYmptaGh2YmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTIwNjMsImV4cCI6MjA4MDI4ODA2M30.ZTO6mJOVHohzd0isGrXI_K0tr0V1E9So_Ut1mXxZoBw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for database tables
export interface Plan {
    id: string;
    name: string;
    price: number;
    category: 'funeral' | 'cremation';
    description: string;
    created_at?: string;
    updated_at?: string;
}

export interface Item {
    id: number;
    name: string;
    description: string;
    display_order: number;
    type: 'included' | 'checkbox' | 'dropdown' | 'tier_dependent' | 'free_input';
    base_price?: number;
    allowed_plans: string[];
    tier_prices?: {
        A: number;
        B: number;
        C: number;
        D: number;
    };
    options?: DropdownOption[];
    created_at?: string;
    updated_at?: string;
}

export interface DropdownOption {
    id: string;
    name: string;
    price: number;
    allowedPlans: string[];
}

export interface AttendeeOption {
    tier: string;
    label: string;
    description: string;
    count?: number;
    created_at?: string;
}



