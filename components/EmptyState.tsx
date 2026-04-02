import React from 'react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action }) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            {icon && (
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-8 h-8" }) : icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
