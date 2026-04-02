import React from 'react';
import { useStore } from '../../store/useStore';
import { ClockIcon } from '../icons';

interface RecentActivityWidgetProps {
    filterUser?: string;
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ filterUser }) => {
    const { activities } = useStore();
    const recentActivities = activities
        .filter(a => !filterUser || a.user === filterUser)
        .slice(0, 5);

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
                <button className="text-sm text-blue-600 hover:underline">View all</button>
            </div>
            <div className="space-y-4">
                {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                            <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                                <ClockIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-800 font-medium">{activity.description}</p>
                                <p className="text-xs text-slate-500">{new Date(activity.date).toLocaleDateString()} • {activity.user}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-500">No recent activity.</p>
                )}
            </div>
        </div>
    );
};

export default RecentActivityWidget;
