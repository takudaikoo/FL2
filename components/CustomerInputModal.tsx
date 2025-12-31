import React, { useState } from 'react';
import { CustomerInfo } from '../types';
import { X, Save, Printer } from 'lucide-react';

interface CustomerInputModalProps {
    onClose: () => void;
    onSaveAndPrint: (info: CustomerInfo) => void;
    isSaving: boolean;
}

const CustomerInputModal: React.FC<CustomerInputModalProps> = ({ onClose, onSaveAndPrint, isSaving }) => {
    const [formData, setFormData] = useState<CustomerInfo>({
        deathDate: '',
        deceasedName: '',
        birthDate: '',
        age: '',
        address: '',
        honseki: '',
        applicantName: '',
        applicantRelation: '',
        applicantBirthDate: '',
        chiefMournerName: '',
        chiefMournerAddress: '',
        chiefMournerPhone: '',
        chiefMournerMobile: '',
        religion: '',
        templeName: '',
        templePhone: '',
        templeFax: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveAndPrint(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-2xl">📝</span>
                        顧客情報・見積書情報入力
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Deceased Info */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-emerald-700 mb-3 border-b pb-1 text-sm uppercase tracking-wider">故人様情報</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">死亡月日</label>
                                    <input
                                        type="date"
                                        name="deathDate"
                                        value={formData.deathDate}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">故人様氏名</label>
                                    <input
                                        type="text"
                                        name="deceasedName"
                                        value={formData.deceasedName}
                                        onChange={handleChange}
                                        placeholder="例: 佐藤 太郎"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">生年月日</label>
                                    <input
                                        type="date"
                                        name="birthDate"
                                        value={formData.birthDate}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">享年 (才)</label>
                                    <input
                                        type="text"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        placeholder="例: 85"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">現住所</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="例: 神奈川県茅ヶ崎市矢畑682-10"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">本籍</label>
                                    <input
                                        type="text"
                                        name="honseki"
                                        value={formData.honseki}
                                        onChange={handleChange}
                                        placeholder="例: 神奈川県茅ヶ崎市..."
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Applicant Info */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-emerald-700 mb-3 border-b pb-1 text-sm uppercase tracking-wider">申込者・喪主様情報</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">申込者氏名</label>
                                    <input
                                        type="text"
                                        name="applicantName"
                                        value={formData.applicantName}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">続柄</label>
                                    <input
                                        type="text"
                                        name="applicantRelation"
                                        value={formData.applicantRelation}
                                        onChange={handleChange}
                                        placeholder="例: 長男"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">生年月日</label>
                                    <input
                                        type="date"
                                        name="applicantBirthDate"
                                        value={formData.applicantBirthDate}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">喪主様氏名</label>
                                    <input
                                        type="text"
                                        name="chiefMournerName"
                                        value={formData.chiefMournerName}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">喪主様住所 (上記と異なる場合)</label>
                                    <input
                                        type="text"
                                        name="chiefMournerAddress"
                                        value={formData.chiefMournerAddress}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">電話番号</label>
                                    <input
                                        type="tel"
                                        name="chiefMournerPhone"
                                        value={formData.chiefMournerPhone}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">携帯番号</label>
                                    <input
                                        type="tel"
                                        name="chiefMournerMobile"
                                        value={formData.chiefMournerMobile}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Other Info */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-emerald-700 mb-3 border-b pb-1 text-sm uppercase tracking-wider">宗教・寺院情報</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">宗派</label>
                                    <input
                                        type="text"
                                        name="religion"
                                        value={formData.religion}
                                        onChange={handleChange}
                                        placeholder="例: 浄土真宗本願寺派"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">菩提寺名称</label>
                                    <input
                                        type="text"
                                        name="templeName"
                                        value={formData.templeName}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">菩提寺電話</label>
                                    <input
                                        type="tel"
                                        name="templePhone"
                                        value={formData.templePhone}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">菩提寺FAX</label>
                                    <input
                                        type="tel"
                                        name="templeFax"
                                        value={formData.templeFax}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold transition-all"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>保存中...</>
                        ) : (
                            <>
                                <Printer size={20} />
                                保存して印刷プレビューへ
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerInputModal;
