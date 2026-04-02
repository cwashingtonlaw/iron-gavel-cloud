import React, { useState } from 'react';
import { Document } from '../types';
import { XMarkIcon, PencilSquareIcon } from './icons';
import { useStore } from '../store/useStore';

interface SignDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

const SignDocumentModal: React.FC<SignDocumentModalProps> = ({ isOpen, onClose, document }) => {
  const { updateDocument } = useStore();
  const [signature, setSignature] = useState('');

  if (!isOpen) return null;

  const handleSign = () => {
    if (!signature.trim()) {
      alert("Please type your name to sign.");
      return;
    }
    const updatedDoc: Document = {
      ...document,
      esignStatus: 'Signed',
      esignCompletedDate: new Date().toISOString().split('T')[0]
    };
    updateDocument(updatedDoc);
    alert(`Document "${document.name}" has been signed successfully!`);
    onClose();
  };

  const handleDecline = () => {
    const updatedDoc: Document = {
      ...document,
      esignStatus: 'Declined'
    };
    updateDocument(updatedDoc);
    alert(`You have declined to sign "${document.name}".`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl transform transition-all flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Review & Sign: {document.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto max-h-[70vh]">
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 h-96">
            <p className="text-slate-600">Document preview: This legal agreement is between the Firm and the Client regarding matter {document.matterId}.</p>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700 mb-1 block">Your Signature</label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg text-lg font-serif italic"
              placeholder="Type your full name to sign"
            />
            <p className="text-xs text-slate-500 mt-1">
              By signing, you agree to the terms outlined in this document.
            </p>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
          <button onClick={handleDecline} className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 text-sm">Decline</button>
          <button onClick={handleSign} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 text-sm">Sign & Submit</button>
        </div>
      </div>
    </div>
  );
};

export default SignDocumentModal;
