import React, { useState } from 'react';
import { Document, Contact } from '../types';
import { XMarkIcon, PencilSquareIcon } from './icons';
import { useStore } from '../store/useStore';

interface RequestSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  contacts: Contact[];
}

const RequestSignatureModal: React.FC<RequestSignatureModalProps> = ({ isOpen, onClose, document, contacts }) => {
  const { updateDocument } = useStore();
  const [selectedSignerId, setSelectedSignerId] = useState(contacts.find(c => c.type === 'Client')?.id || '');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSendRequest = () => {
    const signer = contacts.find(c => c.id === selectedSignerId);
    const updatedDoc: Document = {
      ...document,
      esignStatus: 'Sent',
      esignRequestedDate: new Date().toISOString().split('T')[0],
      esignRecipient: signer?.name || 'Client'
    };
    updateDocument(updatedDoc);
    alert(`E-signature request sent to ${signer?.name || 'client'}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center">
            <PencilSquareIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold ml-3 text-slate-800">Request E-Signature</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Requesting signature for: <span className="font-semibold text-slate-800">{document.name}</span>
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Select Signer</label>
            <select
              value={selectedSignerId}
              onChange={(e) => setSelectedSignerId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
            >
              {contacts.filter(c => c.type === 'Client').map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Message (Optional)</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              placeholder={`Please review and sign the attached document: ${document.name}.`}
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
          <button onClick={onClose} className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 text-sm">Cancel</button>
          <button onClick={handleSendRequest} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 text-sm">Send Request</button>
        </div>
      </div>
    </div>
  );
};

export default RequestSignatureModal;
