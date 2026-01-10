import React, { useEffect, useState } from 'react';
import QuoteDocument from './QuoteDocument';
import InvoiceDocument from './InvoiceDocument';
import { deserializePrintData } from '../lib/serialization';
import { Plan, Item, AttendeeTier } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const PrintPreview: React.FC = () => {
    const [data, setData] = useState<{
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
        logoType?: 'FL' | 'LS';
        documentType?: 'quote' | 'invoice';
    } | null>(null);

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const isMobile = new URLSearchParams(window.location.search).get('mobile') === 'true';

    useEffect(() => {
        const stored = localStorage.getItem('print_data');
        if (stored) {
            const parsed = deserializePrintData(stored);
            if (parsed) {
                setData(parsed);
                // Auto-print removed per user request
            }
        }
    }, []);

    const handleDownloadPDF = async () => {
        const input = document.getElementById('print-content');
        if (!input) return;

        try {
            setIsGeneratingPdf(true);
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 1200 // Ensure desktop-like rendering for canvas
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            const fileName = `${data?.documentType === 'invoice' ? '請求書' : '御見積書'}_${data?.estimateId || 'draft'}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('PDFの作成に失敗しました。');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-gray-500">読み込み中、またはデータが見つかりません...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-500 flex flex-col items-center py-8 print:bg-white print:py-0 print:block">

            {/* Mobile Overlay */}
            {isMobile && (
                <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm text-center space-y-6">
                        <div className="flex justify-center mb-4">
                            <span className="text-4xl">📄</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {data.documentType === 'invoice' ? '請求書' : '見積書'}出力
                        </h2>
                        <p className="text-gray-500 text-sm">
                            下のボタンを押してPDFを保存してください
                        </p>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPdf}
                            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isGeneratingPdf ? (
                                <><span>作成中...</span></>
                            ) : (
                                <><span>📥 PDFを保存</span></>
                            )}
                        </button>
                        <button
                            onClick={() => window.close()}
                            className="text-gray-400 text-sm underline hover:text-gray-600"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Control Bar */}
            {!isMobile && (
                <>
                    <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur shadow-md p-4 flex justify-between items-center print:hidden z-50">
                        <h1 className="font-bold text-gray-700">印刷プレビュー ({data.documentType === 'invoice' ? '請求書' : '見積書'})</h1>
                        <div className="flex gap-4">
                            <button
                                onClick={() => window.close()}
                                className="px-6 py-3 rounded border border-gray-300 hover:bg-gray-100 transition-colors text-lg whitespace-nowrap"
                            >
                                閉じる
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={isGeneratingPdf}
                                className="px-6 py-3 rounded bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-sm transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg whitespace-nowrap"
                            >
                                {isGeneratingPdf ? '作成中...' : 'PDFダウンロード'}
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-8 py-3 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-sm transition-transform active:scale-95 text-lg whitespace-nowrap"
                            >
                                印刷する
                            </button>
                        </div>
                    </div>
                    <div className="h-16 print:hidden"></div>
                </>
            )}

            {/* A4 Container */}
            {/* A4 Content Container */}
            <div className={`w-full ${!isMobile ? 'overflow-x-auto pb-8 px-4 md:px-0 scrollbar-hide flex justify-center' : 'fixed top-0 left-0 -z-10'}`}>
                <div id="print-content" className="bg-white shadow-2xl print:shadow-none mx-auto print:mx-0 print:w-full min-w-[210mm]">
                    {data.documentType === 'invoice' ? (
                        <InvoiceDocument
                            plan={data.plan}
                            items={data.items}
                            selectedOptions={data.selectedOptions}
                            selectedGrades={data.selectedGrades}
                            attendeeTier={data.attendeeTier}
                            customAttendeeCount={data.customAttendeeCount}
                            freeInputValues={data.freeInputValues}
                            totalCost={data.totalCost}
                            attendeeLabel={data.attendeeLabel}
                            customerInfo={data.customerInfo}
                            estimateId={data.estimateId}
                            logoType={data.logoType || 'FL'}
                        />
                    ) : (
                        <QuoteDocument
                            plan={data.plan}
                            items={data.items}
                            selectedOptions={data.selectedOptions}
                            selectedGrades={data.selectedGrades}
                            attendeeTier={data.attendeeTier}
                            customAttendeeCount={data.customAttendeeCount}
                            freeInputValues={data.freeInputValues}
                            totalCost={data.totalCost}
                            attendeeLabel={data.attendeeLabel}
                            customerInfo={data.customerInfo}
                            estimateId={data.estimateId}
                            logoType={data.logoType || 'FL'}
                        />
                    )}
                </div>
            </div>

            <style>{`
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
        </div>
    );
};

export default PrintPreview;
