
import React, { useState } from 'react';
import { Matter } from '../types';
import { MOCK_USERS } from '../constants';
import { useStore } from '../store/useStore';
import { PlusIcon, UserCircleIcon, XMarkIcon } from './icons';

interface MatterAccessTabProps {
  matter: Matter;
}

const MatterAccessTab: React.FC<MatterAccessTabProps> = ({ matter }) => {
  const { updateMatter } = useStore();
  const [isAdding, setIsAdding] = useState(false);

  const allowedUserIds = matter.allowedUserIds || [];
  const allowedUsers = MOCK_USERS.filter(u => allowedUserIds.includes(u.id));
  const availableUsers = MOCK_USERS.filter(u => !allowedUserIds.includes(u.id));

  const handleRemoveUser = (userId: string) => {
    const updatedUserIds = allowedUserIds.filter(id => id !== userId);
    updateMatter({ ...matter, allowedUserIds: updatedUserIds });
    alert('Access removed.');
  };

  const handleAddUser = (userId: string) => {
    const updatedUserIds = [...allowedUserIds, userId];
    updateMatter({ ...matter, allowedUserIds: updatedUserIds });
    setIsAdding(false);
    alert('Access granted.');
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Matter Access Control (RBAC)</h2>
          <p className="text-sm text-slate-500">Only users listed below can view or edit this matter.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-1" /> Grant Access
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
          <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Select User to Add</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleAddUser(user.id)}
                className="flex items-center p-2 bg-white rounded border border-blue-200 hover:bg-blue-100 transition-colors text-left"
              >
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full mr-2" />
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500">{user.role}</p>
                </div>
              </button>
            ))}
            {availableUsers.length === 0 && <p className="text-xs text-slate-500 italic">All users already have access.</p>}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {allowedUsers.length > 0 ? (
          allowedUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center">
                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full mr-3 border-2 border-white shadow-sm" />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{user.role}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Contributor</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemoveUser(user.id)}
                className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                title={`Revoke access for ${user.name}`}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <UserCircleIcon className="w-12 h-12 mx-auto text-slate-300" />
            <p className="mt-2 font-medium text-slate-700">No specific users granted access.</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">This case is currently public to all members of the firm with general permissions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatterAccessTab;
