import React from 'react';
import { createPortal } from 'react-dom';
import { Item } from '../types';
import { X } from 'lucide-react';

interface DetailModalProps {
  item: Item | null;
  selectedGrade?: string;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ item, selectedGrade, onClose }) => {
  const [imageError, setImageError] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState<string>('');

  // Reset state when item or grade changes
  React.useEffect(() => {
    if (!item) return;
    setImageError(false);

    // Try specific image first if grade is selected, otherwise generic
    if (selectedGrade) {
      setCurrentSrc(`/images/${item.id}_${selectedGrade}.jpg`);
    } else {
      setCurrentSrc(`/images/${item.id}.jpg`);
    }
  }, [item, selectedGrade]);

  const handleImageError = () => {
    // If we were trying a specific image, fallback to generic
    if (currentSrc.includes('_')) {
      if (item) setCurrentSrc(`/images/${item.id}.jpg`);
    } else {
      // If we failed on generic (or already were on generic), show gradient
      setImageError(true);
    }
  };

  if (!item) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity no-print"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]"
        style={{ maxWidth: '400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-shrink-0">
          {/* Header / Main Image Area */}
          <div className="relative aspect-4-3 flex items-center justify-center text-white bg-gray-100">
            {!imageError ? (
              <img
                src={currentSrc}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center flex-col"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)'
                }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-2">🌿</div>
                  <div className="text-sm opacity-90">{item.name}</div>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white transition-colors z-10 shadow-sm"
            >
              <X size={24} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{item.name}</h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
            {item.description}
          </p>

          {/* Extended Details */}
          {item.details && item.details.length > 0 && (
            <div className="mt-6 space-y-6 border-t border-gray-100 pt-6">
              {item.details.map((detail, idx) => (
                <div key={idx} className="space-y-3">
                  {detail.title && (
                    <h4 className="font-bold text-gray-700 border-l-4 border-emerald-500 pl-2">
                      {detail.title}
                    </h4>
                  )}
                  {detail.imagePath && (
                    <img
                      src={detail.imagePath}
                      alt={detail.title || 'Detail image'}
                      className="w-full rounded-lg object-cover shadow-sm bg-gray-50 min-h-[150px]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {detail.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex justify-end flex-shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors w-full md:w-auto"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DetailModal;