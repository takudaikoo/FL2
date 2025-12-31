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
    logoType: 'FL' | 'LS';
}

const COMPANY_INFO = {
    FL: {
        name: '株式会社ファーストリーフ',
        address: '〒253-0085 神奈川県茅ヶ崎市矢畑682-10',
        contact: 'TEL: 0467-38-5617 / FAX: 0467-38-5604',
        rep: '代表取締役 大石康太',
        stamp: '/images/stamp.png',
        logo: '/images/logo.png'
    },
    LS: {
        name: '株式会社 リンクサービス',
        address: '〒251-0861 神奈川県藤沢市大庭5135-13',
        contact: 'TEL: 0466-52-6896 / FAX: 0466-52-6904',
        rep: '代表取締役　菅野 大輝',
        stamp: null,
        logo: '/images/logoLS2.png'
    }
};

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
    const totalWithTax = Math.floor(totalCost * (1 + TAX_RATE));
    const today = new Date();
    const formattedDate = `${today.getFullYear()}年 ${today.getMonth() + 1}月 ${today.getDate()}日`;

    // --- Helpers ---
    // --- Helpers ---
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

    const displayItems = items.filter((item) => {
        // First check compatibility
        if (!item.allowedPlans.includes(plan.id)) return false;

        // Check selection status for checkbox/dropdown/tier
        // (Even if price is > 0, if it's not selected, we shouldn't show it?
        //  But getItemPrice returns 0 if not selected usually?
        //  Wait, checkbox prices are fixed basePrice. Need to check if selected.)

        let isSelected = false;
        if (item.type === 'free_input') isSelected = true; // Always considered, check price later
        if (item.type === 'included') isSelected = true;
        if (item.type === 'checkbox' || item.type === 'tier_dependent') {
            isSelected = selectedOptions.has(item.id);
        }
        if (item.type === 'dropdown') {
            isSelected = selectedGrades.has(item.id);
        }

        if (!isSelected) return false;

        // Final check: Price must be > 0
        // (Assuming "amount generated" means strictly positive. 
        //  If discount (negative) is possible, maybe !== 0. 
        //  But for now > 0 seems safer for "options that generate cost")
        const price = getItemPrice(item);
        return price > 0;
    });

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
                    {/* Header Info */}
                    <div className="flex justify-between items-end mb-4 border-b-2 border-black pb-2">
                        <div className="text-base">発行日: {formattedDate}</div>
                        {/* No. removed from here */}
                    </div>

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
                        {attendeeLabel && attendeeLabel !== '-' && (
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
                                            {row.price !== null ? `¥${row.price.toLocaleString()}` : ''}
                                        </div>
                                    </div>
                                )
                            })}
                            {/* Fill remaining space if any */}
                            <div className="flex-1 bg-white"></div>
                        </div>

                        {/* Remarks */}
                        <div className="grid grid-cols-[1fr] shrink-0 border-t border-gray-400">
                            <div className="bg-gray-100 px-3 font-bold border-b border-gray-300 text-sm py-1 !print-color-adjust-exact">
                                備考
                            </div>
                            <div className="h-[80px] bg-white p-2 text-xs text-gray-600">
                                {/* Empty space for handwriting or dynamic remarks */}
                            </div>
                        </div>
                    </div>

                    {/* Totals Section */}
                    <div className="mt-4 shrink-0 ml-auto w-2/3">
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
            {/* Footer Serial Number (Outside main container, positioned absolute relative to page) */}
            <div className="absolute bottom-4 left-12 text-[10px] text-gray-400 font-mono tracking-widest !print-color-adjust-exact">
                {estimateId ? String(estimateId).padStart(6, '0') : ''}
            </div>
        </div>
    );
};

export default QuoteDocument;
