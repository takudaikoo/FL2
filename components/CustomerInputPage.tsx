import React, { useState } from 'react';
import { CustomerInfo } from '../types';
import { ArrowLeft, Printer, Save } from 'lucide-react';

interface CustomerInputPageProps {
    onBack: () => void;
    onSaveAndPrint: (info: CustomerInfo) => void;
    isSaving: boolean;
    initialData?: CustomerInfo | null;
}

const CustomerInputPage: React.FC<CustomerInputPageProps> = ({ onBack, onSaveAndPrint, isSaving, initialData }) => {
    const [formData, setFormData] = useState<CustomerInfo>(initialData || {
        deathDate: '',
        deceasedName: '',
        birthDate: '',
        age: '',
        address: '',
        honseki: '',
        applicantName: '',
        applicantRelation: '',
        applicantBirthDate: '',
        applicantPostalCode: '',
        applicantAddress: '',
        chiefMournerName: '',
        chiefMournerAddress: '',
        chiefMournerPhone: '',
        chiefMournerMobile: '',
        religion: '',
        templeName: '',
        templePhone: '',

        templeFax: '',
        remarks: '',
    });



    const [postalCodeInput, setPostalCodeInput] = useState('');
    const [applicantPostalCodeInput, setApplicantPostalCodeInput] = useState('');

    const calculateAge = (birthDate: string): string => {
        if (!birthDate) return '';
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age.toString();
    };

    const fetchAddress = async (zip: string) => {
        try {
            const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
            const data = await response.json();
            if (data.results && data.results[0]) {
                const res = data.results[0];
                const address = `${res.address1}${res.address2}${res.address3}`;
                // Format: 〒000-0000 Address
                const formattedZip = `〒${zip.slice(0, 3)}-${zip.slice(3)}`;
                const fullAddress = `${formattedZip} ${address}`;

                setFormData(prev => ({ ...prev, address: fullAddress }));
            }
        } catch (error) {
            console.error('Failed to fetch address:', error);
        }
    };

    const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/-/g, '');
        setPostalCodeInput(val);
        if (val.length === 7) {
            fetchAddress(val);
        }
    };

    const fetchApplicantAddress = async (zip: string) => {
        try {
            const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
            const data = await response.json();
            if (data.results && data.results[0]) {
                const res = data.results[0];
                const address = `${res.address1}${res.address2}${res.address3}`;
                // Format: 〒000-0000 Address
                const formattedZip = `〒${zip.slice(0, 3)}-${zip.slice(3)}`;
                const fullAddress = `${formattedZip} ${address}`;

                setFormData(prev => ({ ...prev, applicantAddress: fullAddress }));
            }
        } catch (error) {
            console.error('Failed to fetch address:', error);
        }
    };

    const handleApplicantPostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/-/g, '');
        setApplicantPostalCodeInput(val);
        setFormData(prev => ({ ...prev, applicantPostalCode: val }));
        if (val.length === 7) {
            fetchApplicantAddress(val);
        }
    };

    React.useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            // Try to extract postal code from address if present
            const match = initialData.address.match(/〒(\d{3}-\d{4})/);
            if (match) {
                setPostalCodeInput(match[1].replace('-', ''));
            }
            if (initialData.applicantPostalCode) {
                setApplicantPostalCodeInput(initialData.applicantPostalCode);
            } else if (initialData.applicantAddress) {
                const matchApp = initialData.applicantAddress.match(/〒(\d{3}-\d{4})/);
                if (matchApp) setApplicantPostalCodeInput(matchApp[1].replace('-', ''));
            }
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-calculate age
            if (name === 'birthDate') {
                const age = calculateAge(value);
                newData.age = age;
            } else if (name === 'applicantBirthDate') {
                const age = calculateAge(value);
                newData.applicantAge = age;
            }

            return newData;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveAndPrint(formData);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-30 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-emerald-700 transition-colors font-bold"
                    >
                        <ArrowLeft size={20} />
                        <span>見積り選択へ戻る</span>
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">顧客情報・見積書情報入力</h1>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
                <form id="customer-form" onSubmit={handleSubmit} className="space-y-8">

                    {/* Deceased Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-6 border-b pb-2">
                            <span className="text-2xl">🕊️</span>
                            <h3 className="font-bold text-lg text-gray-800">故人様について</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">死亡月日</label>
                                <input
                                    type="date"
                                    name="deathDate"
                                    value={formData.deathDate}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">故人様氏名</label>
                                <input
                                    type="text"
                                    name="deceasedName"
                                    value={formData.deceasedName}
                                    onChange={handleChange}
                                    placeholder="例: 佐藤 太郎"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">生年月日</label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">享年 (才)</label>
                                <input
                                    type="text"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    placeholder="自動計算"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">郵便番号</label>
                                    <input
                                        type="text"
                                        value={postalCodeInput}
                                        onChange={handlePostalCodeChange}
                                        placeholder="例: 2530085 (ハイフンなし)"
                                        maxLength={7}
                                        className="w-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">現住所</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="自動入力または手動入力"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">本籍</label>
                                <input
                                    type="text"
                                    name="honseki"
                                    value={formData.honseki}
                                    onChange={handleChange}
                                    placeholder="例: 神奈川県茅ヶ崎市..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Applicant Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-6 border-b pb-2">
                            <span className="text-2xl">📋</span>
                            <h3 className="font-bold text-lg text-gray-800">申込者・喪主様について</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">申込者氏名</label>
                                <input
                                    type="text"
                                    name="applicantName"
                                    value={formData.applicantName}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">続柄</label>
                                <input
                                    type="text"
                                    name="applicantRelation"
                                    value={formData.applicantRelation}
                                    onChange={handleChange}
                                    placeholder="例: 長男"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">生年月日</label>
                                <input
                                    type="date"
                                    name="applicantBirthDate"
                                    value={formData.applicantBirthDate}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">年齢 (才)</label>
                                <input
                                    type="text"
                                    name="applicantAge"
                                    value={formData.applicantAge || ''}
                                    onChange={handleChange}
                                    placeholder="自動計算"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div className="md:col-span-3 space-y-4 border-t border-gray-100 pt-4 mt-2 mb-2">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">申込者郵便番号</label>
                                        <input
                                            type="text"
                                            value={applicantPostalCodeInput}
                                            onChange={handleApplicantPostalCodeChange}
                                            placeholder="例: 2530085"
                                            maxLength={7}
                                            className="w-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">申込者住所</label>
                                        <input
                                            type="text"
                                            name="applicantAddress"
                                            value={formData.applicantAddress || ''}
                                            onChange={handleChange}
                                            placeholder="自動入力または手動入力"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">喪主様氏名</label>
                                <input
                                    type="text"
                                    name="chiefMournerName"
                                    value={formData.chiefMournerName}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">喪主様住所 (上記と異なる場合)</label>
                                <input
                                    type="text"
                                    name="chiefMournerAddress"
                                    value={formData.chiefMournerAddress}
                                    onChange={handleChange}
                                    placeholder="申込み者と同じ場合は空欄で構いません"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">電話番号</label>
                                <input
                                    type="tel"
                                    name="chiefMournerPhone"
                                    value={formData.chiefMournerPhone}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">携帯番号</label>
                                <input
                                    type="tel"
                                    name="chiefMournerMobile"
                                    value={formData.chiefMournerMobile}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Other Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-6 border-b pb-2">
                            <span className="text-2xl">🙏</span>
                            <h3 className="font-bold text-lg text-gray-800">宗教・寺院について</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">宗派</label>
                                <input
                                    type="text"
                                    name="religion"
                                    value={formData.religion}
                                    onChange={handleChange}
                                    placeholder="例: 浄土真宗本願寺派"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">菩提寺名称</label>
                                <input
                                    type="text"
                                    name="templeName"
                                    value={formData.templeName}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">菩提寺電話</label>
                                <input
                                    type="tel"
                                    name="templePhone"
                                    value={formData.templePhone}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">菩提寺FAX</label>
                                <input
                                    type="tel"
                                    name="templeFax"
                                    value={formData.templeFax}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all"
                                />
                            </div>
                        </div>
                    </div>


                    {/* Remarks */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-6 border-b pb-2">
                            <span className="text-2xl">📝</span>
                            <h3 className="font-bold text-lg text-gray-800">備考</h3>
                        </div>
                        <div>
                            <textarea
                                name="remarks"
                                value={formData.remarks || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                placeholder="備考事項があればご記入ください"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 transition-all min-h-[100px]"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-8 py-3 rounded-full border-2 border-gray-300 text-gray-600 hover:bg-gray-100 font-bold transition-all"
                        >
                            戻る
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-10 py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-3 transform hover:-translate-y-1"
                        >
                            {isSaving ? (
                                <>保存中...</>
                            ) : (
                                <>
                                    <Printer size={24} />
                                    <span>保存して印刷プレビューへ</span>
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </main>
        </div >
    );
};

export default CustomerInputPage;
