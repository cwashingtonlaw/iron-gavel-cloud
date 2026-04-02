import React, { useState } from 'react';
import { PotentialClient } from '../types';
import { XMarkIcon } from './icons';

interface AddNewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (newLead: PotentialClient) => void;
}

const AddNewLeadModal: React.FC<AddNewLeadModalProps> = ({ isOpen, onClose, onAddLead }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is a required field.');
      return;
    }
    
    const newLead: PotentialClient = {
      id: `PC${Date.now()}`, // Simple unique ID generation
      name,
      email,
      phone,
      status: 'New Lead',
      source,
      notes,
    };

    onAddLead(newLead);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Add New Lead</h2>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label htmlFor="lead-name" className="text-sm font-medium text-slate-700 mb-1 block">Full Name <span className="text-red-500">*</span></label>
              <input id="lead-name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-email" className="text-sm font-medium text-slate-700 mb-1 block">Email Address</label>
                  <input id="lead-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label htmlFor="lead-phone" className="text-sm font-medium text-slate-700 mb-1 block">Phone Number</label>
                  <input id="lead-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>
             <div>
              <label htmlFor="lead-source" className="text-sm font-medium text-slate-700 mb-1 block">Lead Source</label>
              <input id="lead-source" type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Referral, Website" className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="lead-notes" className="text-sm font-medium text-slate-700 mb-1 block">Notes</label>
              <textarea id="lead-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Initial inquiry details..."></textarea>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">Save Lead</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewLeadModal;
