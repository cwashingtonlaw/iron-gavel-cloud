import React from 'react';
import { useStore } from '../../store/useStore';
import { CurrencyDollarIcon, ArrowTrendingUpIcon } from '../icons';

const FinancialSummaryWidget: React.FC = () => {
    const { matters, invoices } = useStore();

    // Calculate total value of open matters (mock calculation if value is missing)
    const totalValue = matters
        .filter(m => m.status === 'Open')
        .reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

    // Calculate monthly revenue (Paid invoices in current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyRevenue = invoices
        .filter(inv => {
            const date = new Date(inv.issueDate);
            return inv.status === 'Paid' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((acc, curr) => acc + curr.amount, 0);

    // Mock growth for now as we don't have historical data easily accessible without more complex logic
    const revenueGrowth = 0;

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Financial Overview</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-green-700 font-medium">Pipeline Value</span>
                        <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-800">${totalValue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-700 font-medium">Monthly Revenue</span>
                        <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-800">${monthlyRevenue.toLocaleString()}</p>
                    <p className="text-xs text-blue-600 mt-1">+{revenueGrowth}% from last month</p>
                </div>
            </div>
        </div>
    );
};

export default FinancialSummaryWidget;
