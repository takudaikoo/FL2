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
    customerInfo?: any;
    estimateId?: number;
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
            <h1 className="text-3xl font-bold mb-6 tracking-wider border-b-2 border-black pb-2">御葬儀見積書兼申込書</h1>

            <div className="grid grid-cols-2 gap-8 h-full items-start">
                {/* --- Left Column: Form & Info --- */}
                <div className="flex flex-col gap-5">

                    {/* Customer Info Form */}
                    <div>
                        <h2 className="text-lg font-bold mb-1.5 border-l-4 border-emerald-600 pl-2">顧客情報記入欄</h2>
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
                                <ValueCell className="justify-end">
                                    {customerInfo?.birthDate ? (
                                        <span className="mr-8">{customerInfo.birthDate}</span>
                                    ) : (
                                        <span className="text-gray-300 tracking-widest mr-4">　　年　　月　　日</span>
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
                            <div className="bg-gray-200 border-b border-gray-400 h-6 flex items-center px-2 text-xs font-bold !print-color-adjust-exact">
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
                            <div className="bg-gray-200 border-b border-gray-400 h-6 flex items-center px-2 text-xs font-bold !print-color-adjust-exact">
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

                    {/* Selected Plan Section */}
                    <div className="mt-1">
                        <h2 className="text-lg font-bold mb-1.5 border-l-4 border-purple-600 pl-2">選択されたプラン</h2>
                        <div className="border border-purple-800 rounded-lg overflow-hidden">
                            <div className="bg-white text-black font-bold p-2 text-center text-lg border-b border-purple-800 !print-color-adjust-exact">
                                {plan.name}
                            </div>
                            <div className="p-3 bg-purple-50 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="font-bold text-gray-800">参列人数: {attendeeLabel}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer / Notes */}
                    <div className="mt-auto px-1 py-2 border-t border-gray-300">
                        <div className="text-[7pt] text-gray-500 leading-tight text-justify">
                            <p className="mb-1">※個人情報の取扱いについて: ご提供いただいたお客様の個人情報は、葬儀の施行、請求業務、および関連サービスのご案内のみに利用し、法令に基づく場合を除き、第三者への提供は行いません。</p>
                            <p className="mb-1">※お支払期限: 請求書発行後、原則として7日以内にお振込みをお願いいたします。</p>
                            <p>※見積有効期限: 本見積書の有効期限は発行日より1ヶ月間とさせていただきます。</p>
                        </div>
                    </div>

                </div>

                {/* --- Right Column: Estimate --- */}
                <div className="flex flex-col h-full">
                    {/* Header Info */}
                    <div className="flex justify-between items-end mb-6 border-b-2 border-black pb-2">
                        <div className="text-base">発行日: {formattedDate}</div>
                        <div className="text-xl font-bold font-mono">No. {estimateId ? String(estimateId).padStart(6, '0') : '------'}</div>
                    </div>

                    <div className="flex mb-6 items-start">
                        {/* Logo */}
                        <div className="w-12 h-12 mr-4 flex items-center justify-center shrink-0 !print-color-adjust-exact">
                            <img src="/images/logo.png" alt="First Leaf Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-xl mb-1 text-gray-800">株式会社ファーストリーフ</div>
                            <div className="text-sm text-gray-600 leading-snug relative w-fit">
                                <div>〒253-0085 神奈川県茅ヶ崎市矢畑682-10</div>
                                <div className="mt-0.5">TEL: 0467-38-5617 / FAX: 0467-38-5604</div>
                                <div className="mt-0.5 font-medium flex items-center">
                                    <span>代表取締役 大石康太</span>
                                </div>
                                <img
                                    src="/images/stamp.png"
                                    alt="Stamp"
                                    className="absolute object-contain opacity-80 z-10"
                                    style={{ width: '40px', height: '40px', right: '-10px', top: '10px' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* New Section Header */}
                    <div className="mb-2 text-center font-bold bg-gray-800 text-white py-1 rounded-t-sm !print-color-adjust-exact">お見積明細書</div>

                    {/* Items Table - Fixed Height Container */}
                    <div className="flex-1 flex flex-col border-x border-b border-gray-400 text-sm">
                        <div className="bg-gray-100 border-b border-gray-400 flex font-bold text-center py-1.5 text-xs shrink-0 !print-color-adjust-exact">
                            <div className="flex-1 px-2 border-r border-gray-300">内訳 / 項目名</div>
                            <div className="w-[120px] px-2">金額 (税抜)</div>
                        </div>

                        {/* Rows Container - Flex Grow to fill space */}
                        <div className="flex-1 flex flex-col bg-white">
                            {/* Base Plan Row */}
                            <div className="flex border-b border-gray-200 min-h-[30px] items-center text-xs hover:bg-gray-50">
                                <div className="flex-1 px-3 truncate border-r border-gray-200 h-full flex items-center font-bold text-gray-800">
                                    基本料金
                                </div>
                                <div className="w-[120px] text-right px-3 h-full flex items-center justify-end font-medium">
                                    ¥{plan.price.toLocaleString()}
                                </div>
                            </div>

                            {tableRows.map((row, i) => (
                                <div key={i} className="flex border-b border-gray-200 min-h-[30px] items-center text-xs">
                                    <div className="flex-1 px-3 border-r border-gray-200 h-full flex items-center overflow-hidden">
                                        <span className="truncate">{row.name}</span>
                                        {row.content && row.content !== '-' && (
                                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded shrink-0 ml-2">{row.content}</span>
                                        )}
                                    </div>
                                    <div className="w-[120px] text-right px-3 h-full flex items-center justify-end font-mono text-gray-700">
                                        {row.price !== null ? `¥${row.price.toLocaleString()}` : ''}
                                    </div>
                                </div>
                            ))}
                            {/* Fill remaining space if any */}
                            <div className="flex-1 bg-white"></div>
                        </div>

                        {/* Remarks */}
                        <div className="grid grid-cols-[1fr] shrink-0 border-t border-gray-400">
                            <div className="bg-gray-100 px-3 font-bold border-b border-gray-300 text-xs py-1 !print-color-adjust-exact">
                                備考
                            </div>
                            <div className="h-[100px] bg-white p-2 text-xs text-gray-600">
                                {/* Empty space for handwriting or dynamic remarks */}
                            </div>
                        </div>
                    </div>

                    {/* Totals Section */}
                    <div className="mt-6 shrink-0 ml-auto w-2/3">
                        <div className="border border-gray-800 shadow-sm rounded-sm overflow-hidden">
                            <div className="grid grid-cols-[100px_1fr] border-b border-gray-300">
                                <div className="bg-gray-100 pl-3 py-1 font-bold text-sm flex items-center text-gray-600 !print-color-adjust-exact">小計</div>
                                <div className="text-right pr-4 py-1 font-mono text-base">¥{totalCost.toLocaleString()}</div>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] border-b border-gray-300">
                                <div className="bg-gray-100 pl-3 py-1 font-bold text-sm flex items-center text-gray-600 !print-color-adjust-exact">消費税 (10%)</div>
                                <div className="text-right pr-4 py-1 font-mono text-base">¥{Math.floor(totalCost * 0.1).toLocaleString()}</div>
                            </div>
                            <div className="grid grid-cols-[100px_1fr] bg-emerald-50">
                                <div className="pl-3 py-2 font-bold text-base flex items-center text-emerald-900 !print-color-adjust-exact">合計金額</div>
                                <div className="text-right pr-4 py-2 font-bold text-2xl font-mono text-emerald-700 underline decoration-2 decoration-emerald-300 underline-offset-4">
                                    ¥{totalWithTax.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default QuoteDocument;
