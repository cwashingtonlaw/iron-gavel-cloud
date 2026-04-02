import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon, ExclamationTriangleIcon } from './icons';

const Toast: React.FC<{ id: string; message: string; type: 'success' | 'error' | 'info'; onClose: (id: string) => void }> = ({ id, message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    const icons = {
        success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
        error: <ExclamationCircleIcon className="w-5 h-5 text-red-500" />,
        info: <ExclamationTriangleIcon className="w-5 h-5 text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-white border-green-100',
        error: 'bg-white border-red-100',
        info: 'bg-white border-blue-100',
    };

    return (
        <div className={`flex items-center p-4 mb-3 rounded-lg shadow-lg border ${bgColors[type]} min-w-[300px] animate-slide-in-right`}>
            <div className="flex-shrink-0 mr-3">
                {icons[type]}
            </div>
            <div className="flex-1 text-sm font-medium text-slate-800">
                {message}
            </div>
            <button onClick={() => onClose(id)} className="ml-3 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useStore();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={removeToast} />
            ))}
        </div>
    );
};
