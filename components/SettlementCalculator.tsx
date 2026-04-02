import React, { useState, useEffect } from 'react';
import { Matter, SettlementDetails } from '../types';
import { useStore } from '../store/useStore';
import { CurrencyDollarIcon, CalculatorIcon, DocumentTextIcon } from './icons';

interface SettlementCalculatorProps {
    matter: Matter;
}

const SettlementCalculator: React.FC<SettlementCalculatorProps> = ({ matter }) => {
    const { updateMatter } = useStore();

    const [details, setDetails] = useState<SettlementDetails>(matter.settlement || {
        grossAmount: 0,
        attorneyFeePercent: 33.33,
        attorneyFeeAmount: 0,
        costsAdvanced: 0,
        medicalLiens: 0,
        netToClient: 0,
        status: 'Draft'
    });

    useEffect(() => {
        const feeAmount = (details.grossAmount * details.attorneyFeePercent) / 100;
        const net = details.grossAmount - feeAmount - details.costsAdvanced - details.medicalLiens;

        setDetails(prev => ({
            ...prev,
            attorneyFeeAmount: feeAmount,
            netToClient: Math.max(0, net)
        }));
    }, [details.grossAmount, details.attorneyFeePercent, details.costsAdvanced, details.medicalLiens]);

    const handleSave = () => {
        updateMatter({
            ...matter,
            settlement: details
        });
        alert('Settlement calculation saved to matter.');
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <CalculatorIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-800">Contingency Settlement Calculator</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${details.status === 'Draft' ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-green-700'}`}>
                    {details.status}
                </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gross Settlement Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400">$</span>
                            <input
                                type="number"
                                value={details.grossAmount}
                                onChange={(e) => setDetails({ ...details, grossAmount: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fee %</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={details.attorneyFeePercent}
                                    onChange={(e) => setDetails({ ...details, attorneyFeePercent: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <span className="absolute right-3 top-2 text-slate-400">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Costs Advanced</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    value={details.costsAdvanced}
                                    onChange={(e) => setDetails({ ...details, costsAdvanced: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Medical Liens / Reductions</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400">$</span>
                            <input
                                type="number"
                                value={details.medicalLiens}
                                onChange={(e) => setDetails({ ...details, medicalLiens: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-6 flex flex-col justify-between border border-blue-100">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Gross Recovery:</span>
                            <span className="font-semibold text-slate-800">${details.grossAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Attorney Fee ({details.attorneyFeePercent}%):</span>
                            <span className="font-semibold text-red-600">-${details.attorneyFeeAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Firm Expenses:</span>
                            <span className="font-semibold text-red-600">-${details.costsAdvanced.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Medical Liens:</span>
                            <span className="font-semibold text-red-600">-${details.medicalLiens.toLocaleString()}</span>
                        </div>
                        <div className="pt-3 border-t border-blue-200 flex justify-between">
                            <span className="font-bold text-blue-900">Net to Client:</span>
                            <span className="font-black text-2xl text-blue-900">${details.netToClient.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                        >
                            Apply to Matter
                        </button>
                        <button className="p-2 border border-blue-200 rounded-xl hover:bg-blue-100 text-blue-600">
                            <DocumentTextIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettlementCalculator;
