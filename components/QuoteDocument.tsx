import React from 'react';
import { Plan, Item, AttendeeTier } from '../types';
import { COMPANY_INFO } from '../constants';

interface QuoteDocumentProps {
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
    logoType: 'FL' | 'LS';
}


const QuoteDocument: React.FC<QuoteDocumentProps> = ({
    plan,
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
    logoType
}) => {
    // Current company info
    const info = COMPANY_INFO[logoType];
    const TAX_RATE = 0.10;

    // --- Price Calculation Logic ---
    // Recalculate here to handle taxable vs non-taxable separation dynamically
    const calculateItemPrice = (item: Item, tier: AttendeeTier, countStr: string, opts: Set<number>, grades: Map<number, string>, freeInputs: Map<number, number>): number => {
        if (item.type === 'checkbox' || item.type === 'included') return item.basePrice || 0;
        if (item.type === 'dropdown') {
            const gradeId = grades.get(item.id);
            if (gradeId && item.options) {
                const option = item.options.find((o) => o.id === gradeId);
                return option ? option.price : 0;
            }
            return 0;
        }
        if (item.type === 'tier_dependent' && item.tierPrices) {
            if (tier === 'D') {
                const unitPrice = item.tierPrices['D'] ?? 0;
                const count = parseInt(countStr) || 0;
                return unitPrice * count;
            } else {
                return item.tierPrices[tier] || 0;
            }
        }
        if (item.type === 'free_input') {
            return freeInputs.get(item.id) ?? item.basePrice ?? 0;
        }
        return 0;
    };

    // Helper to get price using current props
    const getItemPrice = (item: Item) => calculateItemPrice(item, attendeeTier, customAttendeeCount, selectedOptions, selectedGrades, freeInputValues);

    const today = new Date();
    const formattedDate = `${today.getFullYear()}年 ${today.getMonth() + 1}月 ${today.getDate()}日`;

    // --- Helpers ---
    const getItemContent = (item: Item): string => {
        if (item.type === 'dropdown') {
            const gradeId = selectedGrades.get(item.id);
            if (gradeId && item.options) {
                const option = item.options.find(o => o.id === gradeId);
                return option?.name || '-';
            }
        }
        if (item.type === 'tier_dependent') {
            if (attendeeTier === 'D') {
                return `${customAttendeeCount}名`;
            }
            return '-';
        }
        if (item.type === 'free_input') {
            return '-';
        }
        if (item.type === 'included') {
            if (item.useDropdown) {
                const gradeId = selectedGrades.get(item.id);
                if (gradeId && item.options) {
                    const option = item.options.find(o => o.id === gradeId);
                    return option?.name || '-';
                }
            }
            return '-';
        }
        return '-';
    };

    // Separate included items vs other options
    const includedItems = items.filter(item => {
        if (!item.allowedPlans.includes(plan.id)) return false;
        return item.type === 'included';
    });

    const allOptionItems = items.filter((item) => {
        // First check compatibility
        if (!item.allowedPlans.includes(plan.id)) return false;

        // Exclude included items (they are shown separately)
        if (item.type === 'included') return false;

        let isSelected = false;
        if (item.type === 'free_input') isSelected = true; // Always considered, check price later

        if (item.type === 'checkbox' || item.type === 'tier_dependent') {
            isSelected = selectedOptions.has(item.id);
        }
        if (item.type === 'dropdown') {
            isSelected = selectedGrades.has(item.id);
        }

        if (!isSelected) return false;

        // Final check: Price must be non-zero
        // (Allows for negative values like discounts, but filters out 0)
        const price = getItemPrice(item);
        return price !== 0;
    });

    // Identify non-taxable items (e.g., Cremation Fee)
    // Using name check is brittle but effective if IDs are not constant for this purpose.
    // Based on user request: "火葬料金" is non-taxable.
    const NON_TAXABLE_NAMES = ['火葬料金'];

    const taxableItems = allOptionItems.filter(item => !NON_TAXABLE_NAMES.includes(item.name));
    const nonTaxableItems = allOptionItems.filter(item => NON_TAXABLE_NAMES.includes(item.name));

    // Calculate Totals correctly
    const planPrice = plan.price;
    // Note: totalCost passed from parent might include everything. We should recalculate locally for display accuracy.
    // Taxable Subtotal = Plan Price + Taxable Options
    // Non-Taxable Subtotal = Non-Taxable Options

    // Wait, totalCost prop is used for Invoice too? If we change logic here, verify it matches.
    // Parent likely sums everything. We need to be consistent.
    // Let's rely on local calculation for the document display.

    const taxableOptionsTotal = taxableItems.reduce((sum, item) => sum + getItemPrice(item), 0);
    const nonTaxableOptionsTotal = nonTaxableItems.reduce((sum, item) => sum + getItemPrice(item), 0);

    const taxableSubtotal = planPrice + taxableOptionsTotal;
    const taxAmount = Math.floor(taxableSubtotal * TAX_RATE);
    const finalTotal = taxableSubtotal + taxAmount + nonTaxableOptionsTotal;


    // Prepare table rows using taxableItems
    const MAX_ROWS = 25;
    const tableRows = Array.from({ length: MAX_ROWS }).map((_, index) => {
        const item = taxableItems[index]; // Use taxableItems only for main table
        return {
            name: item ? item.name : '',
            content: item ? getItemContent(item) : '',
            price: item ? getItemPrice(item) : null,
            type: item ? item.type : null,
        };
    });

    // Helper for cells
    const LabelCell = ({ children }: { children: React.ReactNode }) => (
        <div className="w-24 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0 !print-color-adjust-exact">
            {children}
        </div>
    );

    const ValueCell = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => (
        <div className={`flex-1 px-2 flex items-center ${className} overflow-hidden`}>
            {children}
        </div>
    );

    return (
        <div
            id="quote-document"
            className="w-[210mm] h-[297mm] bg-white text-gray-900 overflow-hidden relative leading-relaxed"
            style={{
                padding: '15mm',
                boxSizing: 'border-box',
                fontFamily: '"Yu Mincho", "YuMincho", serif',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
            }}
        >
            {/* Header Title */}
            {/* Header Title Removed - Moved Layout Below */}

            <div className="grid grid-cols-2 gap-8 h-full items-start">
                {/* --- Left Column: Form & Info --- */}
                <div className="flex flex-col gap-5">
                    {/* Title moved here to align with company name */}
                    <div className="mt-8 mb-8">
                        <h1 className="text-3xl font-bold tracking-wider border-b-2 border-black pb-2 inline-block">御葬儀見積書兼申込書</h1>
                    </div>

                    {/* Customer Info Form */}
                    <div>
                        <h2
                            className="text-lg font-bold mb-1.5 py-1 px-2 text-center rounded-sm !print-color-adjust-exact"
                            style={{ backgroundColor: '#374151', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                        >
                            顧客情報記入欄
                        </h2>
                        <div className="border border-black text-sm rounded-sm overflow-hidden">
                            {/* Date Field */}
                            <div className="flex border-b border-gray-400 h-10">
                                <LabelCell>死亡月日</LabelCell>
                                <ValueCell className="justify-end bg-white">
                                    {customerInfo?.deathDate || <span className="text-gray-300 tracking-widest mr-4">　　年　　月　　日</span>}
                                </ValueCell>
                            </div>

                            {/* Name */}
                            <div className="flex border-b border-gray-400 h-14 bg-blue-50/10">
                                <LabelCell>氏　　名</LabelCell>
                                <ValueCell className="text-xl font-medium">
                                    {customerInfo?.deceasedName}
                                </ValueCell>
                            </div>

                            {/* Birth Date */}
                            <div className="flex border-b border-gray-400 h-10">
                                <LabelCell>生年月日</LabelCell>
                                <ValueCell className="justify-end gap-8">
                                    {customerInfo?.birthDate ? (
                                        <span>{customerInfo.birthDate}</span>
                                    ) : (
                                        <span className="text-gray-300 tracking-widest">　　年　　月　　日</span>
                                    )}
                                    <span>{customerInfo?.age ? `${customerInfo.age} 才` : ''}</span>
                                </ValueCell>
                            </div>

                            {/* Address */}
                            <div className="flex border-b border-gray-400 h-14 bg-blue-50/10">
                                <LabelCell>現 住 所</LabelCell>
                                <ValueCell className="text-sm leading-tight py-1">
                                    {customerInfo?.address}
                                </ValueCell>
                            </div>

                            {/* Honseki */}
                            <div className="flex border-b border-gray-400 h-12 bg-blue-50/10">
                                <LabelCell>本　　籍</LabelCell>
                                <ValueCell className="text-sm leading-tight py-1">
                                    {customerInfo?.honseki}
                                </ValueCell>
                            </div>

                            {/* Applicant Info Header */}
                            <div className="bg-gray-200 border-b border-gray-400 h-6 flex items-center px-2 text-sm font-bold !print-color-adjust-exact">
                                申込者情報
                            </div>

                            {/* Rep/Relation - Modified for more space */}
                            <div className="flex border-b border-gray-400 h-10">
                                <LabelCell>代表者氏名</LabelCell>
                                <div className="flex-1 flex">
                                    <div className="flex-1 border-r border-gray-400 px-2 flex items-center bg-blue-50/10">
                                        {customerInfo?.applicantName}
                                    </div>
                                    <div className="w-12 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0 !print-color-adjust-exact">
                                        続柄
                                    </div>
                                    {/* Increased width from w-20 to w-28 */}
                                    <div className="w-28 px-2 flex items-center justify-center bg-blue-50/10 border-l border-gray-400">
                                        {customerInfo?.applicantRelation}
                                    </div>
                                </div>
                            </div>

                            {/* Applicant Birth Date */}
                            <div className="flex border-b border-gray-400 h-10">
                                <LabelCell>生年月日</LabelCell>
                                <ValueCell className="justify-end bg-blue-50/10 text-sm">
                                    {customerInfo?.applicantBirthDate || <span className="text-gray-300 tracking-widest mr-4">　　年　　月　　日</span>}
                                </ValueCell>
                            </div>

                            {/* Chief Mourner */}
                            <div className="flex border-b border-gray-400 h-10">
                                <LabelCell>喪主氏名</LabelCell>
                                <ValueCell className="bg-blue-50/10">
                                    {customerInfo?.chiefMournerName}
                                </ValueCell>
                            </div>

                            {/* Address 2 */}
                            <div className="flex border-b border-gray-400 h-12 bg-blue-50/10">
                                <LabelCell>住　　所</LabelCell>
                                <ValueCell className="text-xs leading-tight py-1">
                                    {customerInfo?.chiefMournerAddress}
                                </ValueCell>
                            </div>

                            {/* Phone */}
                            <div className="flex border-b border-gray-400 h-9">
                                <LabelCell>電話番号</LabelCell>
                                <ValueCell className="bg-blue-50/10">
                                    {customerInfo?.chiefMournerPhone}
                                </ValueCell>
                            </div>
                            {/* Mobile */}
                            <div className="flex border-b border-black h-9">
                                <LabelCell>携帯番号</LabelCell>
                                <ValueCell className="bg-blue-50/10">
                                    {customerInfo?.chiefMournerMobile}
                                </ValueCell>
                            </div>

                            {/* Others Header */}
                            <div className="bg-gray-200 border-b border-gray-400 h-6 flex items-center px-2 text-sm font-bold !print-color-adjust-exact">
                                その他
                            </div>

                            {/* Religion */}
                            <div className="flex border-b border-gray-400 h-10">
                                <LabelCell>宗旨・宗派</LabelCell>
                                <ValueCell className="bg-blue-50/10">
                                    {customerInfo?.religion}
                                </ValueCell>
                            </div>

                            {/* Temple Info */}
                            <div className="flex border-b border-gray-400 h-[70px]">
                                <LabelCell>菩提寺情報</LabelCell>
                                <div className="flex-1 flex flex-col h-full text-xs">
                                    <div className="flex-1 border-b border-gray-200 flex items-center px-1">
                                        <span className="w-8 shrink-0 text-gray-500">名称</span>
                                        <span className="flex-1 font-medium text-sm">{customerInfo?.templeName}</span>
                                    </div>
                                    <div className="flex-1 border-b border-gray-200 flex items-center px-1">
                                        <span className="w-8 shrink-0 text-gray-500">電話</span>
                                        <span className="flex-1">{customerInfo?.templePhone}</span>
                                    </div>
                                    <div className="flex-1 flex items-center px-1">
                                        <span className="w-8 shrink-0 text-gray-500">FAX</span>
                                        <span className="flex-1">{customerInfo?.templeFax}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Intro */}
                            <div className="flex h-10">
                                <LabelCell>ご 紹 介</LabelCell>
                                <ValueCell className="bg-blue-50/10"></ValueCell>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer / Notes - Moved up since plan box is removed */}
                    <div className="mt-auto border-t border-gray-300 pt-4">
                        <div
                            className="px-2 py-1 text-lg font-bold mb-1 text-center rounded-sm !print-color-adjust-exact"
                            style={{ backgroundColor: '#374151', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                        >
                            注意事項
                        </div>
                        <div className="px-1 py-1 text-[7pt] text-gray-500 leading-tight text-justify">
                            <p className="mb-1">※個人情報の取扱いについて: ご提供いただいたお客様の個人情報は、葬儀の施行、請求業務、および関連サービスのご案内のみに利用し、法令に基づく場合を除き、第三者への提供は行いません。</p>
                            <p className="mb-1">※お支払期限: 請求書発行後、原則として7日以内にお振込みをお願いいたします。</p>
                            <p>※見積有効期限: 本見積書の有効期限は発行日より1ヶ月間とさせていただきます。</p>
                        </div>
                    </div>

                </div>

                {/* --- Right Column: Estimate --- */}
                <div className="flex flex-col h-full">
                    {/* Issue Date */}
                    <div className="flex justify-end mb-2">
                        <div className="text-sm font-medium">発行日: {formattedDate}</div>
                    </div>

                    {/* Company Info */}
                    <div className="flex mb-4 items-start">
                        {/* Logo */}
                        <div className="w-12 h-12 mr-4 flex items-center justify-center shrink-0 !print-color-adjust-exact">
                            <img src={info.logo} alt="Company Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-xl mb-1 text-gray-800">{info.name}</div>
                            <div className="text-sm text-gray-600 leading-snug relative w-fit">
                                <div>{info.address}</div>
                                <div className="mt-0.5">{info.contact}</div>
                                <div className="mt-0.5 font-medium flex items-center">
                                    <span>{info.rep}</span>
                                </div>
                                {info.stamp && (
                                    <img
                                        src={info.stamp}
                                        alt="Stamp"
                                        className="absolute object-contain opacity-80 z-10"
                                        style={{ width: '40px', height: '40px', right: '-10px', top: '10px' }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Basic Plan Section */}
                    <div className="mb-4 text-xs">
                        <div
                            className="font-bold text-center text-lg py-1 px-2 mb-1 !print-color-adjust-exact"
                            style={{ backgroundColor: '#374151', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                        >
                            基本プラン
                        </div>
                        <div className="flex border-b border-gray-300">
                            <div className="bg-gray-100 w-32 py-1 px-2 font-bold text-gray-700 !print-color-adjust-exact">選択されたプラン</div>
                            <div className="flex-1 py-1 px-2 font-bold flex items-center">
                                <span className="flex-1 text-center">{plan.name}</span>
                                <span className="font-mono">¥{plan.price.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Included Items */}
                        {includedItems.length > 0 && (
                            <div className="flex border-b border-gray-300">
                                <div className="bg-gray-100 w-32 py-1 px-2 font-bold text-gray-700 flex items-center !print-color-adjust-exact">
                                    プランに含まれるもの
                                </div>
                                <div className="flex-1 py-2 px-2 grid grid-cols-1 gap-y-1">
                                    {includedItems.map((item, idx) => (
                                        <div key={item.id} className="text-gray-600 text-[10px] flex items-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5 inline-block"></span>
                                            {item.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {attendeeLabel && attendeeLabel !== '-' && attendeeTier === 'D' && (
                            <div className="flex border-b border-gray-300">
                                <div className="bg-gray-100 w-32 py-1 px-2 font-bold text-gray-700 !print-color-adjust-exact">参列人数</div>
                                <div className="flex-1 py-1 px-2 text-center">{attendeeLabel}</div>
                            </div>
                        )}
                    </div>

                    {/* Options Section Header */}
                    <div
                        className="mb-0 text-center font-bold text-lg py-1 rounded-t-sm !print-color-adjust-exact"
                        style={{ backgroundColor: '#374151', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                    >
                        オプション
                    </div>

                    {/* Items Table - Fixed Height Container */}
                    <div className="flex-1 flex flex-col border-x border-b border-gray-400 text-sm">
                        <div className="bg-gray-100 border-b border-gray-400 flex font-bold text-center py-1.5 text-sm shrink-0 !print-color-adjust-exact">
                            <div className="flex-1 px-2 border-r border-gray-300">内訳 / 項目名</div>
                            <div className="w-[120px] px-2">金額 (税抜)</div>
                        </div>

                        {/* Rows Container - Flex Grow to fill space */}
                        <div className="flex-1 flex flex-col bg-white">
                            {/* Base Plan Row Removed as per request */}
                            {tableRows.map((row, i) => {
                                // Filter out empty rows unless they are placeholder used to fill space? 
                                // Actually checking logic above, we need to FILTER items first before mapping to rows. 
                                // But here we map over tableRows which is MAX_ROWS.
                                // We need to update tableRows creation logic.
                                // For now, let's just render. I need to update tableRows definition first!
                                return (
                                    <div key={i} className="flex border-b border-gray-200 min-h-[30px] items-center text-xs">
                                        <div className="flex-1 px-3 border-r border-gray-200 h-full flex items-center overflow-hidden">
                                            <span className="truncate">{row.name}</span>
                                            {row.content && row.content !== '-' && (
                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded shrink-0 ml-2">{row.content}</span>
                                            )}
                                        </div>
                                        <div className="w-[120px] text-right px-3 h-full flex items-center justify-end font-mono text-gray-700">
                                            {row.type === 'included' ? 'プラン内' : (row.price !== null ? `¥${row.price.toLocaleString()}` : '')}
                                        </div>
                                    </div>
                                )
                            })}
                            {/* Fill remaining space if any */}
                            <div className="flex-1 bg-white"></div>
                        </div>

                        {/* Non-taxable */}
                        <div className="grid grid-cols-[1fr] shrink-0 border-t border-gray-400">
                            <div className="bg-gray-100 px-3 font-bold border-b border-gray-300 text-sm py-1 !print-color-adjust-exact">
                                非課税
                            </div>
                            <div className="h-[30px] bg-white p-2 text-xs text-gray-600 flex flex-col justify-center">
                                {nonTaxableItems.map(item => (
                                    <div key={item.id} className="flex justify-between w-[200px]">
                                        <span>{item.name}</span>
                                        <span>¥{getItemPrice(item).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="grid grid-cols-[1fr] shrink-0 border-t border-gray-400">
                            <div className="bg-gray-100 px-3 font-bold border-b border-gray-300 text-sm py-1 !print-color-adjust-exact">
                                備考
                            </div>
                            <div className="h-[80px] bg-white p-2 text-xs text-gray-600 whitespace-pre-wrap leading-tight">
                                {customerInfo?.remarks}
                            </div>
                        </div>
                    </div>

                    {/* Totals Section */}
                    <div className="mt-4 shrink-0 ml-auto w-2/3">
                        <div className="border border-gray-800 shadow-sm rounded-sm overflow-hidden">
                            <div className="grid grid-cols-[100px_1fr] border-b border-gray-300">
                                <div className="bg-gray-100 pl-3 py-1 font-bold text-sm flex items-center text-gray-600 !print-color-adjust-exact">小計</div>
                                <div className="text-right pr-4 py-1 font-mono text-base">¥{taxableSubtotal.toLocaleString()}</div>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] border-b border-gray-300">
                                <div className="bg-gray-100 pl-3 py-1 font-bold text-sm flex items-center text-gray-600 !print-color-adjust-exact">消費税 (10%)</div>
                                <div className="text-right pr-4 py-1 font-mono text-base">¥{taxAmount.toLocaleString()}</div>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] bg-emerald-50">
                                <div className="pl-3 py-2 font-bold text-base flex items-center text-emerald-900 !print-color-adjust-exact">合計金額</div>
                                <div className="text-right pr-4 py-2 font-bold text-2xl font-mono text-emerald-700 underline decoration-2 decoration-emerald-300 underline-offset-4">
                                    ¥{finalTotal.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
            {/* Footer Serial Number (Outside main container, positioned absolute relative to page) */}
            <div className="absolute bottom-4 left-12 text-[10px] text-gray-400 font-mono tracking-widest !print-color-adjust-exact">
                {estimateId ? String(estimateId).padStart(6, '0') : ''}
            </div>
        </div >
    );
};

export default QuoteDocument;
