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
    // Dates
    const today = new Date();
    const formattedDate = today.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    const deadline = new Date(today);
    deadline.setDate(deadline.getDate() + 7);
    const formattedDeadline = deadline.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

    // Calculate Prices
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

    // Filter Items
    const includedItems = items.filter(item => {
        if (item.allowedPlans && !item.allowedPlans.includes(plan.id)) return false;
        return item.type === 'included';
    });

    const displayItems = items.filter((item) => {
        if (item.allowedPlans && !item.allowedPlans.includes(plan.id)) return false;
        if (item.type === 'included') return false;

        let isSelected = false;
        if (item.type === 'free_input') isSelected = true;
        if (item.type === 'checkbox' || item.type === 'tier_dependent') {
            isSelected = selectedOptions.has(item.id);
        }
        if (item.type === 'dropdown') {
            isSelected = selectedGrades.has(item.id);
        }

        if (!isSelected) return false;
        return getItemPrice(item) !== 0;
    });

    // Identify non-taxable items
    const NON_TAXABLE_NAMES = ['火葬料金', '控室料金', '斎場料金'];

    const taxableOptionItems = displayItems.filter(item => !NON_TAXABLE_NAMES.includes(item.name));
    const nonTaxableOptionItems = displayItems.filter(item => NON_TAXABLE_NAMES.includes(item.name));

    // Calculate Totals using ONLY local data to ensure consistency with display
    const planPrice = plan.price;
    const taxableOptionsTotal = taxableOptionItems.reduce((sum, item) => sum + getItemPrice(item), 0);
    const nonTaxableOptionsTotal = nonTaxableOptionItems.reduce((sum, item) => sum + getItemPrice(item), 0);

    const taxableSubtotal = planPrice + taxableOptionsTotal; // Plan is always taxable
    const taxAmount = Math.floor(taxableSubtotal * TAX_RATE);
    const finalTotal = taxableSubtotal + taxAmount + nonTaxableOptionsTotal;

    // Included Items Rows
    const includedRows = includedItems.map(item => ({
        name: item.name,
        price: 0,
        detail: '',
        type: 'included'
    }));

    // Taxable Option Rows
    const taxableOptionRows = taxableOptionItems.map(item => {
        let detail = '';
        if (item.type === 'dropdown' && item.options) {
            const gradeId = selectedGrades.get(item.id);
            const option = item.options.find(o => o.id === gradeId);
            if (option) detail = option.name;
        }
        return {
            name: item.name,
            price: getItemPrice(item),
            detail,
            type: item.type
        };
    });

    // Non-Taxable Option Rows
    const nonTaxableOptionRows = nonTaxableOptionItems.map(item => {
        let detail = '';
        if (item.type === 'dropdown' && item.options) {
            const gradeId = selectedGrades.get(item.id);
            const option = item.options.find(o => o.id === gradeId);
            if (option) detail = option.name;
        }
        return {
            name: item.name,
            price: getItemPrice(item),
            detail,
            type: item.type
        };
    });

    // Taxable Rows (Plan + Included + Taxable Options)
    const taxableRows = [
        { name: `基本プラン (${plan.name})`, price: plan.price, detail: '', type: 'plan' },
        ...includedRows,
        ...taxableOptionRows
    ];

    return (
        <div
            id="invoice-document"
            className="w-[210mm] h-[297mm] bg-white text-gray-900 overflow-hidden relative leading-relaxed flex flex-col"
            style={{
                padding: '15mm 20mm',
                boxSizing: 'border-box',
                fontFamily: '"Yu Mincho", "YuMincho", serif',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
            }}
        >
            {/* Header */}
            <h1 className="text-3xl font-bold text-center border-b-2 border-black pb-2 mb-8 tracking-widest">
                ご 請 求 書
            </h1>

            {/* Issue Date (Right aligned) */}
            <div className="text-right mb-4">
                <div className="text-sm">発行日: {formattedDate}</div>
            </div>

            {/* Top Layout: Customer Info vs Company Info */}
            <div className="grid grid-cols-2 gap-8 mb-8" style={{ marginTop: '15px' }}>

                {/* Left: Customer Info (50%) */}
                <div>
                    <div className="border-b border-black bg-gray-100 py-1 px-2 text-sm font-bold mb-4 !print-color-adjust-exact">
                        お客様情報
                    </div>

                    <div className="px-2">
                        {/* Address */}
                        <div className="mb-3">
                            <div className="text-sm leading-relaxed break-words">
                                <div>〒{(customerInfo?.applicantAddress || customerInfo?.chiefMournerAddress)?.split(' ')[0]?.replace('〒', '') || '　　-　　'}</div>
                                <div className="mt-1 break-words">{(customerInfo?.applicantAddress || customerInfo?.chiefMournerAddress)?.split(' ').slice(1).join(' ') || ''}</div>
                            </div>
                        </div>

                        {/* Applicant Name */}
                        <div className="mb-3">
                            <div className="text-xl font-bold border-b border-black inline-block pr-12 pb-1 break-words max-w-full">
                                {customerInfo?.applicantName || '　　　　'} 様
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <div className="text-xs text-gray-500 mb-0.5">お電話番号</div>
                            <div className="text-sm">
                                {customerInfo?.applicantPhone || customerInfo?.chiefMournerMobile || customerInfo?.chiefMournerPhone || ''}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Company Info (50%) */}
                <div className="text-right relative">
                    <div className="font-bold text-lg mb-1">{info.name}</div>
                    <div className="text-xs leading-relaxed text-gray-600">
                        <div>{info.address}</div>
                        <div>{info.contact}</div>
                        <div className="mt-1">{info.rep}</div>
                        {(info as any).registrationNumber && (
                            <div className="mt-1 text-[10px] text-gray-500">事業者登録番号: {(info as any).registrationNumber}</div>
                        )}
                    </div>
                    {/* Stamp */}
                    {info.stamp && (
                        <img
                            src={info.stamp}
                            alt="Stamp"
                            className="absolute object-contain opacity-80"
                            style={{ width: '60px', height: '60px', right: '0px', top: '10px' }}
                        />
                    )}
                </div>
            </div>

            {/* Billing Statement & Total */}
            <div className="mb-12" style={{ marginTop: '20px' }}>
                <div className="text-sm mb-4">
                    下記のとおりご請求申し上げます。
                </div>
                <div className="inline-block pr-12 pb-2 bg-gray-100 px-4 !print-color-adjust-exact" style={{ borderBottom: '3px solid black' }}>
                    <span className="font-bold text-xl">ご請求金額</span>
                    <span className="font-bold text-4xl font-mono">　　　¥{finalTotal.toLocaleString()} -</span>
                    <span className="text-sm ml-2">(税込)</span>
                </div>
            </div>

            {/* Main Table */}
            <div className="mb-8" style={{ marginTop: '20px' }}>
                <div className="border border-black text-sm">
                    {/* Table Header */}
                    <div className="flex bg-gray-100 font-bold border-b border-black !print-color-adjust-exact">
                        <div className="flex-1 text-left py-1 px-2 border-r border-black">内訳 / 項目名</div>
                        <div className="w-[20%] text-center py-1 px-2 border-r border-black">詳細</div>
                        <div className="flex-1 text-right py-1 px-2">金額 (税抜)</div>
                    </div>

                    {/* Table Body (Taxable) */}
                    <div>
                        {taxableRows.map((row, index) => (
                            <div key={index} className="flex border-b border-black last:border-0">
                                <div className="flex-1 text-left py-2 px-2 border-r border-black truncate">
                                    {row.name}
                                </div>
                                <div className="w-[20%] text-center py-2 px-2 border-r border-black truncate text-gray-600">
                                    {row.detail}
                                </div>
                                <div className="flex-1 text-right py-2 px-2 font-mono">
                                    {row.type === 'included' ? 'プラン内' : `¥${row.price.toLocaleString()}`}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Non-Taxable Section */}
                    {nonTaxableOptionRows.length > 0 && (
                        <>
                            {/* Non-taxable Header */}
                            <div className="flex bg-gray-100 font-bold border-y border-black !print-color-adjust-exact">
                                <div className="flex-1 text-left py-1 px-2">非課税対象</div>
                                <div className="w-[20%] border-l border-black"></div>
                                <div className="flex-1 border-l border-black"></div>
                            </div>
                            {/* Non-taxable Body */}
                            <div>
                                {nonTaxableOptionRows.map((row, index) => (
                                    <div key={`nt-${index}`} className="flex border-b border-black last:border-0">
                                        <div className="flex-1 text-left py-2 px-2 border-r border-black truncate">
                                            {row.name}
                                        </div>
                                        <div className="w-[20%] text-center py-2 px-2 border-r border-black truncate text-gray-600">
                                            {row.detail}
                                        </div>
                                        <div className="flex-1 text-right py-2 px-2 font-mono">
                                            ¥{row.price.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Subtotal / Tax / Total Calculation (Right aligned below table) */}
                <div className="flex flex-col items-end mt-4 text-sm">
                    <div className="flex justify-between w-[250px] border-b border-gray-300 py-1" style={{ borderTop: '1px solid #374151' }}>
                        <span>小計 (税抜)</span>
                        <span className="font-mono">¥{taxableSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between w-[250px] border-b border-gray-300 py-1">
                        <span>消費税 (10%)</span>
                        <span className="font-mono">¥{taxAmount.toLocaleString()}</span>
                    </div>
                    {/* Non-Taxable Total Row */}
                    {nonTaxableOptionsTotal > 0 && (
                        <div className="flex justify-between w-[250px] border-b border-gray-300 py-1">
                            <span>非課税計</span>
                            <span className="font-mono">¥{nonTaxableOptionsTotal.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between w-[250px] border-b-2 border-black py-2 font-bold">
                        <span>合計 (税込み)</span>
                        <span className="font-mono">¥{finalTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Spacer (Flexible) */}
            <div className="flex-1 min-h-[20px]"></div>

            {/* Bank Info */}
            <div className="mb-12" style={{ marginTop: '20px' }}>
                <div className="border-b border-black bg-gray-100 py-1 px-2 text-sm font-bold mb-2 !print-color-adjust-exact">お振込先</div>
                <div className="ml-4 text-sm leading-relaxed">
                    <div className="font-medium text-base mb-2">
                        {info.bankInfo.split('\n').map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                    </div>
                    <div className="text-xs text-gray-500">
                        <p>※お振込手数料はお客様負担にてお願いいたします。</p>
                        <p className="mt-1">※お支払期限: <span className="font-bold text-black text-sm">{formattedDeadline}</span></p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default InvoiceDocument;

