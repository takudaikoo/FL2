import React from 'react';
import { Printer, Download } from 'lucide-react';

interface FooterProps {
  total: number;
  onInputClick: () => void;
  onOutputClick: () => void;
  onInvoiceClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ total, onInputClick, onOutputClick, onInvoiceClick }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] py-3 px-4 md:py-5 md:px-8 z-40 print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
        <div className="text-gray-800 flex items-center justify-between w-full md:w-auto md:justify-start">
          <span className="text-sm md:text-3xl font-bold mr-2 md:mr-4">概算額(税抜)</span>
          <span className="font-extrabold text-emerald-700 tracking-tight leading-none text-3xl md:text-6xl">¥{total.toLocaleString()}</span>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Customer Input Button */}
          <button
            onClick={onInputClick}
            className="flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-3 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-2 py-2 md:px-6 md:py-4 rounded-lg md:rounded-full font-bold text-xs md:text-xl shadow-sm md:shadow-md transition-all"
          >
            <span className="md:hidden">📝 入力</span>
            <span className="hidden md:inline">📝 顧客情報入力</span>
          </button>

          {/* Direct Output Button */}
          <button
            onClick={onOutputClick}
            className="flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-2 md:px-8 md:py-4 rounded-lg md:rounded-full font-bold text-xs md:text-xl shadow-md hover:shadow-xl transition-all"
          >
            <Printer size={16} className="md:hidden" />
            <Printer size={28} className="hidden md:block" />
            <span className="md:hidden">見積</span>
            <span className="hidden md:inline">見積書出力</span>
          </button>

          {/* Invoice Output Button */}
          <button
            onClick={onInvoiceClick}
            className="flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-2 md:px-8 md:py-4 rounded-lg md:rounded-full font-bold text-xs md:text-xl shadow-md hover:shadow-xl transition-all"
          >
            <Printer size={16} className="md:hidden" />
            <Printer size={28} className="hidden md:block" />
            <span className="md:hidden">請求</span>
            <span className="hidden md:inline">請求書出力</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;