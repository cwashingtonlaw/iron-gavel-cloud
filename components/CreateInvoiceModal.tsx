
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Invoice } from '../types';
import { XMarkIcon } from './icons';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ isOpen, onClose }) => {
  const matters = useStore(s => s.matters);
  const timeEntries = useStore(s => s.timeEntries);
  const expenses = useStore(s => s.expenses);
  const addInvoice = useStore(s => s.addInvoice);
  const addToast = useStore(s => s.addToast);

  const [selectedMatterId, setSelectedMatterId] = useState('');
  const [checkedTimeIds, setCheckedTimeIds] = useState<Set<string>>(new Set());
  const [checkedExpenseIds, setCheckedExpenseIds] = useState<Set<string>>(new Set());

  const unbilledTime = useMemo(() => {
    if (!selectedMatterId) return [];
    return timeEntries.filter(t => t.matterId === selectedMatterId && !t.isBilled);
  }, [timeEntries, selectedMatterId]);

  const unbilledExpenses = useMemo(() => {
    if (!selectedMatterId) return [];
    return expenses.filter(e => e.matterId === selectedMatterId && !e.isBilled);
  }, [expenses, selectedMatterId]);

  // Auto-select all when matter changes
  const handleMatterChange = (matterId: string) => {
    setSelectedMatterId(matterId);
    const newTimeIds = new Set(timeEntries.filter(t => t.matterId === matterId && !t.isBilled).map(t => t.id));
    const newExpIds = new Set(expenses.filter(e => e.matterId === matterId && !e.isBilled).map(e => e.id));
    setCheckedTimeIds(newTimeIds);
    setCheckedExpenseIds(newExpIds);
  };

  const toggleTime = (id: string) => {
    setCheckedTimeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleExpense = (id: string) => {
    setCheckedExpenseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const total = useMemo(() => {
    const timeTotal = unbilledTime.filter(t => checkedTimeIds.has(t.id)).reduce((s, t) => s + t.duration * t.rate, 0);
    const expTotal = unbilledExpenses.filter(e => checkedExpenseIds.has(e.id)).reduce((s, e) => s + e.amount, 0);
    return timeTotal + expTotal;
  }, [unbilledTime, unbilledExpenses, checkedTimeIds, checkedExpenseIds]);

  const handleGenerate = () => {
    if (!selectedMatterId) return;
    if (total <= 0) {
      addToast('No billable items selected.', 'error');
      return;
    }
    const inv: Invoice = {
      id: `INV-${Date.now()}`,
      matterId: selectedMatterId,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: total,
      status: 'Unpaid',
      balance: total,
      clientName: matters.find(m => m.id === selectedMatterId)?.client,
    };
    addInvoice(inv);
    addToast(`Invoice ${inv.id} created for $${total.toFixed(2)}.`, 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Create New Invoice</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Select Matter</label>
            <select
              value={selectedMatterId}
              onChange={e => handleMatterChange(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            >
              <option value="">Select a matter to invoice...</option>
              {matters.filter(m => m.status === 'Open').map(m => (
                <option key={m.id} value={m.id}>{m.name} - {m.client}</option>
              ))}
            </select>
          </div>

          {selectedMatterId && (
            <>
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Unbilled Time Entries</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-600 rounded-lg">
                  {unbilledTime.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">No unbilled time entries for this matter.</p>
                  )}
                  {unbilledTime.map(entry => (
                    <div key={entry.id} className="flex items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                      <input
                        type="checkbox"
                        className="h-4 w-4 mr-3 rounded border-slate-300"
                        checked={checkedTimeIds.has(entry.id)}
                        onChange={() => toggleTime(entry.id)}
                      />
                      <div className="flex-1 text-sm text-slate-800 dark:text-white">{entry.description}</div>
                      <div className="text-sm font-medium text-slate-800 dark:text-white">${(entry.duration * entry.rate).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Unbilled Expenses</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-slate-200 dark:border-slate-600 rounded-lg">
                  {unbilledExpenses.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">No unbilled expenses for this matter.</p>
                  )}
                  {unbilledExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                      <input
                        type="checkbox"
                        className="h-4 w-4 mr-3 rounded border-slate-300"
                        checked={checkedExpenseIds.has(expense.id)}
                        onChange={() => toggleExpense(expense.id)}
                      />
                      <div className="flex-1 text-sm text-slate-800 dark:text-white">{expense.description}</div>
                      <div className="text-sm font-medium text-slate-800 dark:text-white">${expense.amount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Invoice Total:</span>
                <span className="text-lg font-bold text-slate-800 dark:text-white">${total.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-xl">
          <button onClick={onClose} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-600 text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!selectedMatterId || total <= 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;
