import React, { useState } from 'react';
import { FileSearch, PlusCircle, ArrowRight, Loader2 } from 'lucide-react';

interface StartScreenProps {
    onLoad: (id: string) => Promise<void>;
    onCreateNew: () => void;
    logoType: 'FL' | 'LS';
    onToggleLogo: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onLoad, onCreateNew, logoType, onToggleLogo }) => {
    const [loadId, setLoadId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLoadClick = async () => {
        if (!loadId.trim()) return;
        setIsLoading(true);
        try {
            await onLoad(loadId);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                {/* Header / Logo Section */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 flex flex-col items-center justify-center border-b border-gray-100 relative">
                    <div
                        className="absolute top-4 right-4 text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                        onClick={onToggleLogo}
                    >
                        {logoType}
                    </div>
                    <img
                        src={`/images/logo${logoType}.png`}
                        alt="Logo"
                        className="h-12 w-auto object-contain mb-4 animate-fade-in"
                    />
                    <h1 className="text-xl font-bold text-emerald-800 tracking-wide">
                        葬儀プラン・見積り作成
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        簡単操作で素早くお見積りを作成・印刷
                    </p>
                </div>

                <div className="p-8 space-y-8">

                    {/* Import Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-700 font-bold text-lg">
                            <FileSearch className="text-emerald-500" />
                            <span>続きから作成 (読込)</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            以前作成した見積番号を入力してください
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                pattern="\d*"
                                value={loadId}
                                onChange={(e) => setLoadId(e.target.value)}
                                placeholder="見積番号 (例: 1024)"
                                className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg font-mono bg-gray-50"
                                onKeyDown={(e) => e.key === 'Enter' && handleLoadClick()}
                            />
                            <button
                                onClick={handleLoadClick}
                                disabled={isLoading || !loadId}
                                className="bg-emerald-600 text-white px-6 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                            </button>
                        </div>
                    </div>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">または</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    {/* Create New Section */}
                    <div>
                        <button
                            onClick={onCreateNew}
                            className="w-full bg-white border-2 border-dashed border-gray-300 text-gray-600 p-4 rounded-xl font-bold hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 group"
                        >
                            <PlusCircle className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                            <span>新規作成する</span>
                        </button>
                    </div>

                </div>

                <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
                    © First Leaf 葬儀見積システム
                </div>

            </div>
        </div>
    );
};

export default StartScreen;
