import React from 'react';
import { Plan, Item, AttendeeTier } from '../types';

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
}) => {
    const TAX_RATE = 0.10;
    const totalWithTax = Math.floor(totalCost * (1 + TAX_RATE));
    const today = new Date();
    const formattedDate = `${today.getFullYear()}年 ${today.getMonth() + 1}月 ${today.getDate()}日`;

    // --- Helpers ---
    const displayItems = items.filter((item) => {
        if (!item.allowedPlans.includes(plan.id)) return false;
        if (item.type === 'free_input') return true;
        if (item.type === 'included') return true;
        if (item.type === 'checkbox' || item.type === 'tier_dependent') {
            return selectedOptions.has(item.id);
        }
        if (item.type === 'dropdown') {
            return selectedGrades.has(item.id);
        }
        return false;
    });

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
            // For static tiers, maybe show nothing or tier name?
            return '-';
        }
        if (item.type === 'free_input') {
            // For free input, usually no extra detail unless we add a note field later
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

    // Prepare table rows (Fixed 25 rows for A4 layout)
    const MAX_ROWS = 25;
    const tableRows = Array.from({ length: MAX_ROWS }).map((_, index) => {
        const item = displayItems[index];
        return {
            name: item ? item.name : '',
            content: item ? getItemContent(item) : '',
            price: item ? getItemPrice(item) : null,
        };
    });

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
            <h1 className="text-3xl font-bold mb-6 tracking-wider border-b-2 border-black pb-2">御葬儀見積書兼申込書</h1>

            <div className="grid grid-cols-2 gap-6 h-full items-start">
                {/* --- Left Column: Form & Info --- */}
                <div className="flex flex-col gap-4">

                    {/* Customer Info Form */}
                    <div>
                        <h2 className="text-lg font-bold mb-1">顧客情報記入欄</h2>
                        <div className="border-2 border-black text-sm">
                            {/* Date Field */}
                            <div className="flex border-b border-gray-400 h-10">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">死亡月日</div>
                                <div className="flex-1 flex items-center justify-end px-2">年　　月　　日</div>
                            </div>

                            {/* Name */}
                            <div className="flex border-b border-gray-400 h-14">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">氏　　名</div>
                                <div className="flex-1 bg-blue-50/20"></div>
                            </div>

                            {/* Birth Date */}
                            <div className="flex border-b border-gray-400 h-10">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">生年月日</div>
                                <div className="flex-1 flex items-center justify-end px-2">年　　月　　日　　才</div>
                            </div>

                            {/* Address */}
                            <div className="flex border-b border-gray-400 h-14">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">現 住 所</div>
                                <div className="flex-1 bg-blue-50/20"></div>
                            </div>

                            {/* Honseki */}
                            <div className="flex border-b border-gray-400 h-14">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">本　　籍</div>
                                <div className="flex-1 bg-blue-50/20"></div>
                            </div>

                            {/* Applicant Info Header */}
                            <div className="bg-gray-200 border-b border-gray-400 h-6 flex items-center px-2 text-xs font-bold">申込者情報</div>

                            {/* Rep/Relation */}
                            <div className="flex border-b border-gray-400 h-10">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">代表者氏名</div>
                                <div className="flex-1 flex">
                                    <div className="flex-1 bg-blue-50/20 border-r border-gray-400"></div>
                                    <div className="w-10 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">続柄</div>
                                    <div className="w-14 bg-blue-50/20 shrink-0"></div>
                                </div>
                            </div>
                            {/* Chief Mourner */}
                            <div className="flex border-b border-gray-400 h-10">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">喪主氏名</div>
                                <div className="flex-1 flex items-center justify-end px-2 text-sm bg-blue-50/20">年　　月　　日　　才</div>
                            </div>

                            {/* Address 2 */}
                            <div className="flex border-b border-gray-400 h-14">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">住　　所</div>
                                <div className="flex-1 bg-blue-50/20"></div>
                            </div>

                            {/* Honseki 2 */}
                            {/* Reduced height slightly to fit layout */}
                            <div className="flex border-b border-gray-400 h-10">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">本　　籍</div>
                                <div className="flex-1 bg-blue-50/20"></div>
                            </div>

                            {/* Phone */}
                            <div className="flex border-b border-gray-400 h-8">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">電話番号</div>
                                <div className="flex-1 bg-blue-50/20"></div>
                            </div>
                            {/* Mobile */}
                            <div className="flex border-b border-black h-8">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">携帯番号</div>
                                <div className="flex-1 bg-blue-50/20"></div>
                            </div>

                            {/* Others Header */}
                            <div className="bg-gray-200 border-b border-gray-400 h-6 flex items-center px-2 text-xs font-bold">その他</div>

                            {/* Religion */}
                            <div className="flex border-b border-gray-400 h-8">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">宗旨・宗派</div>
                                <div className="flex-1 bg-blue-50/20"></div>
                            </div>

                            {/* Temple Info */}
                            <div className="flex border-b border-gray-400 h-[60px]">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">菩提寺情報</div>
                                <div className="flex-1 flex flex-col h-full">
                                    <div className="flex-1 border-b border-gray-200 flex items-center px-1 text-xs"><span className="w-8 shrink-0">名称</span></div>
                                    <div className="flex-1 border-b border-gray-200 flex items-center px-1 text-xs"><span className="w-8 shrink-0">電話</span></div>
                                    <div className="flex-1 flex items-center px-1 text-xs"><span className="w-8 shrink-0">FAX</span></div>
                                </div>
                            </div>
                            {/* Intro */}
                            <div className="flex h-8">
                                <div className="w-20 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs shrink-0">ご 紹 介</div>
                                <div className="flex-1 bg-blue-50/20"></div>
                            </div>
                        </div>
                    </div>

                    {/* Selected Plan Section */}
                    <div className="mt-2">
                        <h2 className="text-lg font-bold mb-1">選択されたプラン</h2>
                        <div className="border-2 border-emerald-600 rounded-xl overflow-hidden min-h-[90px]">
                            <div className="bg-emerald-600 text-white font-bold p-1.5 text-center text-base !print-color-adjust-exact">
                                {plan.name}
                            </div>
                            <div className="p-3 flex items-center justify-center h-full">
                                <div className="text-center">
                                    <p className="font-bold text-sm">参列人数: {attendeeLabel}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer / Notes - Reduced font size */}
                    <div className="mt-auto text-[7pt] text-gray-600 leading-tight">
                        <h3 className="font-bold text-xs mb-0.5 text-black">注意事項</h3>
                        <p className="mb-0.5">※個人情報の取扱い場合は提供することにより適切日以時においたや 個人情報(について)、担当機関 葬儀お達人情報など、開催者は お客さま個人情報サービスをご理解に状況でもご使用になることでありません。</p>
                        <p className="mb-0.5">※振込金額は3日(日)までに消費期間等はお振込ついてください。</p>
                        <p>※振込金額の事務及び提供するサービスは手数料などの関係によってもらえるのでは、第二期に金額がありません。</p>
                    </div>

                </div>

                {/* --- Right Column: Estimate --- */}
                <div className="flex flex-col h-full">
                    {/* Header Info */}
                    <div className="flex justify-between items-end mb-4 border-b border-black pb-1">
                        <div className="text-sm">日付 （　　　　　）</div>
                        <div className="text-sm">No.</div>
                    </div>

                    <div className="flex mb-4 items-center">
                        {/* Logo Placeholder */}
                        <div className="w-12 h-12 mr-3 flex items-center justify-center shrink-0">
                            <span className="text-3xl text-emerald-500">🌿</span>
                        </div>
                        <div className="text-sm leading-snug">
                            <div className="font-bold text-base mb-1">株式会社ファーストリーフ</div>
                            <div>〒253-0085</div>
                            <div>神奈川県茅ヶ崎市矢畑682-10</div>
                            <div>代表 大石慶太</div>
                        </div>
                    </div>

                    {/* New Section Header */}
                    <div className="mb-1 text-center font-bold border-b border-gray-400">お見積明細</div>

                    {/* Items Table - Fixed Height Container */}
                    <div className="flex-1 flex flex-col border-2 border-gray-400 text-sm">
                        <div className="bg-gray-200 border-b border-gray-400 flex font-bold text-center py-1 text-xs shrink-0 !print-color-adjust-exact">
                            <div className="flex-1 border-r border-gray-400">項目</div>
                            <div className="w-[100px]">金額</div>
                        </div>

                        {/* Rows Container - Flex Grow to fill space */}
                        <div className="flex-1 flex flex-col">
                            {/* Base Plan Row (Added as requested) */}
                            <div className="flex border-b border-gray-300 min-h-[22px] items-center text-xs">
                                <div className="flex-1 px-1.5 truncate border-r border-gray-300 h-full flex items-center">{plan.name} 基本料金</div>
                                <div className="w-[100px] text-right px-1.5 h-full flex items-center justify-end">
                                    ¥{plan.price.toLocaleString()}
                                </div>
                            </div>

                            {tableRows.map((row, i) => (
                                <div key={i} className="flex border-b border-gray-300 min-h-[22px] items-center text-xs">
                                    <div className="flex-1 px-1.5 truncate border-r border-gray-300 h-full flex items-center">{row.name}</div>
                                    <div className="w-[100px] text-right px-1.5 h-full flex items-center justify-end">
                                        {row.price !== null ? `¥${row.price.toLocaleString()}` : ''}
                                    </div>
                                </div>
                            ))}
                            {/* Fill remaining space if any */}
                            <div className="flex-1 bg-white"></div>
                        </div>

                        {/* Remarks */}
                        <div className="border-t-2 border-gray-400 grid grid-cols-[1fr] shrink-0">
                            <div className="bg-gray-200 px-2 font-bold border-b border-gray-300 text-xs py-1 !print-color-adjust-exact">
                                備考
                            </div>
                            <div className="h-[80px] bg-white"></div>
                        </div>
                    </div>

                    {/* Totals Section */}
                    <div className="mt-4 shrink-0">
                        <h3 className="font-bold mb-1">合計金額</h3>
                        <div className="border-2 border-gray-400 w-full">
                            <div className="grid grid-cols-[90px_1fr] border-b border-gray-400">
                                <div className="bg-gray-100 pl-2 py-0.5 font-bold text-sm flex items-center !print-color-adjust-exact">小計</div>
                                <div className="text-right pr-2 py-0.5">¥{totalCost.toLocaleString()}</div>
                            </div>
                            <div className="grid grid-cols-[90px_1fr] border-b border-gray-400">
                                <div className="bg-gray-100 pl-2 py-0.5 font-bold text-sm flex items-center !print-color-adjust-exact">消費税 (10%)</div>
                                <div className="text-right pr-2 py-0.5">¥{Math.floor(totalCost * 0.1).toLocaleString()}</div>
                            </div>
                            <div className="grid grid-cols-[90px_1fr]">
                                <div className="bg-gray-100 pl-2 py-1 font-bold text-base flex items-center !print-color-adjust-exact">合計金額</div>
                                <div className="text-right pr-2 py-1 font-bold text-lg">¥{totalWithTax.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Staff Seal */}
                    <div className="mt-3 border border-gray-400 w-1/2 h-14 flex shrink-0">
                        <div className="w-16 bg-gray-100 border-r border-gray-400 flex items-center justify-center font-bold text-xs !print-color-adjust-exact">担当者印</div>
                        <div className="flex-1"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuoteDocument;
