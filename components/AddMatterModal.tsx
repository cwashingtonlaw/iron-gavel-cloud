import React, { useState } from 'react';
import { Matter, Contact, Task } from '../types';
import { useStore } from '../store/useStore';
import { MOCK_PIPELINES, MOCK_USERS } from '../constants';
import { XMarkIcon, UserPlusIcon } from './icons';
import AddContactModal from './AddContactModal';
import { v4 as uuidv4 } from 'uuid';
import ConflictAlert from './ConflictAlert';

interface AddMatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMatter: (matter: Matter) => void;
}

const AddMatterModal: React.FC<AddMatterModalProps> = ({ isOpen, onClose, onAddMatter }) => {
  const { contacts, addContact, pipelines, matterTemplates, taskChains, addTask } = useStore();
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [practiceArea, setPracticeArea] = useState('Litigation');
  const [status, setStatus] = useState<'Open' | 'Closed' | 'Pending'>('Open');
  const [responsibleAttorneyId, setResponsibleAttorneyId] = useState('');
  const [openDate, setOpenDate] = useState(new Date().toISOString().split('T')[0]);
  const [billingType, setBillingType] = useState<Matter['billing']['type']>('Hourly');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTaskChainIds, setSelectedTaskChainIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientName || !practiceArea) {
      setError('Description, Client, and Practice Area are required.');
      return;
    }

    const pipeline = MOCK_PIPELINES.find(p => p.practiceArea === practiceArea);
    const firstStageId = pipeline?.stages[0]?.id;

    const newMatter: Matter = {
      id: `MAT-${Date.now()}`,
      name: name,
      client: clientName,
      status: 'Open',
      openDate: openDate,
      notes: notes,
      practiceArea: practiceArea,
      responsibleAttorneyId: responsibleAttorneyId,
      stageId: firstStageId,
      lastStageChangeDate: new Date().toISOString(),
      billing: {
        type: billingType,
        rate: rate ? parseFloat(rate) : undefined,
      },
      allowedUserIds: responsibleAttorneyId ? [responsibleAttorneyId] : [],
    };

    onAddMatter(newMatter);

    // Apply Task Chains
    const allChainIds = new Set(selectedTaskChainIds);
    if (selectedTemplateId) {
      const template = matterTemplates.find(t => t.id === selectedTemplateId);
      if (template) template.taskChainIds.forEach(id => allChainIds.add(id));
    }

    allChainIds.forEach(chainId => {
      const chain = taskChains.find(c => c.id === chainId);
      if (chain) {
        chain.items.forEach(item => {
          const dueDate = new Date(openDate);
          dueDate.setDate(dueDate.getDate() + item.dueInDays);

          const newTask: Task = {
            id: uuidv4(),
            description: item.description,
            notes: item.notes,
            dueDate: dueDate.toISOString().split('T')[0],
            completed: false,
            priority: item.priority,
            matterId: newMatter.id,
            assignedUserId: responsibleAttorneyId || undefined,
          };
          addTask(newTask);
        });
      }
    });

    onClose();

    // Reset form
    setName('');
    setClientName('');
    setPracticeArea('Litigation');
    setResponsibleAttorneyId('');
    setNotes('');
    setBillingType('Hourly');
    setRate('');
    setSelectedTemplateId('');
    setError('');
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = matterTemplates.find(t => t.id === templateId);
    if (template) {
      if (template.defaultPracticeArea) setPracticeArea(template.defaultPracticeArea);
      if (template.defaultBillingType) setBillingType(template.defaultBillingType);
      if (template.defaultBillingRate) setRate(template.defaultBillingRate.toString());
      // Could also pre-fill description pattern if desired
    }
  };

  const handleAddNewClient = (newContact: Contact) => {
    addContact(newContact);
    setClientName(newContact.name);
    setIsAddClientModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all flex flex-col max-h-[90vh]">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">New Matter</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <ConflictAlert name={name} />
              <ConflictAlert name={clientName} />

              {matterTemplates.length > 0 && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
                  <label className="block text-sm font-medium text-indigo-900 mb-1">Apply Template (Optional)</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full p-2 border border-indigo-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">None - Start from scratch</option>
                    {matterTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-indigo-700 mt-1">
                    Selecting a template will pre-fill fields and create default tasks.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Matter Description <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Estate Planning for John Doe"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client <span className="text-red-500">*</span></label>
                  {contacts.length > 0 ? (
                    <select
                      value={clientName}
                      onChange={(e) => {
                        if (e.target.value === 'NEW_CLIENT') {
                          setIsAddClientModalOpen(true);
                        } else {
                          setClientName(e.target.value);
                        }
                      }}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a client...</option>
                      {contacts.filter(c => c.type === 'Client' || c.type === 'Potential Client').map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                      <option value="NEW_CLIENT" className="font-bold text-blue-600">+ Add New Client</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Client Name"
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Practice Area <span className="text-red-500">*</span></label>
                  <select
                    value={practiceArea}
                    onChange={(e) => setPracticeArea(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select practice area...</option>
                    {pipelines.map(p => (
                      <option key={p.id} value={p.practiceArea}>{p.practiceArea}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Responsible Attorney</label>
                  <select
                    value={responsibleAttorneyId}
                    onChange={(e) => setResponsibleAttorneyId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select attorney...</option>
                    {MOCK_USERS.filter(u => u.role !== 'Paralegal').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Open Date</label>
                  <input
                    type="date"
                    value={openDate}
                    onChange={(e) => setOpenDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Billing Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Billing Type</label>
                    <select
                      value={billingType}
                      onChange={(e) => setBillingType(e.target.value as any)}
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                    >
                      <option value="Hourly">Hourly</option>
                      <option value="Flat Fee">Flat Fee</option>
                      <option value="Contingency">Contingency</option>
                    </select>
                  </div>
                  {billingType === 'Hourly' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Hourly Rate ($)</label>
                      <input
                        type="number"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2 border border-slate-300 rounded text-sm"
                      />
                    </div>
                  )}
                  {billingType === 'Flat Fee' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Fee Amount ($)</label>
                      <input
                        type="number"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-2 border border-slate-300 rounded text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Automated Task Chains</label>
                <div className="space-y-2">
                  {taskChains.map(chain => (
                    <label key={chain.id} className="flex items-center gap-2 p-2 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedTaskChainIds.includes(chain.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTaskChainIds([...selectedTaskChainIds, chain.id]);
                          else setSelectedTaskChainIds(selectedTaskChainIds.filter(id => id !== chain.id));
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{chain.name}</p>
                        <p className="text-xs text-slate-500">{chain.items.length} automated steps</p>
                      </div>
                    </label>
                  ))}
                  {taskChains.length === 0 && <p className="text-xs text-slate-500 italic">No task chains available. Configure them in Settings.</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Initial case notes..."
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={onClose}
                className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                Save Matter
              </button>
            </div>
          </form>
        </div>
      </div>

      <AddContactModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onAddContact={handleAddNewClient}
      />
    </>
  );
};

export default AddMatterModal;
