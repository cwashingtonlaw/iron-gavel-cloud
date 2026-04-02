import React, { useState } from 'react';
import { XMarkIcon, PaintBrushIcon } from './icons';

interface InvoiceCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceCustomizationModal: React.FC<InvoiceCustomizationModalProps> = ({ isOpen, onClose }) => {
  const [logoUrl, setLogoUrl] = useState('');
  const [footerText, setFooterText] = useState('Thank you for your business. Payment is due within 30 days.');

  if (!isOpen) {
    return null;
  }

  const handleSaveChanges = () => {
    // In a real app, this would save to a global state or backend
    console.log({ logoUrl, footerText });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl transform transition-all flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center">
            <PaintBrushIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold ml-3 text-slate-800">Invoice Customization</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Firm Logo URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Invoice Footer Text</label>
            <textarea
              rows={3}
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
          <button onClick={onClose} className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 text-sm">Cancel</button>
          <button onClick={handleSaveChanges} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 text-sm">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCustomizationModal;
