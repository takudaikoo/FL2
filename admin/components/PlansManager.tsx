import React, { useState, useEffect } from 'react';
import { supabase, Plan } from '../../lib/supabase';
import { Edit, Trash2, Plus, Save, X } from 'lucide-react';

const PlansManager: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .order('id');

            if (error) throw error;
            setPlans(data || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
            alert('プランの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingPlan) return;

        try {
            if (isNew) {
                const { error } = await supabase
                    .from('plans')
                    .insert([editingPlan]);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('plans')
                    .update(editingPlan)
                    .eq('id', editingPlan.id);
                if (error) throw error;
            }

            await fetchPlans();
            setEditingPlan(null);
            setIsNew(false);
        } catch (error: any) {
            console.error('Error saving plan:', error);
            alert(`保存に失敗しました: ${error.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('本当に削除しますか？この操作は取り消せません。')) return;

        try {
            const { error } = await supabase
                .from('plans')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchPlans();
        } catch (error) {
            console.error('Error deleting plan:', error);
            alert('削除に失敗しました');
        }
    };

    const startEdit = (plan: Plan) => {
        setEditingPlan({ ...plan });
        setIsNew(false);
    };

    const startNew = () => {
        setEditingPlan({
            id: '',
            name: '',
            price: 0,
            category: 'funeral',
            description: ''
        });
        setIsNew(true);
    };

    if (loading) return <div className="p-4">読み込み中...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-700">プラン一覧</h3>
                <button
                    onClick={startNew}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus size={18} />
                    新規プラン追加
                </button>
            </div>

            {editingPlan && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <h3 className="text-xl font-bold mb-4">
                            {isNew ? '新規プラン作成' : 'プラン編集'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                                <input
                                    type="text"
                                    value={editingPlan.id}
                                    onChange={e => setEditingPlan({ ...editingPlan, id: e.target.value })}
                                    disabled={!isNew}
                                    className="w-full p-2 border rounded bg-gray-50 disabled:text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">プラン名</label>
                                <input
                                    type="text"
                                    value={editingPlan.name}
                                    onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">価格 (税抜)</label>
                                <input
                                    type="number"
                                    value={editingPlan.price}
                                    onChange={e => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリー</label>
                                <select
                                    value={editingPlan.category}
                                    onChange={e => setEditingPlan({ ...editingPlan, category: e.target.value as 'funeral' | 'cremation' })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="funeral">葬儀プラン</option>
                                    <option value="cremation">火葬のみプラン</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                                <textarea
                                    value={editingPlan.description}
                                    onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none h-24"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setEditingPlan(null)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${plan.category === 'funeral' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                                }`}>
                                {plan.category === 'funeral' ? '葬儀プラン' : '火葬のみ'}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => startEdit(plan)}
                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <h4 className="text-lg font-bold text-gray-800 mb-1">{plan.name}</h4>
                        <p className="text-2xl font-bold text-emerald-600 mb-3">
                            ¥{plan.price.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-2">{plan.description}</p>
                        <div className="mt-3 text-xs text-gray-400">ID: {plan.id}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlansManager;
