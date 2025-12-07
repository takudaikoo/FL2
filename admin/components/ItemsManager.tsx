import React, { useState, useEffect } from 'react';
import { supabase, Item } from '../../lib/supabase';
import { Edit, Trash2, Plus, Search } from 'lucide-react';

const ItemsManager: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .order('id');

            if (error) throw error;

            // Convert snake_case to camelCase
            const convertedItems = (data || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                type: item.type,
                basePrice: item.base_price,
                allowedPlans: item.allowed_plans,
                tierPrices: item.tier_prices,
                options: item.options,
            }));

            setItems(convertedItems);
        } catch (error) {
            console.error('Error fetching items:', error);
            alert('アイテムの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingItem) return;

        try {
            // Convert camelCase back to snake_case for DB
            const dbItem = {
                id: editingItem.id,
                name: editingItem.name,
                description: editingItem.description,
                type: editingItem.type,
                base_price: editingItem.basePrice,
                allowed_plans: editingItem.allowedPlans,
                tier_prices: editingItem.tierPrices,
                options: editingItem.options,
            };

            if (isNew) {
                const { error } = await supabase
                    .from('items')
                    .insert([dbItem]);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('items')
                    .update(dbItem)
                    .eq('id', editingItem.id);
                if (error) throw error;
            }

            await fetchItems();
            setEditingItem(null);
            setIsNew(false);
        } catch (error: any) {
            console.error('Error saving item:', error);
            alert(`保存に失敗しました: ${error.message}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('本当に削除しますか？この操作は取り消せません。')) return;

        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchItems();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('削除に失敗しました');
        }
    };

    const startEdit = (item: Item) => {
        setEditingItem(JSON.parse(JSON.stringify(item))); // Deep copy
        setIsNew(false);
    };

    const startNew = () => {
        // Find max ID to suggest next ID
        const maxId = items.reduce((max, item) => Math.max(max, item.id), 0);

        setEditingItem({
            id: maxId + 1,
            name: '',
            description: '',
            type: 'checkbox',
            basePrice: 0,
            allowedPlans: ['a', 'b', 'c', 'd'],
        });
        setIsNew(true);
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-4">読み込み中...</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-lg font-bold text-gray-700">アイテム一覧</h3>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={startNew}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
                    >
                        <Plus size={18} />
                        新規追加
                    </button>
                </div>
            </div>

            {editingItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">
                            {isNew ? '新規アイテム作成' : 'アイテム編集'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                                <input
                                    type="number"
                                    value={editingItem.id}
                                    onChange={e => setEditingItem({ ...editingItem, id: parseInt(e.target.value) || 0 })}
                                    disabled={!isNew}
                                    className="w-full p-2 border rounded bg-gray-50 disabled:text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">タイプ</label>
                                <select
                                    value={editingItem.type}
                                    onChange={e => setEditingItem({ ...editingItem, type: e.target.value as any })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="included">プランに含まれる (included)</option>
                                    <option value="checkbox">チェックボックス (checkbox)</option>
                                    <option value="dropdown">ドロップダウン (dropdown)</option>
                                    <option value="tier_dependent">人数帯連動 (tier_dependent)</option>
                                    <option value="free_input">自由入力 (free_input)</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">アイテム名</label>
                                <input
                                    type="text"
                                    value={editingItem.name}
                                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                                <textarea
                                    value={editingItem.description}
                                    onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none h-20"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">利用可能プラン</label>
                                <div className="flex gap-4 p-2 border rounded bg-gray-50">
                                    {['a', 'b', 'c', 'd'].map(planId => (
                                        <label key={planId} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editingItem.allowedPlans.includes(planId)}
                                                onChange={e => {
                                                    const newPlans = e.target.checked
                                                        ? [...editingItem.allowedPlans, planId]
                                                        : editingItem.allowedPlans.filter(p => p !== planId);
                                                    setEditingItem({ ...editingItem, allowedPlans: newPlans });
                                                }}
                                                className="rounded text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="uppercase">{planId}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {(editingItem.type === 'checkbox' || editingItem.type === 'free_input') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {editingItem.type === 'free_input' ? '初期表示額 (任意)' : '基本価格'}
                                    </label>
                                    <input
                                        type="number"
                                        value={editingItem.basePrice || 0}
                                        onChange={e => setEditingItem({ ...editingItem, basePrice: parseInt(e.target.value) || 0 })}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            )}

                            {/* Free Input Description */}
                            {editingItem.type === 'free_input' && (
                                <div className="md:col-span-2 text-sm text-gray-500 bg-blue-50 p-2 rounded border border-blue-100">
                                    ℹ️ この項目は、ユーザーが画面上で「金額」を自由に入力できる項目として表示されます。<br />
                                    プラスの金額（追加費用）だけでなく、マイナスの値（値引き）も入力可能です。
                                </div>
                            )}

                            {/* Dropdown Options Editor */}
                            {editingItem.type === 'dropdown' && (
                                <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-sm text-gray-700">選択肢設定</h4>
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
                                            className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700"
                                        >
                                            + 追加
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {(editingItem.options || []).map((opt, idx) => (
                                            <div key={opt.id || idx} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                                                <div className="flex gap-2 mb-2">
                                                    <div className="flex-1">
                                                        <label className="text-xs text-gray-500 block">選択肢名</label>
                                                        <input
                                                            type="text"
                                                            value={opt.name}
                                                            onChange={(e) => {
                                                                const newOptions = [...(editingItem.options || [])];
                                                                newOptions[idx] = { ...opt, name: e.target.value };
                                                                setEditingItem({ ...editingItem, options: newOptions });
                                                            }}
                                                            className="w-full p-1 border rounded text-sm"
                                                        />
                                                    </div>
                                                    <div className="w-32">
                                                        <label className="text-xs text-gray-500 block">価格</label>
                                                        <input
                                                            type="number"
                                                            value={opt.price}
                                                            onChange={(e) => {
                                                                const newOptions = [...(editingItem.options || [])];
                                                                newOptions[idx] = { ...opt, price: parseInt(e.target.value) || 0 };
                                                                setEditingItem({ ...editingItem, options: newOptions });
                                                            }}
                                                            className="w-full p-1 border rounded text-sm"
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <button
                                                            onClick={() => {
                                                                const newOptions = editingItem.options!.filter((_, i) => i !== idx);
                                                                setEditingItem({ ...editingItem, options: newOptions });
                                                            }}
                                                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Allowed Plans for Option */}
                                                <div>
                                                    <label className="text-xs text-gray-500 block mb-1">対象プラン</label>
                                                    <div className="flex gap-2">
                                                        {['a', 'b', 'c', 'd'].map(pId => (
                                                            <label key={pId} className="flex items-center gap-1 text-xs cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(opt.allowedPlans || []).includes(pId)}
                                                                    onChange={(e) => {
                                                                        const currentPlans = opt.allowedPlans || [];
                                                                        const newPlans = e.target.checked
                                                                            ? [...currentPlans, pId]
                                                                            : currentPlans.filter(p => p !== pId);

                                                                        const newOptions = [...(editingItem.options || [])];
                                                                        newOptions[idx] = { ...opt, allowedPlans: newPlans as any[] };
                                                                        setEditingItem({ ...editingItem, options: newOptions });
                                                                    }}
                                                                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                                                                />
                                                                <span className="uppercase">{pId}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(editingItem.options || []).length === 0 && (
                                            <p className="text-xs text-gray-400 text-center py-2">選択肢がありません。追加してください。</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tier Price Editor */}
                            {editingItem.type === 'tier_dependent' && (
                                <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <h4 className="font-bold text-sm text-gray-700 mb-3">人数帯別価格設定</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['A', 'B', 'C', 'D'].map(tier => (
                                            <div key={tier}>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">ランク {tier}</label>
                                                <input
                                                    type="number"
                                                    value={editingItem.tierPrices?.[tier as 'A' | 'B' | 'C' | 'D'] || 0}
                                                    onChange={(e) => {
                                                        const newPrices = { ...(editingItem.tierPrices || { A: 0, B: 0, C: 0, D: 0 }) };
                                                        // @ts-ignore
                                                        newPrices[tier] = parseInt(e.target.value) || 0;
                                                        setEditingItem({ ...editingItem, tierPrices: newPrices });
                                                    }}
                                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">※各人数ランクに対応する単価を入力してください。</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setEditingItem(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                保存する
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="p-4 w-16">ID</th>
                            <th className="p-4">名前</th>
                            <th className="p-4 w-32">タイプ</th>
                            <th className="p-4 w-32 text-right">価格</th>
                            <th className="p-4 w-48">対象プラン</th>
                            <th className="p-4 w-24 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-4 font-mono text-sm text-gray-500">{item.id}</td>
                                <td className="p-4 font-bold text-gray-800">
                                    {item.name}
                                    <div className="text-xs font-normal text-gray-400 mt-0.5 truncate max-w-xs">
                                        {item.description}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded-full ${item.type === 'included' ? 'bg-blue-100 text-blue-700' :
                                        item.type === 'checkbox' ? 'bg-green-100 text-green-700' :
                                            item.type === 'dropdown' ? 'bg-purple-100 text-purple-700' :
                                                'bg-orange-100 text-orange-700'
                                        }`}>
                                        {item.type}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-mono text-sm">
                                    {item.basePrice ? `¥${item.basePrice.toLocaleString()}` : '-'}
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-1">
                                        {item.allowedPlans.map(p => (
                                            <span key={p} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 uppercase">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => startEdit(item)}
                                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ItemsManager;
