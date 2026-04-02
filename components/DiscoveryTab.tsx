import React, { useState } from 'react';
import { Matter, Document } from '../types';
import { useStore } from '../store/useStore';
import { FolderIcon, CubeIcon, TagIcon, DocumentArrowUpIcon, PrinterIcon, CheckCircleIcon } from './icons';

interface DiscoveryTabProps {
    matter: Matter;
}

const DiscoveryTab: React.FC<DiscoveryTabProps> = ({ matter }) => {
    const { documents, produceDocuments, updateDocument } = useStore();
    const matterDocs = documents.filter(d => d.matterId === matter.id);

    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [startBates, setStartBates] = useState(`MAT-${matter.id.slice(-4)}-0001`);

    const handleToggleSelect = (id: string) => {
        setSelectedDocs(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleProduce = () => {
        if (selectedDocs.length === 0) return alert('Select documents to produce.');
        produceDocuments(selectedDocs, startBates);
        alert(`Successfully produced ${selectedDocs.length} documents with Bates stamps.`);
        setSelectedDocs([]);
    };

    const togglePrivileged = (doc: Document) => {
        updateDocument({
            ...doc,
            isPrivileged: !doc.isPrivileged,
            privilegeReason: !doc.isPrivileged ? 'Attorney-Client Privilege' : undefined
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Discovery Production</h2>
                        <p className="text-sm text-slate-500">Manage exhibits, Bates numbering, and privilege logs.</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50">
                            <PrinterIcon className="w-4 h-4" /> Export Privilege Log
                        </button>
                        <button
                            onClick={handleProduce}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm"
                        >
                            <CheckCircleIcon className="w-4 h-4" /> Mark as Produced
                        </button>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200 flex items-center gap-6">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Starting Bates Number</label>
                        <input
                            type="text"
                            value={startBates}
                            onChange={(e) => setStartBates(e.target.value)}
                            className="bg-white border border-slate-200 px-3 py-1.5 rounded text-sm w-48 font-mono"
                        />
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500">{selectedDocs.length} documents selected for production</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-slate-200">
                                <th className="pb-4 px-2 w-10"><input type="checkbox" onChange={(e) => setSelectedDocs(e.target.checked ? matterDocs.map(d => d.id) : [])} /></th>
                                <th className="pb-4">Document Name</th>
                                <th className="pb-4 text-center">Privileged</th>
                                <th className="pb-4">Bates Number</th>
                                <th className="pb-4">Status</th>
                                <th className="pb-4 text-right">Exhibit #</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {matterDocs.map(doc => (
                                <tr key={doc.id} className={`hover:bg-slate-50 transition-colors ${doc.isPrivileged ? 'bg-red-50/30' : ''}`}>
                                    <td className="py-4 px-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedDocs.includes(doc.id)}
                                            onChange={() => handleToggleSelect(doc.id)}
                                        />
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <CubeIcon className="w-4 h-4 text-slate-400" />
                                            <span className="font-medium text-slate-700">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <button
                                            onClick={() => togglePrivileged(doc)}
                                            className={`p-1.5 rounded-md border ${doc.isPrivileged ? 'bg-red-100 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500'}`}
                                        >
                                            <TagIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                    <td className="py-4 font-mono text-xs text-blue-600">
                                        {doc.batesNumber || '---'}
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${doc.discoveryStatus === 'Produced' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {doc.discoveryStatus || 'Draft'}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <input
                                            type="text"
                                            placeholder="Exh A"
                                            value={doc.exhibitNumber || ''}
                                            onChange={(e) => updateDocument({ ...doc, exhibitNumber: e.target.value })}
                                            className="w-16 text-right px-2 py-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {matterDocs.length === 0 && (
                        <div className="text-center py-12 text-slate-400 italic">No documents found for this matter.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscoveryTab;
