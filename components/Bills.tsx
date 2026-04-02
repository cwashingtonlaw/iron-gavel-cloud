
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PlusIcon, ExclamationTriangleIcon, ArrowDownTrayIcon, CreditCardIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, ArrowRightOnRectangleIcon } from './icons';

const Bills: React.FC = () => {
  const invoices = useStore(s => s.invoices);
  const matters = useStore(s => s.matters);

  const [activeTab, setActiveTab] = useState('Unpaid');
  const [searchTerm, setSearchTerm] = useState('');
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matter = matters.find(m => m.id === inv.matterId);
      const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (inv.clientName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (matter?.name.toLowerCase().includes(searchTerm.toLowerCase()));

      if (activeTab === 'All') return matchesSearch;
      if (activeTab === 'Unpaid') return matchesSearch && inv.status === 'Unpaid';
      if (activeTab === 'Paid') return matchesSearch && inv.status === 'Paid';
      return matchesSearch;
    });
  }, [invoices, matters, activeTab, searchTerm]);

  const getOverdueLabel = (dueDate: string) => {
      const due = new Date(dueDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - due.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (today > due) {
          return <span className="text-red-600 dark:text-red-400 flex items-center font-medium"><ExclamationTriangleIcon className="w-4 h-4 mr-1"/> Due {diffDays} days ago</span>;
      }
      return <span className="text-slate-600 dark:text-slate-300">Due in {diffDays} days</span>;
  };

  return (
    <div className="flex flex-col h-full space-y-4" onClick={() => setOpenActionId(null)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
             <div className="flex space-x-6 mb-1">
                 <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1">Bills</h1>
                 <h1 className="text-xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">Outstanding Balances</h1>
                 <h1 className="text-xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">Job Status</h1>
             </div>
        </div>
        <div className="flex space-x-2">
             <button className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
                Record payment <span className="ml-2 text-xs">&#9660;</span>
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded font-medium text-sm hover:bg-blue-700 flex items-center">
                New bills <span className="ml-2 text-xs border-l border-blue-500 pl-2">&#9660;</span>
            </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-t-lg p-2 flex flex-wrap gap-3 items-center">
        <div className="flex space-x-1 overflow-x-auto">
            {['Draft', 'Pending approval', 'Unpaid', 'Paid', 'All', 'Archive'].map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded whitespace-nowrap ${activeTab === tab ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        <div className="flex-grow"></div>

        <div className="relative">
            <input
                type="text"
                placeholder="Search by ID"
                className="pl-3 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <button className="border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
            Columns <span className="ml-1 text-xs">&#9660;</span>
        </button>

        <button className="border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
            Filters <span className="ml-1 text-xs">&#9660;</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 border-x border-b border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto flex-1 min-h-[300px]">
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                    <th className="p-3 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                    <th className="p-3 w-32">Actions</th>
                    <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">Last sent <span className="text-xs">&#9660;</span></th>
                    <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">Id <span className="text-xs">&#9660;</span></th>
                    <th className="p-3">Status</th>
                    <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">Due <span className="text-xs">&#9660;</span></th>
                    <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">Client <span className="text-xs">&#9660;</span></th>
                    <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">Matter(s) <span className="text-xs">&#9660;</span></th>
                    <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 text-right">Issue date <span className="text-xs">&#9660;</span></th>
                    <th className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 text-right">Balance <span className="text-xs">&#9660;</span></th>
                </tr>
            </thead>
            <tbody>
                {filteredInvoices.length === 0 && (
                    <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400 dark:text-slate-500">No invoices found.</td>
                    </tr>
                )}
                {filteredInvoices.map((invoice) => {
                    const matter = matters.find(m => m.id === invoice.matterId);
                    const isMenuOpen = openActionId === invoice.id;

                    return (
                        <tr key={invoice.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 group">
                            <td className="p-3"><input type="checkbox" className="rounded border-slate-300" /></td>
                            <td className="p-3 relative">
                                <div className="flex">
                                    <button className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-l text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-600">
                                        Send
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setOpenActionId(isMenuOpen ? null : invoice.id); }}
                                        className="bg-white dark:bg-slate-700 border-t border-r border-b border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-1 py-1 rounded-r text-xs hover:bg-slate-50 dark:hover:bg-slate-600"
                                    >
                                        &#9660;
                                    </button>
                                </div>
                                {isMenuOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg z-50">
                                        <button className="flex items-center w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                                            <EnvelopeIcon className="w-3 h-3 mr-2"/> Send via Email
                                        </button>
                                        <button className="flex items-center w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                                            <ArrowRightOnRectangleIcon className="w-3 h-3 mr-2"/> Share to Portal
                                        </button>
                                        <button className="flex items-center w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                                            <ChatBubbleLeftRightIcon className="w-3 h-3 mr-2"/> Send via Text
                                        </button>
                                    </div>
                                )}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">{invoice.lastSentDate || 'Not sent yet'}</td>
                            <td className="p-3 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">{invoice.id}</td>
                            <td className="p-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    invoice.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    invoice.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                    {invoice.status}
                                </span>
                            </td>
                            <td className="p-3 text-sm">
                                {getOverdueLabel(invoice.dueDate)}
                            </td>
                            <td className="p-3">
                                <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">{invoice.clientName || matter?.client}</span>
                            </td>
                             <td className="p-3">
                                <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">{matter?.name}</span>
                            </td>
                            <td className="p-3 text-right text-slate-600 dark:text-slate-300">{invoice.issueDate}</td>
                            <td className="p-3 text-right font-medium text-slate-800 dark:text-white">${(invoice.balance ?? invoice.amount)?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bills;
