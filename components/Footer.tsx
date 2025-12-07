import React from 'react';
import { Printer } from 'lucide-react';

interface FooterProps {
  total: number;
}

const Footer: React.FC<FooterProps> = ({ total }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] py-5 px-8 z-40 print:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-gray-800 flex items-baseline">
          <span className="text-2xl font-bold mr-4">お見積り概算額 (税抜)</span>
          <span className="font-extrabold text-emerald-700 tracking-tight leading-none" style={{ fontSize: '5rem' }}>¥{total.toLocaleString()}</span>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-bold text-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0"
        >
          <Printer size={28} />
          <span>印刷する</span>
        </button>
      </div>
    </footer>
  );
};

export default Footer;