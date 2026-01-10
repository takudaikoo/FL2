import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlanCategory, PlanId, AttendeeTier, Item, AttendeeOption, Plan, CustomerInfo } from '../types';
import { serializePrintData } from '../lib/serialization';

export const useEstimateSystem = () => {
    // Check for print mode
    const [isPrintMode, setIsPrintMode] = useState(false);

    // --- State ---
    const [category, setCategory] = useState<PlanCategory>('funeral');
    const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('a');
    const [attendeeTier, setAttendeeTier] = useState<AttendeeTier>('A');

    // Options state
    const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());
    const [selectedGrades, setSelectedGrades] = useState<Map<number, string>>(new Map());
    const [customAttendeeCount, setCustomAttendeeCount] = useState<string>('');
    const [freeInputValues, setFreeInputValues] = useState<Map<number, number>>(new Map());

    // Modal & View state
    const [modalItem, setModalItem] = useState<Item | null>(null);

    // State for loaded customer info
    const [loadedCustomerInfo, setLoadedCustomerInfo] = useState<CustomerInfo | null>(null);
    const [viewMode, setViewMode] = useState<'start' | 'home' | 'input'>('home');
    const [isSaving, setIsSaving] = useState(false);

    // Logo Toggle State
    const [logoType, setLogoType] = useState<'FL' | 'LS'>('FL');

    // Supabase data
    const [plans, setPlans] = useState<Plan[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [attendeeOptions, setAttendeeOptions] = useState<AttendeeOption[]>([]);

    const [loading, setLoading] = useState(true);

    // Fetch data from Supabase
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('print') === 'true') {
            setIsPrintMode(true);
            return; // Skip data fetching if print mode
        }

        // Skip fetching if in print mode (PrintPreview handles its own data loading from localStorage)
        if (isPrintMode) return;

        const fetchData = async () => {
            try {
                console.log('Fetching data from Supabase...');

                // Fetch plans
                const { data: plansData, error: plansError } = await supabase
                    .from('plans')
                    .select('*')
                    .order('id');

                if (plansError) {
                    console.error('Plans error:', plansError);
                    throw plansError;
                }

                // Fetch items
                const { data: itemsData, error: itemsError } = await supabase
                    .from('items')
                    .select('*')
                    .order('display_order', { ascending: true });

                if (itemsError) {
                    console.error('Items error:', itemsError);
                    throw itemsError;
                }

                // Fetch attendee options
                const { data: attendeeData, error: attendeeError } = await supabase
                    .from('attendee_options')
                    .select('*')
                    .order('tier');

                if (attendeeError) {
                    console.error('Attendee error:', attendeeError);
                    throw attendeeError;
                }

                // Convert snake_case to camelCase for items
                const convertedItems = (itemsData || []).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    displayOrder: item.display_order || 0,
                    type: item.type,
                    basePrice: item.base_price,
                    allowedPlans: item.allowed_plans,
                    tierPrices: item.tier_prices,
                    options: item.options,
                    useDropdown: item.use_dropdown,
                }));

                setPlans(plansData as Plan[]);
                setItems(convertedItems as Item[]);
                setAttendeeOptions(attendeeData as AttendeeOption[]);
                console.log('Data loaded successfully');
            } catch (error) {
                console.error('Error fetching data:', error);
                alert('データの読み込みに失敗しました。コンソールを確認してください。');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isPrintMode]);

    // --- Handlers ---

    const handleCategoryChange = (newCat: PlanCategory) => {
        setCategory(newCat);
        if (newCat === 'funeral') {
            setSelectedPlanId('a');
        } else {
            setSelectedPlanId('c');
        }
        setSelectedOptions(new Set());
        setSelectedGrades(new Map());
    };

    const handlePlanChange = (planId: PlanId) => {
        setSelectedPlanId(planId);
        setSelectedGrades(prev => {
            const next = new Map(prev);
            for (const [itemId, gradeId] of next.entries()) {
                const item = items.find(i => i.id === itemId);
                if (item?.options) {
                    const option = item.options.find(o => o.id === gradeId);
                    if (option && !option.allowedPlans.includes(planId)) {
                        next.delete(itemId);
                    }
                }
            }
            return next;
        });
    };

    const toggleOption = (itemId: number) => {
        const newSet = new Set(selectedOptions);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        setSelectedOptions(newSet);
    };

    const setGrade = (itemId: number, gradeId: string) => {
        const newMap = new Map(selectedGrades);
        if (gradeId === '') {
            newMap.delete(itemId);
        } else {
            newMap.set(itemId, gradeId);
        }
        setSelectedGrades(newMap);
    };

    const setFreeInputValue = (itemId: number, value: number) => {
        const newMap = new Map(freeInputValues);
        newMap.set(itemId, value);
        setFreeInputValues(newMap);
    }

    // --- Calculations ---

    const currentPlan = plans.find(p => p.id === selectedPlanId);

    const totalCost = useMemo(() => {
        if (!currentPlan) return 0;
        let total = currentPlan.price;

        items.forEach(item => {
            if (!item.allowedPlans.includes(selectedPlanId)) return;

            if (item.type === 'checkbox') {
                if (selectedOptions.has(item.id) && item.basePrice) {
                    total += item.basePrice;
                }
            } else if (item.type === 'dropdown') {
                const gradeId = selectedGrades.get(item.id);
                if (gradeId && item.options) {
                    const option = item.options.find(o => o.id === gradeId);
                    if (option) total += option.price;
                }
            } else if (item.type === 'tier_dependent') {
                if (selectedOptions.has(item.id) && item.tierPrices) {
                    if (attendeeTier === 'D') {
                        const unitPrice = item.tierPrices['D'] ?? 0;
                        const count = parseInt(customAttendeeCount) || 0;
                        total += unitPrice * count;
                    } else {
                        total += item.tierPrices[attendeeTier];
                    }
                }
            } else if (item.type === 'free_input') {
                const val = freeInputValues.get(item.id) ?? item.basePrice ?? 0;
                total += val;
            }
        });

        return total;
    }, [currentPlan, selectedPlanId, selectedOptions, selectedGrades, attendeeTier, items, attendeeOptions, freeInputValues, customAttendeeCount]);

    const attendeeLabel = useMemo(() => {
        const option = attendeeOptions.find(opt => opt.tier === attendeeTier);
        if (attendeeTier === 'D') {
            const count = parseInt(customAttendeeCount) || 0;
            return `自由入力 (${count}名)`;
        }
        return option?.label || '';
    }, [attendeeTier, customAttendeeCount, attendeeOptions]);

    const toggleLogo = () => {
        setLogoType(prev => prev === 'FL' ? 'LS' : 'FL');
    };

    const handleSaveAndPrint = async (customerInfo: CustomerInfo, documentType: 'quote' | 'invoice' = 'quote') => {
        if (!currentPlan) return;

        try {
            setIsSaving(true);
            const dataToSave = {
                plan: currentPlan,
                items,
                selectedOptions: Array.from(selectedOptions),
                selectedGrades: Array.from(selectedGrades.entries()),
                attendeeTier,
                customAttendeeCount,
                freeInputValues: Array.from(freeInputValues.entries()),
                totalCost,
                attendeeLabel,
                customerInfo,
                logoType
            };

            const { data, error } = await supabase
                .from('estimates')
                .insert([
                    {
                        content: dataToSave,
                        customer_info: customerInfo,
                        total_price: totalCost
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            const estimateId = data.id;

            // Update local state with the saved customer info so subsequent actions (like Invoice output) use it
            setLoadedCustomerInfo(customerInfo);

            const serializedData = serializePrintData(
                currentPlan,
                items,
                selectedOptions,
                selectedGrades,
                attendeeTier,
                customAttendeeCount,
                freeInputValues,
                totalCost,
                attendeeLabel,
                customerInfo,
                estimateId,
                logoType,
                documentType
            );

            localStorage.setItem('print_data', serializedData);
            const isMobile = new URLSearchParams(window.location.search).get('mobile') === 'true';
            window.open(`/?print=true${isMobile ? '&mobile=true' : ''}`, '_blank');

        } catch (error) {
            console.error('Error saving estimate:', error);
            alert('保存に失敗しました。もう一度お試しください。');
        } finally {
            setIsSaving(false);
        }
    };

    const executeLoadEstimate = async (id: number, showSuccessAlert = true) => {
        try {
            const { data, error } = await supabase
                .from('estimates')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                alert('見積データが見つかりませんでした');
                console.error('Error fetching estimate:', error);
                return false;
            }

            const content = data.content;
            if (!content) {
                alert('データの形式が正しくありません');
                return false;
            }

            if (content.plan && content.plan.id) {
                setSelectedPlanId(content.plan.id as any);
                const planDef = plans.find(p => p.id === content.plan.id);
                if (planDef) {
                    setCategory(planDef.category);
                }
            }
            if (content.items) setItems(content.items);

            if (content.selectedOptions) {
                setSelectedOptions(new Set(content.selectedOptions));
            }

            if (content.selectedGrades) {
                const grades = new Map(content.selectedGrades);
                setSelectedGrades(grades);
            }

            if (content.attendeeTier) setAttendeeTier(content.attendeeTier);
            if (content.customAttendeeCount) setCustomAttendeeCount(content.customAttendeeCount);

            if (content.freeInputValues) {
                const freeInputs = new Map(content.freeInputValues);
                setFreeInputValues(freeInputs);
            }

            if (content.logoType) setLogoType(content.logoType);

            if (content.customerInfo) {
                setLoadedCustomerInfo(content.customerInfo);
            }

            if (showSuccessAlert) {
                alert(`見積番号 ${id} を読み込みました。`);
            }
            return true;

        } catch (e) {
            console.error('Unexpected error loading estimate:', e);
            alert('読み込み中にエラーが発生しました');
            return false;
        }
    };

    return {
        isPrintMode, setIsPrintMode,
        category, setCategory,
        selectedPlanId, setSelectedPlanId,
        attendeeTier, setAttendeeTier,
        selectedOptions, setSelectedOptions,
        selectedGrades, setSelectedGrades,
        customAttendeeCount, setCustomAttendeeCount,
        freeInputValues, setFreeInputValues,
        modalItem, setModalItem,
        loadedCustomerInfo, setLoadedCustomerInfo,
        viewMode, setViewMode,
        isSaving, setIsSaving,
        logoType, setLogoType,
        plans, items, attendeeOptions, loading,
        handleCategoryChange, handlePlanChange, toggleOption, setGrade, setFreeInputValue,
        currentPlan, totalCost, attendeeLabel, toggleLogo, handleSaveAndPrint, executeLoadEstimate
    };
};
