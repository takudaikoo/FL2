import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import type { Plan as DBPlan, Item as DBItem, AttendeeOption as DBAttendeeOption } from './lib/supabase';
import { PlanCategory, PlanId, AttendeeTier, Item, DropdownOption, Plan, AttendeeOption } from './types';
import DetailModal from './components/DetailModal';
import Footer from './components/Footer';
import QuoteDocument from './components/QuoteDocument';
import { Info, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  // --- State ---
  const [category, setCategory] = useState<PlanCategory>('funeral');
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('a');
  const [attendeeTier, setAttendeeTier] = useState<AttendeeTier>('A');

  // Options state
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());
  const [selectedGrades, setSelectedGrades] = useState<Map<number, string>>(new Map());
  const [customAttendeeCount, setCustomAttendeeCount] = useState<string>('');
  const [freeInputValues, setFreeInputValues] = useState<Map<number, number>>(new Map());

  // Modal state
  const [modalItem, setModalItem] = useState<Item | null>(null);
  const [isIncludedOpen, setIsIncludedOpen] = useState(false);

  // Supabase data
  const [plans, setPlans] = useState<Plan[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [attendeeOptions, setAttendeeOptions] = useState<AttendeeOption[]>([]);

  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
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
        console.log('Plans fetched:', plansData);

        // Fetch items
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .order('display_order', { ascending: true });

        if (itemsError) {
          console.error('Items error:', itemsError);
          throw itemsError;
        }
        console.log('Items fetched:', itemsData);

        // Fetch attendee options
        const { data: attendeeData, error: attendeeError } = await supabase
          .from('attendee_options')
          .select('*')
          .order('tier');

        if (attendeeError) {
          console.error('Attendee error:', attendeeError);
          throw attendeeError;
        }
        console.log('Attendee options fetched:', attendeeData);

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
  }, []);

  // --- Handlers ---

  const handleCategoryChange = (newCat: PlanCategory) => {
    setCategory(newCat);
    if (newCat === 'funeral') {
      setSelectedPlanId('a');
    } else {
      setSelectedPlanId('c');
    }
    // Reset options when switching major categories is usually good UX, 
    // but preserving relevant ones is also fine. Let's strict reset for clarity.
    setSelectedOptions(new Set());
    setSelectedGrades(new Map());
  };

  const handlePlanChange = (planId: PlanId) => {
    setSelectedPlanId(planId);
    // Grade availability might change, so we clean up invalid grades
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

  // --- Calculations ---

  const currentPlan = plans.find(p => p.id === selectedPlanId);

  const totalCost = useMemo(() => {
    if (!currentPlan) return 0;
    let total = currentPlan.price;

    items.forEach(item => {
      // 1. Check if allowed in current plan
      if (!item.allowedPlans.includes(selectedPlanId)) return;

      // 2. Add costs based on type
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

  // Get attendee label for display
  const attendeeLabel = useMemo(() => {
    const option = attendeeOptions.find(opt => opt.tier === attendeeTier);
    if (attendeeTier === 'D') {
      const count = parseInt(customAttendeeCount) || 0;
      return `自由入力 (${count}名)`;
    }
    return option?.label || '';
  }, [attendeeTier, customAttendeeCount, attendeeOptions]);

  // PDF Generation
  const handleDownloadPDF = async () => {
    console.log('PDF generation started');
    console.log('Current plan:', currentPlan);

    const element = document.getElementById('quote-document');
    console.log('Quote document element:', element);

    if (!element) {
      alert('見積書要素が見つかりません。');
      console.error('Element with id "quote-document" not found');
      return;
    }

    if (!currentPlan) {
      alert('プランが選択されていません。');
      console.error('No plan selected');
      return;
    }

    try {
      console.log('Showing quote document...');
      // Temporarily show the quote document
      element.style.display = 'block';

      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('Generating canvas...');
      // Generate canvas from HTML
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true, // Enable logging temporarily
        allowTaint: true,
      });

      console.log('Canvas generated:', canvas.width, 'x', canvas.height);

      // Hide it again
      element.style.display = 'none';

      console.log('Converting to image...');
      const imgData = canvas.toDataURL('image/png');

      console.log('Creating PDF...');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      console.log('Adding image to PDF...');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      const today = new Date().toLocaleDateString('ja-JP').replace(/\//g, '');
      const fileName = `見積書_${currentPlan.name}_${today}.pdf`;

      console.log('Saving PDF:', fileName);
      pdf.save(fileName);

      console.log('PDF generation completed successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      alert(`PDF生成中にエラーが発生しました。\n\nエラー: ${error instanceof Error ? error.message : '不明なエラー'}\n\nコンソールで詳細を確認してください。`);

      // Ensure element is hidden even on error
      if (element) {
        element.style.display = 'none';
      }
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };


  // --- Render Helpers ---

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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <div className="text-lg font-medium text-gray-600">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 print:bg-white">
      <div className="contents print:hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-3 px-6 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-tr-xl rounded-bl-xl flex items-center justify-center">
              <span className="text-white font-bold text-xs">FL</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-wide">First Leaf <span className="text-sm font-normal text-gray-500 ml-2">葬儀プランお見積り</span></h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">

          {/* Top Controls: Tabs & Plan Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-48">

            {/* Left Column: Plan & Attendees */}
            <div className="lg:col-span-4 flex flex-col gap-4 sticky top-4 h-fit">

              {/* Category Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 rounded-xl">
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
                  火葬のみプラン
                </button>
              </div>

              {/* Plan Selection Cards */}
              <div className={`p-4 rounded-2xl border-2 transition-colors duration-300 ${category === 'funeral' ? 'bg-emerald-50 border-emerald-200' : 'bg-purple-50 border-purple-200'}`}>
                <h2 className={`text-base font-bold mb-3 flex items-center gap-2 ${getThemeColor('text')}`}>
                  <Check size={18} /> 基本プラン選択
                </h2>
                <div className="space-y-2">
                  {plans.filter(p => p.category === category).map(plan => (
                    <label
                      key={plan.id}
                      className={`block relative cursor-pointer p-3 rounded-xl border-2 transition-all ${selectedPlanId === plan.id ? 'bg-white border-current shadow-sm' : 'bg-white/50 border-transparent hover:bg-white'} ${selectedPlanId === plan.id ? (category === 'funeral' ? 'text-emerald-700 border-emerald-500' : 'text-purple-700 border-purple-500') : 'text-gray-600'}`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlanId === plan.id}
                        onChange={() => handlePlanChange(plan.id)}
                        className="sr-only"
                      />
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-base">{plan.name}</span>
                        <span className="font-bold text-lg">¥{plan.price.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{plan.description}</p>
                      {selectedPlanId === plan.id && (
                        <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${category === 'funeral' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Attendee Selector */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <h2 className="text-gray-700 font-bold mb-2 flex items-center gap-2 text-base">
                  参列人数 (概算)
                </h2>
                <div className="space-y-2">
                  <select
                    value={attendeeTier}
                    onChange={(e) => setAttendeeTier(e.target.value as AttendeeTier)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-base bg-gray-50"
                  >
                    {attendeeOptions.map(opt => (
                      <option key={opt.tier} value={opt.tier}>
                        {opt.tier === 'D' ? '自由入力 (100名～)' : `${opt.label}`}
                      </option>
                    ))}
                  </select>

                  {attendeeTier === 'D' && (
                    <div className="animate-fade-in mt-2">
                      <label className="text-xs text-gray-500 block mb-1">具体的な人数を入力してください</label>
                      <input
                        type="number"
                        value={customAttendeeCount}
                        onChange={(e) => setCustomAttendeeCount(e.target.value)}
                        placeholder="例: 150"
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    ※人数に応じて変動費が自動計算されます。
                  </p>
                </div>
              </div>

              {/* Total Cost Display (Moved from Footer) */}


              {/* Total Summary for Print (Visible only in print) */}
              <div className="hidden mt-8 border-t-2 border-gray-800 pt-4">
                {/* Print view handled by QuoteDocument now */}
              </div>

            </div>

            {/* Right Column: Options List */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <div className={`p-4 border-b border-gray-100 flex justify-between items-center ${getThemeColor('bg')}`}>
                  <h2 className={`font-bold text-lg ${getThemeColor('text')}`}>プラン詳細・オプション選択</h2>
                </div>

                <div className="p-2">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10 text-xs text-gray-500 uppercase font-semibold">
                      <tr>
                        <th className="p-3 pl-4 rounded-tl-lg">項目</th>
                        <th className="p-3 text-right">金額 (税抜)</th>
                        <th className="p-3 text-center w-24">詳細</th>
                        <th className="p-3 pr-4 text-center w-32 rounded-tr-lg">選択</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm md:text-base">

                      {/* 1. Included Items (Always top) */}
                      {/* 1. Included Items (Accordion) */}
                      {(() => {
                        const includedItems = items.filter(i => i.type === 'included' && i.allowedPlans.includes(selectedPlanId));
                        if (includedItems.length === 0) return null;

                        return (
                          <>
                            <tr
                              className="bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer transition-colors"
                              onClick={() => setIsIncludedOpen(!isIncludedOpen)}
                            >
                              <td colSpan={4} className="p-3 pl-4">
                                <div className="flex items-center gap-2 font-bold text-emerald-700">
                                  {isIncludedOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  プランに含まれるもの ({includedItems.length}点)
                                  <span className="text-xs font-normal text-gray-500 ml-2">
                                    {isIncludedOpen ? 'クリックで閉じる' : 'クリックで詳細を表示'}
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {isIncludedOpen && includedItems.map(item => (
                              <tr key={item.id} className="hover:bg-gray-50 group bg-white">
                                <td className="p-3 pl-8 border-l-4 border-emerald-100">
                                  <div className="font-medium text-gray-700">{item.name}</div>
                                  <div className="text-xs text-gray-400 mt-0.5 md:hidden">{item.description}</div>
                                </td>
                                <td className="p-3 text-right font-medium text-gray-500">プランに含む</td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalItem(item);
                                    }}
                                    className="text-gray-400 hover:text-emerald-600"
                                  >
                                    <Info size={18} />
                                  </button>
                                </td>
                                <td className="p-3 pr-4 text-center">
                                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                                    <Check size={14} />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </>
                        );
                      })()}

                      {/* Divider */}
                      <tr>
                        <td colSpan={4} className="bg-gray-50 p-2 text-xs font-bold text-gray-500 pl-4">
                          オプション・変動項目
                        </td>
                      </tr>

                      {/* 2. Checkboxes & Dropdowns & Tiers */}
                      {items.filter(i => i.type !== 'included').map(item => (
                        // Check compatibility
                        // Note: I restored the map logic inline here because Step 236 showed brackets were preserved
                        /* logic from original file */
                        (() => {
                          const isAllowed = item.allowedPlans.includes(selectedPlanId);
                          const isSelected = selectedOptions.has(item.id);
                          const dropdownValue = selectedGrades.get(item.id);

                          // Calculate display price
                          let priceDisplay = '-';
                          if (isAllowed) {
                            if (item.type === 'checkbox') {
                              priceDisplay = `¥${item.basePrice?.toLocaleString()}`;
                            } else if (item.type === 'dropdown') {
                              if (dropdownValue) {
                                const opt = item.options?.find(o => o.id === dropdownValue);
                                priceDisplay = opt ? `¥${opt.price.toLocaleString()}` : '-';
                              } else {
                                priceDisplay = '選択してください';
                              }
                            } else if (item.type === 'tier_dependent' && item.tierPrices) {
                              if (attendeeTier === 'D') {
                                // Unit Price * Count (Unit Price from Admin Setting)
                                const unitPrice = item.tierPrices['D'] ?? 0;
                                const count = parseInt(customAttendeeCount) || 0;
                                if (isSelected) {
                                  priceDisplay = `¥${(unitPrice * count).toLocaleString()}`;
                                } else {
                                  priceDisplay = `単価 ¥${unitPrice.toLocaleString()}`;
                                }
                              } else {
                                priceDisplay = `¥${item.tierPrices[attendeeTier].toLocaleString()}`;
                              }
                            } else if (item.type === 'free_input') {
                              const val = freeInputValues.get(item.id) ?? item.basePrice ?? 0;
                              priceDisplay = `¥${val.toLocaleString()}`;
                            }
                          } else {
                            priceDisplay = '× 選択できません';
                          }
                          return (
                            <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!isAllowed ? 'opacity-40 bg-gray-50' : ''} ${isSelected && item.type === 'checkbox' ? 'bg-emerald-50/30' : ''}`}>
                              <td className="p-3 pl-4">
                                <div className={`font-medium ${!isAllowed ? 'text-gray-400' : 'text-gray-800'}`}>{item.name}</div>
                                {item.type === 'tier_dependent' && isAllowed && (
                                  <div className="text-xs text-emerald-600 mt-0.5">※人数帯ランク{attendeeTier}適用中</div>
                                )}
                              </td>
                              <td className={`p-3 text-right font-bold whitespace-nowrap ${!isAllowed ? 'text-gray-400' : 'text-gray-700'}`}>
                                {priceDisplay}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => setModalItem(item)}
                                  className={`hover:text-emerald-600 transition-colors ${!isAllowed ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400'}`}
                                  disabled={!isAllowed}
                                >
                                  <Info size={18} />
                                </button>
                              </td>
                              <td className="p-3 pr-4 text-center align-middle">
                                {/* Control Logic */}
                                {item.type === 'checkbox' && (
                                  <input
                                    type="checkbox"
                                    disabled={!isAllowed}
                                    checked={selectedOptions.has(item.id) && isAllowed}
                                    onChange={() => toggleOption(item.id)}
                                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 disabled:bg-gray-100"
                                  />
                                )}

                                {item.type === 'dropdown' && isAllowed && item.options && (
                                  <select
                                    className="w-full text-xs p-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                                    value={dropdownValue || ''}
                                    onChange={(e) => setGrade(item.id, e.target.value)}
                                  >
                                    <option value="">選択なし</option>
                                    {item.options.filter(o => o.allowedPlans.includes(selectedPlanId)).map(opt => (
                                      <option key={opt.id} value={opt.id}>
                                        {opt.name}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {/* Tier Dependent: Checkbox + (Tier D only) Unit Price Hint */}
                                {item.type === 'tier_dependent' && isAllowed && (
                                  <div className="flex items-center gap-2 justify-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedOptions.has(item.id)}
                                      onChange={() => toggleOption(item.id)}
                                      className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                                    />
                                    {attendeeTier === 'D' && isSelected && (
                                      <span className="text-xs text-emerald-600">
                                        {item.tierPrices?.['D'] ? `単価: ¥${item.tierPrices['D'].toLocaleString()}` : ''}
                                      </span>
                                    )}
                                    {/* Visual indicator for Tier A-C */}
                                    {attendeeTier !== 'D' && (
                                      <span className="text-xs text-gray-400"></span>
                                    )}
                                  </div>
                                )}

                                {item.type === 'free_input' && isAllowed && (
                                  <input
                                    type="number"
                                    value={freeInputValues.get(item.id) ?? item.basePrice ?? 0}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      const newMap = new Map(freeInputValues);
                                      newMap.set(item.id, isNaN(val) ? 0 : val);
                                      setFreeInputValues(newMap);
                                    }}
                                    className="w-24 text-sm p-1.5 border border-gray-300 rounded text-right focus:ring-1 focus:ring-emerald-500"
                                    placeholder="0"
                                  />
                                )}

                                {!isAllowed && (
                                  <span className="text-gray-300"><AlertCircle size={16} /></span>
                                )}
                              </td>
                            </tr>
                          );
                        })()
                      ))}
                    </tbody>
                  </table>

                  {/* Padding for bottom scroll */}
                  <div className="h-12"></div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer total={totalCost} onPrint={handlePrint} onDownloadPDF={handleDownloadPDF} />

        {/* Detail Modal */}
        {modalItem && (
          <DetailModal
            item={modalItem}
            onClose={() => setModalItem(null)}
          />
        )}
      </div>

      {/* Styles for print override */}
      <style>{`
        @media print {
          .print-preview-fix {
            left: 0 !important;
            top: 0 !important;
            position: absolute !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
        }
      `}</style>

      {/* Hidden Quote Document for PDF/Print (Visible only when printing) */}
      {currentPlan && (
        <div
          className="absolute top-0 print-preview-fix"
          style={{ left: '-5000px' }}
        >
          <QuoteDocument
            plan={currentPlan}
            items={items}
            selectedOptions={selectedOptions}
            selectedGrades={selectedGrades}
            attendeeTier={attendeeTier}
            customAttendeeCount={customAttendeeCount}
            freeInputValues={freeInputValues}
            totalCost={totalCost}
            attendeeLabel={attendeeLabel}
          />
        </div>
      )}
    </div>
  );
};

export default App;