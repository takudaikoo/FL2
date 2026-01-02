import React from 'react';
import { Plan, Item, AttendeeTier } from '../types';
import { COMPANY_INFO } from '../constants';

interface InvoiceDocumentProps {
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

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
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
    const info = COMPANY_INFO[logoType];
    const TAX_RATE = 0.10;
    const totalTax = Math.floor(totalCost * TAX_RATE);
    const totalWithTax = totalCost + totalTax;

    const today = new Date();
    const formattedDate = `${today.getFullYear()}年 ${today.getMonth() + 1}月 ${today.getDate()}日`;

    // Payment Deadline: 7 days from today
    const deadlineDate = new Date(today);
    deadlineDate.setDate(today.getDate() + 7);
    const formattedDeadline = `${deadlineDate.getFullYear()}年 ${deadlineDate.getMonth() + 1}月 ${deadlineDate.getDate()}日`;

    // --- Helpers (Reused from QuoteDocument) ---
    const getItemPrice = (item: Item): number => {
        if (item.type === 'checkbox' || item.type === 'included') return item.basePrice || 0;
        if (item.type === 'dropdown') {
            const gradeId = selectedGrades.get(item.id);
            if (gradeId && item.options) {
                const option = item.options.find((o) => o.id === gradeId);
                return option ? option.price : 0;
            }
            return 0;
        }
        if (item.type === 'tier_dependent' && item.tierPrices) {
            if (attendeeTier === 'D') {
                const unitPrice = item.tierPrices['D'] ?? 0;
                const count = parseInt(customAttendeeCount) || 0;
                return unitPrice * count;
            } else {
                return item.tierPrices[attendeeTier] || 0;
            }
        }
        if (item.type === 'free_input') {
            return freeInputValues.get(item.id) ?? item.basePrice ?? 0;
        }
        return 0;
    };

    const displayItems = items.filter((item) => {
        if (!item.allowedPlans.includes(plan.id)) return false;

        let isSelected = false;
        if (item.type === 'free_input') isSelected = true;
        if (item.type === 'included') isSelected = true;
        if (item.type === 'checkbox' || item.type === 'tier_dependent') {
            isSelected = selectedOptions.has(item.id);
        }
        if (item.type === 'dropdown') {
            isSelected = selectedGrades.has(item.id);
        }

        if (!isSelected) return false;
        const price = getItemPrice(item);
        return price > 0;
    });

    // Main rows
    const rows = displayItems.map(item => ({
        name: item.name,
        price: getItemPrice(item)
    }));

    // Add Base Plan Row at the top if needed? 
    // QuoteDocument has "Basic Plan" section separately. 
    // For Invoice, usually valid to list it as an item.
    // Let's add the Plan as the first item manually.
    const allRows = [
        { name: `基本プラン (${plan.name})`, price: plan.price },
        ...rows
    ];

    return (
        <div
            id="invoice-document"
            className="w-[210mm] h-[297mm] bg-white text-gray-900 overflow-hidden relative leading-relaxed"
            style={{
                padding: '20mm',
                boxSizing: 'border-box',
                fontFamily: '"Yu Mincho", "YuMincho", serif',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
            }}
        >
            {/* Header */}
            <h1 className="text-3xl font-bold text-center border-b-2 border-black pb-2 mb-12 tracking-widest">
                請 求 書
            </h1>

            {/* Top Info Grid */}
            <div className="flex justify-between items-start mb-12">

                {/* Left: Customer Info */}
                <div className="flex-1 mr-8">
                    <div className="border-b border-black text-xl font-bold pb-1 mb-4">
                        {customerInfo?.applicantName || '　　　　'} 様
                    </div>
                    <div className="text-sm leading-loose">
                        <div>〒{customerInfo?.address?.split(' ')[0]?.replace('〒', '') || '　　-　　'}</div>
                        <div>{customerInfo?.address?.split(' ').slice(1).join(' ') || ''}</div>
                        <div className="mt-2">電話番号: {customerInfo?.chiefMournerMobile || customerInfo?.chiefMournerPhone || ''}</div>
                    </div>
                    <div className="mt-8 text-sm">
                        下記のとおりご請求申し上げます。
                    </div>
                    <div className="mt-4 border-b-2 border-black inline-block pr-12 pb-1">
                        <span className="font-bold text-lg mr-4">ご請求金額</span>
                        <span className="font-bold text-2xl font-mono">¥{totalWithTax.toLocaleString()} -</span>
                        <span className="text-xs ml-2">(税込)</span>
                    </div>
                </div>

                {/* Right: Company Info */}
                <div className="w-[80mm]">
                    <div className="text-right mb-4">
                        <div className="text-sm">発行日: {formattedDate}</div>
                        <div className="text-sm">番号: {estimateId ? String(estimateId).padStart(6, '0') : ''}</div>
                    </div>

                    <div className="relative">
                        <div className="font-bold text-lg mb-1">{info.name}</div>
                        <div className="text-xs leading-relaxed">
                            <div>{info.address}</div>
                            <div>{info.contact}</div>
                            <div className="mt-1">{info.rep}</div>
                        </div>
                        {/* Stamp */}
                        {info.stamp && (
                            <img
                                src={info.stamp}
                                alt="Stamp"
                                className="absolute object-contain opacity-80"
                                style={{ width: '50px', height: '50px', right: '0px', top: '10px' }}
                            />
                        )}
                        {/* Logo if needed, maybe smaller or standard */}
                        {/* <div className="absolute -top-4 -left-16 w-12 opacity-50">
                            <img src={info.logo} alt="logo" />
                        </div> */}
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="border-t border-black mb-8">
                {/* Table Header */}
                <div className="flex border-b border-black bg-gray-100 py-1 text-sm font-bold text-center !print-color-adjust-exact">
                    <div className="flex-1 border-r border-gray-300">内訳 / 項目名</div>
                    <div className="w-[150px]">金額 (税抜)</div>
                </div>

                {/* Table Body */}
                <div className="text-sm">
                    {allRows.map((row, index) => (
                        <div key={index} className="flex border-b border-gray-200 py-2">
                            <div className="flex-1 px-4 border-r border-gray-200 truncate">
                                {row.name}
                            </div>
                            <div className="w-[150px] px-4 text-right font-mono">
                                ¥{row.price.toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {/* Filler rows to maintain height if needed, OR just whitespace */}
                    {/* For Invoice, usually dynamic height is fine unless we want to push Footer to bottom. */}
                    {/* Let's use a minimum height or flex-grow spacer */}
                </div>
            </div>

            {/* Totals & Bank Info */}
            <div className="flex justify-between items-start mt-auto pt-4">

                {/* Left: Bank Info */}
                <div className="border border-gray-400 p-4 rounded-sm w-[60%] text-sm">
                    <div className="font-bold border-b border-gray-300 mb-2 pb-1 text-center bg-gray-100 !print-color-adjust-exact">お振込先</div>
                    <div className="whitespace-pre-wrap leading-relaxed">
                        {info.bankInfo}
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                        <p>※お振込手数料はお客様負担にてお願いいたします。</p>
                        <p>※お支払期限: <span className="font-bold text-gray-800">{formattedDeadline}</span></p>
                    </div>
                </div>

                {/* Right: Calculation */}
                <div className="w-[35%]">
                    <div className="flex justify-between border-b border-gray-300 py-1">
                        <span className="text-sm">小計 (税抜)</span>
                        <span className="font-mono">¥{totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300 py-1">
                        <span className="text-sm">消費税 (10%)</span>
                        <span className="font-mono">¥{totalTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b-2 border-black py-2 font-bold text-lg mt-1">
                        <span>ご請求金額</span>
                        <span className="font-mono">¥{totalWithTax.toLocaleString()}</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default InvoiceDocument;
