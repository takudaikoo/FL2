import React, { useState } from 'react';
import { PlanCategory, PlanId, AttendeeTier, Item, AttendeeOption, Plan, CustomerInfo } from '../types';
import DetailModal from './DetailModal';
import Footer from './Footer';
import { Info, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useEstimateSystem } from '../hooks/useEstimateSystem';

interface MobileEstimatePageProps {
    system: ReturnType<typeof useEstimateSystem>;
    onOutputClick: () => Promise<void>;
    onInvoiceClick: () => Promise<void>;
    goToInputPage: () => void;
}

const MobileEstimatePage: React.FC<MobileEstimatePageProps> = ({ system, onOutputClick, onInvoiceClick, goToInputPage }) => {
    const {
        category,
        selectedPlanId,
        attendeeTier, setAttendeeTier,
        selectedOptions,
        selectedGrades,
        customAttendeeCount, setCustomAttendeeCount,
        freeInputValues, setFreeInputValues,
        modalItem, setModalItem,
        plans, items, attendeeOptions,
        handleCategoryChange, handlePlanChange, toggleOption, setGrade, setFreeInputValue,
        totalCost,
    } = system;

    const [isIncludedOpen, setIsIncludedOpen] = useState(false);

    const getThemeColor = (type: 'bg' | 'border' | 'text' | 'ring') => {
        const color = category === 'funeral' ? 'emerald' : 'purple';
        if (type === 'bg') return `bg-${color}-50`;
        if (type === 'border') return `border-${color}-500`;
        if (type === 'text') return `text-${color}-700`;
        if (type === 'ring') return `ring-${color}-500`;
        return '';
    };

    const getActiveTabClass = (cat: PlanCategory) => {
        if (category === cat) {
            return cat === 'funeral'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-purple-600 text-white shadow-md';
        }
        return 'bg-gray-100 text-gray-500 hover:bg-gray-200';
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
            {/* Mobile Header */}
            <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-20 shadow-sm">
                <h1 className="text-lg font-bold text-center text-gray-800">お見積り作成 (Mobile)</h1>
            </div>

            <main className="flex-1 p-4 w-full max-w-lg mx-auto">

                {/* Category Tabs */}
                <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-200 p-1 rounded-xl">
                    <button
                        onClick={() => handleCategoryChange('funeral')}
                        className={`py-2 px-4 rounded-lg font-bold transition-all text-sm ${getActiveTabClass('funeral')}`}
                    >
                        葬儀プラン
                    </button>
                    <button
                        onClick={() => handleCategoryChange('cremation')}
                        className={`py-2 px-4 rounded-lg font-bold transition-all text-sm ${getActiveTabClass('cremation')}`}
                    >
                        火葬のみ
                    </button>
                </div>

                {/* Plan Selection */}
                <section className="mb-6">
                    <h2 className={`font-bold mb-3 flex items-center gap-2 ${getThemeColor('text')}`}>
                        <Check size={18} /> プラン選択
                    </h2>
                    <div className="space-y-3">
                        {plans.filter(p => p.category === category).map(plan => (
                            <label
                                key={plan.id}
                                className={`block relative cursor-pointer p-4 rounded-xl border-2 transition-all ${selectedPlanId === plan.id ? 'bg-white border-current shadow-md' : 'bg-white/60 border-transparent'} ${selectedPlanId === plan.id ? (category === 'funeral' ? 'text-emerald-700 border-emerald-500' : 'text-purple-700 border-purple-500') : 'text-gray-600'}`}
                            >
                                <input
                                    type="radio"
                                    name="plan"
                                    value={plan.id}
                                    checked={selectedPlanId === plan.id}
                                    onChange={() => handlePlanChange(plan.id)}
                                    className="sr-only"
                                />
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-lg">{plan.name}</span>
                                    <span className="font-bold text-xl">¥{plan.price.toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-gray-500 leading-snug">{plan.description}</p>
                                {selectedPlanId === plan.id && (
                                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${category === 'funeral' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
                                )}
                            </label>
                        ))}
                    </div>
                </section>

                {/* Attendee Selector */}
                <section className="mb-6 bg-white p-4 rounded-xl border border-gray-200">
                    <h2 className="text-gray-700 font-bold mb-3 flex items-center gap-2">
                        参列人数
                    </h2>
                    <select
                        value={attendeeTier}
                        onChange={(e) => setAttendeeTier(e.target.value as AttendeeTier)}
                        className="w-full p-3 border border-gray-300 rounded-lg text-base bg-gray-50 mb-3"
                    >
                        {attendeeOptions.map(opt => (
                            <option key={opt.tier} value={opt.tier}>
                                {opt.tier === 'D' ? '自由入力' : `${opt.label}`}
                            </option>
                        ))}
                    </select>
                    {attendeeTier === 'D' && (
                        <div className="animate-fade-in">
                            <input
                                type="number"
                                value={customAttendeeCount}
                                onChange={(e) => setCustomAttendeeCount(e.target.value)}
                                placeholder="人数を入力 (例: 150)"
                                className="w-full p-3 border border-gray-300 rounded-lg text-base"
                            />
                        </div>
                    )}
                </section>

                {/* Included Items Accordion */}
                {(() => {
                    const includedItems = items.filter(i => i.type === 'included' && i.allowedPlans.includes(selectedPlanId));
                    if (includedItems.length === 0) return null;
                    return (
                        <section className="mb-6">
                            <button
                                onClick={() => setIsIncludedOpen(!isIncludedOpen)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl font-bold transition-colors ${isIncludedOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-white border border-gray-200 text-gray-600'}`}
                            >
                                <span className="flex items-center gap-2">
                                    プランに含まれるもの ({includedItems.length})
                                </span>
                                {isIncludedOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>

                            {isIncludedOpen && (
                                <div className="mt-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    {includedItems.map(item => (
                                        <div key={item.id} className="p-3 border-b border-gray-100 last:border-0 flex justify-between items-center">
                                            <span className="text-sm font-medium">{item.name}</span>
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">含む</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    );
                })()}

                {/* Options List */}
                <section>
                    <h2 className={`font-bold mb-3 text-lg ${getThemeColor('text')}`}>オプション選択</h2>
                    <div className="space-y-3">
                        {items.filter(i => i.type !== 'included' && i.allowedPlans.includes(selectedPlanId)).map(item => {
                            const isAllowed = item.allowedPlans.includes(selectedPlanId);
                            const isSelected = selectedOptions.has(item.id);
                            const dropdownValue = selectedGrades.get(item.id);

                            return (
                                <div key={item.id} className={`p-4 rounded-xl border transition-all ${isSelected ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-200'} ${!isAllowed ? 'opacity-50' : ''}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-800">{item.name}</h3>
                                            {item.basePrice && <div className="text-sm text-gray-500">¥{item.basePrice.toLocaleString()}</div>}
                                        </div>
                                        <button onClick={() => setModalItem(item)} className="text-gray-400 p-1">
                                            <Info size={20} />
                                        </button>
                                    </div>

                                    {/* Controls */}
                                    <div className="mt-2">
                                        {item.type === 'checkbox' && (
                                            <label className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleOption(item.id)}
                                                    disabled={!isAllowed}
                                                    className="w-6 h-6 rounded text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="text-sm font-bold">追加する</span>
                                            </label>
                                        )}

                                        {item.type === 'dropdown' && item.options && (
                                            <select
                                                className="w-full p-3 border border-gray-300 rounded-lg text-base bg-white"
                                                value={dropdownValue || ''}
                                                onChange={(e) => setGrade(item.id, e.target.value)}
                                                disabled={!isAllowed}
                                            >
                                                <option value="">選択なし</option>
                                                {item.options.filter(o => o.allowedPlans.includes(selectedPlanId)).map(opt => (
                                                    <option key={opt.id} value={opt.id}>
                                                        {opt.name} (+¥{opt.price.toLocaleString()})
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        {item.type === 'tier_dependent' && (
                                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleOption(item.id)}
                                                        className="w-6 h-6 rounded text-emerald-600"
                                                    />
                                                    <span className="text-sm font-bold">選択</span>
                                                </label>
                                                <span className="text-sm font-bold">
                                                    {attendeeTier === 'D' ?
                                                        (isSelected ? `¥${(item.tierPrices?.['D'] ? item.tierPrices['D'] * (parseInt(customAttendeeCount) || 0) : 0).toLocaleString()}` : `単価 ¥${(item.tierPrices?.['D'] ?? 0).toLocaleString()}`)
                                                        : `¥${(item.tierPrices?.[attendeeTier] ?? 0).toLocaleString()}`
                                                    }
                                                </span>
                                            </div>
                                        )}

                                        {item.type === 'free_input' && (
                                            <div className="flex justify-end">
                                                <input
                                                    type="number"
                                                    value={freeInputValues.get(item.id) ?? item.basePrice ?? 0}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        setFreeInputValue(item.id, isNaN(val) ? 0 : val);
                                                    }}
                                                    className="w-32 p-2 border border-gray-300 rounded text-right"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

            </main>

            {/* Footer */}
            <Footer
                total={totalCost}
                onInputClick={goToInputPage}
                onOutputClick={onOutputClick}
                onInvoiceClick={onInvoiceClick}
            />

            {/* Modal */}
            {modalItem && (
                <DetailModal
                    item={modalItem}
                    onClose={() => setModalItem(null)}
                />
            )}
        </div>
    );
};

export default MobileEstimatePage;
