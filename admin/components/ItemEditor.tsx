import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Item, DropdownOption } from '../../types';
import { Trash2, ArrowLeft, Upload, Loader2, Plus, Image as ImageIcon } from 'lucide-react';

interface ItemEditorProps {
    item: Item;
    isNew: boolean;
    onSave: (item: Item) => Promise<void>;
    onCancel: () => void;
}

const ItemEditor: React.FC<ItemEditorProps> = ({ item, isNew, onSave, onCancel }) => {
    const [editingItem, setEditingItem] = useState<Item>(JSON.parse(JSON.stringify(item)));
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (file: File, target: 'details', index: number) => {
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            const newDetails = [...(editingItem.details || [])];
            newDetails[index] = { ...newDetails[index], imagePath: publicUrl };
            setEditingItem({ ...editingItem, details: newDetails });

        } catch (error: any) {
            alert(`アップロードに失敗しました: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        await onSave(editingItem);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200 text-gray-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-lg font-bold text-gray-800">
                        {isNew ? '新規アイテム作成' : 'アイテム編集'}
                    </h2>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:bg-white border border-transparent hover:border-gray-300 rounded-lg transition-all"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm font-bold flex items-center gap-2"
                    >
                        保存する
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="p-8 max-w-4xl mx-auto space-y-8">
                {/* Basic Info Section */}
                <section className="space-y-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">基本情報</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                            <input
                                type="number"
                                value={editingItem.id}
                                onChange={e => setEditingItem({ ...editingItem, id: parseInt(e.target.value) || 0 })}
                                disabled={!isNew}
                                className="w-full p-2 border rounded-lg bg-gray-50 disabled:text-gray-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">タイプ</label>
                            <select
                                value={editingItem.type}
                                onChange={e => setEditingItem({ ...editingItem, type: e.target.value as any })}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="included">プランに含まれる (included)</option>
                                <option value="checkbox">チェックボックス (checkbox)</option>
                                <option value="dropdown">ドロップダウン (dropdown)</option>
                                <option value="tier_dependent">人数帯連動 (tier_dependent)</option>
                                <option value="free_input">自由入力 (free_input)</option>
                            </select>
                        </div>

                        {editingItem.type === 'included' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    追加設定
                                </label>
                                <label className="flex items-center gap-2 p-2 border rounded-lg bg-white cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={editingItem.useDropdown || false}
                                        onChange={e => setEditingItem({ ...editingItem, useDropdown: e.target.checked })}
                                        className="accent-emerald-600 w-5 h-5 rounded"
                                    />
                                    <span className="text-gray-700 font-medium">ドロップダウン選択を使用する</span>
                                </label>
                                <p className="text-xs text-gray-400 mt-1">
                                    ※「プランに含まれる」アイテムで、ユーザーに選択肢（色や種類など）を選ばせる場合に有効にします。追加料金は発生しません。
                                </p>
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">アイテム名</label>
                            <input
                                type="text"
                                value={editingItem.name}
                                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                                placeholder="アイテム名を入力"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">説明文</label>
                            <textarea
                                value={editingItem.description}
                                onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24"
                                placeholder="アイテムの簡単な説明を入力"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">表示順</label>
                            <input
                                type="number"
                                value={editingItem.displayOrder}
                                onChange={e => setEditingItem({ ...editingItem, displayOrder: parseInt(e.target.value) || 0 })}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Configuration Section */}
                <section className="space-y-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">設定・価格</h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">利用可能プラン</label>
                            <div className="flex flex-wrap gap-4">
                                {['a', 'b', 'c', 'd'].map(planId => (
                                    <label key={planId} className={`
                                        flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all
                                        ${editingItem.allowedPlans.includes(planId)
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                                    `}>
                                        <input
                                            type="checkbox"
                                            checked={editingItem.allowedPlans.includes(planId)}
                                            onChange={e => {
                                                const newPlans = e.target.checked
                                                    ? [...editingItem.allowedPlans, planId]
                                                    : editingItem.allowedPlans.filter(p => p !== planId);
                                                setEditingItem({ ...editingItem, allowedPlans: newPlans });
                                            }}
                                            className="accent-emerald-600 w-4 h-4"
                                        />
                                        <span className="uppercase">Plan {planId}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {(editingItem.type === 'checkbox' || editingItem.type === 'free_input') && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editingItem.type === 'free_input' ? '初期表示額 (任意)' : '基本価格'}
                                </label>
                                <div className="relative w-48">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                                    <input
                                        type="number"
                                        value={editingItem.basePrice || 0}
                                        onChange={e => setEditingItem({ ...editingItem, basePrice: parseInt(e.target.value) || 0 })}
                                        className="w-full pl-8 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-right"
                                    />
                                </div>
                                {editingItem.type === 'free_input' && (
                                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                                        <Loader2 size={12} className="animate-spin" /> {/* Just using an icon for attention */}
                                        ユーザーが金額を自由に入力できる項目です。マイナス値も入力可能です。
                                    </p>
                                )}
                            </div>
                        )}

                        {(editingItem.type === 'dropdown' || (editingItem.type === 'included' && editingItem.useDropdown)) && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
                                    <label className="font-bold text-gray-700">選択肢設定</label>
                                    <button
                                        onClick={() => {
                                            const newOpt = {
                                                id: Math.random().toString(36).substr(2, 9),
                                                name: '新規オプション',
                                                price: 0,
                                                allowedPlans: ['a', 'b', 'c', 'd']
                                            };
                                            setEditingItem({
                                                ...editingItem,
                                                options: [...(editingItem.options || []), newOpt]
                                            });
                                        }}
                                        className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                                    >
                                        <Plus size={14} /> 追加
                                    </button>
                                </div>
                                <div className="p-4 space-y-4 bg-white">
                                    {(editingItem.options || []).map((opt, idx) => (
                                        <div key={opt.id || idx} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                                            <div className="flex gap-4 mb-3">
                                                <div className="flex-1">
                                                    <label className="text-xs text-gray-500 mb-1 block">選択肢名</label>
                                                    <input
                                                        value={opt.name}
                                                        onChange={e => {
                                                            const opts = [...(editingItem.options || [])];
                                                            opts[idx] = { ...opt, name: e.target.value };
                                                            setEditingItem({ ...editingItem, options: opts });
                                                        }}
                                                        className="w-full p-2 border rounded bg-white"
                                                    />
                                                </div>
                                                <div className="w-32">
                                                    <label className="text-xs text-gray-500 mb-1 block">価格</label>
                                                    <input
                                                        type="number"
                                                        value={opt.price}
                                                        onChange={e => {
                                                            const opts = [...(editingItem.options || [])];
                                                            opts[idx] = { ...opt, price: parseInt(e.target.value) || 0 };
                                                            setEditingItem({ ...editingItem, options: opts });
                                                        }}
                                                        className="w-full p-2 border rounded bg-white text-right font-mono"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const opts = editingItem.options!.filter((_, i) => i !== idx);
                                                        setEditingItem({ ...editingItem, options: opts });
                                                    }}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded self-end"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">対象プラン</label>
                                                <div className="flex gap-2">
                                                    {['a', 'b', 'c', 'd'].map(pid => (
                                                        <label key={pid} className="flex items-center gap-1 text-xs cursor-pointer bg-white px-2 py-1 rounded border border-gray-200">
                                                            <input
                                                                type="checkbox"
                                                                checked={opt.allowedPlans?.includes(pid)}
                                                                onChange={e => {
                                                                    const plans = opt.allowedPlans || [];
                                                                    const newPlans = e.target.checked ? [...plans, pid] : plans.filter(p => p !== pid);
                                                                    const opts = [...(editingItem.options || [])];
                                                                    opts[idx] = { ...opt, allowedPlans: newPlans as any };
                                                                    setEditingItem({ ...editingItem, options: opts });
                                                                }}
                                                            />
                                                            <span className="uppercase">{pid}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {editingItem.type === 'tier_dependent' && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 p-3 border-b border-gray-200">
                                    <label className="font-bold text-gray-700">人数帯別価格設定</label>
                                </div>
                                <div className="p-4 bg-white grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['A', 'B', 'C', 'D'].map(tier => (
                                        <div key={tier}>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 text-center">ランク {tier}</label>
                                            <input
                                                type="number"
                                                value={editingItem.tierPrices?.[tier as any] || 0}
                                                onChange={e => {
                                                    const newPrices = { ...(editingItem.tierPrices || { A: 0, B: 0, C: 0, D: 0 }) };
                                                    // @ts-ignore
                                                    newPrices[tier] = parseInt(e.target.value) || 0;
                                                    setEditingItem({ ...editingItem, tierPrices: newPrices });
                                                }}
                                                className="w-full p-2 border rounded text-right font-mono"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Details Section (Images) */}
                <section className="space-y-6 pb-12">
                    <div className="flex justify-between items-end border-b pb-2">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">詳細情報・画像</h3>
                        <button
                            onClick={() => {
                                const newDetail = { description: '', imagePath: '' };
                                setEditingItem({
                                    ...editingItem,
                                    details: [...(editingItem.details || []), newDetail]
                                });
                            }}
                            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                        >
                            <Plus size={14} /> セクション追加
                        </button>
                    </div>

                    <div className="space-y-6">
                        {(editingItem.details || []).map((detail, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group hover:border-emerald-200 transition-colors">
                                <span className="absolute top-4 left-4 bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded">
                                    Section {idx + 1}
                                </span>
                                <button
                                    onClick={() => {
                                        const newDetails = editingItem.details!.filter((_, i) => i !== idx);
                                        setEditingItem({ ...editingItem, details: newDetails });
                                    }}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-1 bg-white hover:bg-red-50 rounded shadow-sm border border-gray-100"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 mb-1 block">タイトル</label>
                                            <input
                                                type="text"
                                                value={detail.title || ''}
                                                onChange={e => {
                                                    const newDetails = [...(editingItem.details || [])];
                                                    newDetails[idx] = { ...detail, title: e.target.value };
                                                    setEditingItem({ ...editingItem, details: newDetails });
                                                }}
                                                className="w-full p-2 border rounded text-sm"
                                                placeholder="例: 会場の様子"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 mb-1 block">説明文</label>
                                            <textarea
                                                value={detail.description}
                                                onChange={e => {
                                                    const newDetails = [...(editingItem.details || [])];
                                                    newDetails[idx] = { ...detail, description: e.target.value };
                                                    setEditingItem({ ...editingItem, details: newDetails });
                                                }}
                                                className="w-full p-2 border rounded text-sm h-32 leading-relaxed"
                                                placeholder="詳細な説明..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">画像</label>

                                        {/* Image Preview Area */}
                                        <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-emerald-300 transition-colors">
                                            {detail.imagePath ? (
                                                <>
                                                    <img
                                                        src={detail.imagePath}
                                                        alt="preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <label className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-lg font-bold shadow hover:bg-gray-100 flex items-center gap-2">
                                                            <Upload size={16} />
                                                            変更する
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    if (e.target.files?.[0]) handleUpload(e.target.files[0], 'details', idx);
                                                                }}
                                                            />
                                                        </label>
                                                    </div>
                                                </>
                                            ) : (
                                                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-emerald-50/50 transition-colors text-gray-400 hover:text-emerald-600">
                                                    {uploading ? (
                                                        <Loader2 className="animate-spin mb-2" size={32} />
                                                    ) : (
                                                        <ImageIcon className="mb-2 opacity-50" size={40} />
                                                    )}
                                                    <span className="text-sm font-bold">画像を選択 / D&D</span>
                                                    <span className="text-xs mt-1">またはクリックしてアップロード</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) handleUpload(e.target.files[0], 'details', idx);
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={detail.imagePath || ''}
                                            readOnly
                                            className="w-full text-xs text-gray-400 p-1 bg-transparent border-none focus:ring-0"
                                            placeholder="画像URL..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(editingItem.details || []).length === 0 && (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                                <p>詳細情報が設定されていません</p>
                                <button
                                    onClick={() => {
                                        const newDetail = { description: '', imagePath: '' };
                                        setEditingItem({
                                            ...editingItem,
                                            details: [...(editingItem.details || []), newDetail]
                                        });
                                    }}
                                    className="mt-4 text-emerald-600 font-bold hover:underline"
                                >
                                    + セクションを追加する
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-4">
                <button
                    onClick={onCancel}
                    className="px-6 py-3 text-gray-600 hover:bg-white border border-transparent hover:border-gray-300 rounded-lg transition-all font-bold"
                >
                    キャンセル
                </button>
                <button
                    onClick={handleSave}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-lg font-bold flex items-center gap-2 transform active:scale-95 transition-all"
                >
                    保存する
                </button>
            </div>
        </div>
    );
};

export default ItemEditor;
