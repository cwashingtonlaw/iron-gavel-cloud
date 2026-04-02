
import React, { useState, useCallback } from 'react';
import { MOCK_CUSTOM_FIELDS, MOCK_USERS, MOCK_AUDIT_LOG, CURRENT_USER, MOCK_FIRM_SETTINGS, MOCK_PIPELINES } from '../constants';
import {
    PlusIcon, UserGroupIcon, ShieldCheckIcon, Squares2X2Icon, CurrencyDollarIcon,
    BellIcon, Cog6ToothIcon, TrashIcon, PencilSquareIcon, CheckIcon, XMarkIcon,
    ArrowsUpDownIcon, BuildingOfficeIcon, UserCircleIcon, LockClosedIcon,
    ArrowDownTrayIcon, DocumentTextIcon, BoltIcon, ChevronDownIcon, ChevronUpIcon
} from './icons';
import { User, UserRole, FirmSettings, CustomField, PracticeAreaPipeline, MatterStage } from '../types';
import IntakeFormBuilder from './IntakeFormBuilder';
import { useStore } from '../store/useStore';

// ============================================================================
// SHARED UI HELPERS
// ============================================================================

const SectionCard: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6 ${className}`}>
        {title && <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-4">{title}</h2>}
        {children}
    </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${props.className || ''}`} />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} className={`mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${props.className || ''}`} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }> = ({ children, ...props }) => (
    <select {...props} className={`mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${props.className || ''}`}>
        {children}
    </select>
);

const SaveButton: React.FC<{ onClick?: () => void; label?: string; disabled?: boolean }> = ({ onClick, label = 'Save Changes', disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors"
    >
        {label}
    </button>
);

const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
        <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
            {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

const getRoleBadge = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
        Admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        Attorney: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        Paralegal: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        Client: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[role]}`}>{role}</span>;
};

// ============================================================================
// TAB DEFINITIONS
// ============================================================================

interface TabDef {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const TABS: TabDef[] = [
    { id: 'my-profile', label: 'My Profile', icon: <UserCircleIcon className="w-4 h-4" /> },
    { id: 'firm-profile', label: 'Firm Profile', icon: <BuildingOfficeIcon className="w-4 h-4" /> },
    { id: 'users', label: 'Users & Permissions', icon: <UserGroupIcon className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing Configuration', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
    { id: 'custom-fields', label: 'Custom Fields', icon: <Squares2X2Icon className="w-4 h-4" /> },
    { id: 'practice-areas', label: 'Practice Areas', icon: <BoltIcon className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Cog6ToothIcon className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon className="w-4 h-4" /> },
    { id: 'data', label: 'Data Management', icon: <ArrowDownTrayIcon className="w-4 h-4" /> },
    { id: 'intake-forms', label: 'Intake Forms', icon: <DocumentTextIcon className="w-4 h-4" /> },
    { id: 'audit-log', label: 'Audit Log', icon: <ShieldCheckIcon className="w-4 h-4" /> },
];

// ============================================================================
// MAIN SETTINGS COMPONENT
// ============================================================================

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('my-profile');

    const renderContent = () => {
        switch (activeTab) {
            case 'my-profile': return <MyProfileTab />;
            case 'firm-profile': return <FirmProfileTab />;
            case 'users': return <UsersPermissionsTab />;
            case 'billing': return <BillingConfigTab />;
            case 'custom-fields': return <CustomFieldsTab />;
            case 'practice-areas': return <PracticeAreasTab />;
            case 'integrations': return <IntegrationsTab />;
            case 'notifications': return <NotificationsTab />;
            case 'data': return <DataManagementTab />;
            case 'intake-forms': return <IntakeFormBuilder />;
            case 'audit-log': return <AuditLogTab />;
            default: return <MyProfileTab />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your firm's profile, users, billing, and more.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <nav className="flex flex-col space-y-1 sticky top-4">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// TAB: MY PROFILE
// ============================================================================

const MyProfileTab: React.FC = () => {
    const { currentUser, setCurrentUser, addToast } = useStore(s => ({
        currentUser: s.currentUser,
        setCurrentUser: s.setCurrentUser,
        addToast: s.addToast,
    }));

    const [user, setUser] = useState<User>({ ...currentUser });
    const [notifPrefs, setNotifPrefs] = useState({
        emailDigest: true,
        taskReminders: true,
        deadlineAlerts: true,
        clientMessages: true,
    });
    const [twoFactor, setTwoFactor] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: '', newPwd: '', confirm: '' });

    const handleSave = useCallback(() => {
        setCurrentUser(user);
        addToast('Profile updated successfully', 'success');
    }, [user, setCurrentUser, addToast]);

    return (
        <div className="space-y-6">
            <SectionCard title="Profile Information">
                <div className="flex items-center space-x-4">
                    <img
                        src={user.avatarUrl}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`; }}
                    />
                    <div className="flex-1">
                        <Label>Profile Picture URL</Label>
                        <Input
                            type="text"
                            value={user.avatarUrl}
                            onChange={e => setUser({ ...user, avatarUrl: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Full Name</Label>
                        <Input type="text" value={user.name} onChange={e => setUser({ ...user, name: e.target.value })} />
                    </div>
                    <div>
                        <Label>Email Address</Label>
                        <Input type="email" value={user.email} onChange={e => setUser({ ...user, email: e.target.value })} />
                    </div>
                    <div>
                        <Label>Phone Number</Label>
                        <Input type="tel" placeholder="(555) 000-0000" />
                    </div>
                    <div>
                        <Label>Default Billing Rate ($/hr)</Label>
                        <Input
                            type="number"
                            value={user.defaultRate || ''}
                            onChange={e => setUser({ ...user, defaultRate: Number(e.target.value) || undefined })}
                        />
                    </div>
                </div>

                <SaveButton onClick={handleSave} label="Save Profile" />
            </SectionCard>

            <SectionCard title="Notification Preferences">
                <Toggle label="Email Digest" description="Receive a daily summary of activity" checked={notifPrefs.emailDigest} onChange={v => setNotifPrefs(p => ({ ...p, emailDigest: v }))} />
                <Toggle label="Task Reminders" description="Get notified about upcoming and overdue tasks" checked={notifPrefs.taskReminders} onChange={v => setNotifPrefs(p => ({ ...p, taskReminders: v }))} />
                <Toggle label="Deadline Alerts" description="Alerts for statute of limitations and court deadlines" checked={notifPrefs.deadlineAlerts} onChange={v => setNotifPrefs(p => ({ ...p, deadlineAlerts: v }))} />
                <Toggle label="Client Messages" description="Notifications when clients send portal messages" checked={notifPrefs.clientMessages} onChange={v => setNotifPrefs(p => ({ ...p, clientMessages: v }))} />
            </SectionCard>

            <SectionCard title="Security">
                <Toggle label="Two-Factor Authentication" description="Add an extra layer of security to your account" checked={twoFactor} onChange={setTwoFactor} />

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Change Password</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Current Password</Label>
                            <Input type="password" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} />
                        </div>
                        <div>
                            <Label>New Password</Label>
                            <Input type="password" value={passwordForm.newPwd} onChange={e => setPasswordForm(p => ({ ...p, newPwd: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Confirm New Password</Label>
                            <Input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <SaveButton
                            label="Update Password"
                            disabled={!passwordForm.current || !passwordForm.newPwd || passwordForm.newPwd !== passwordForm.confirm}
                            onClick={() => {
                                setPasswordForm({ current: '', newPwd: '', confirm: '' });
                                addToast('Password updated successfully', 'success');
                            }}
                        />
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

// ============================================================================
// TAB: FIRM PROFILE
// ============================================================================

const FirmProfileTab: React.FC = () => {
    const { addToast } = useStore(s => ({ addToast: s.addToast }));
    const [settings, setSettings] = useState<FirmSettings>({ ...MOCK_FIRM_SETTINGS });
    const [practiceAreas, setPracticeAreas] = useState<string[]>(
        MOCK_PIPELINES.map(p => p.practiceArea)
    );
    const [newArea, setNewArea] = useState('');
    const [businessHours, setBusinessHours] = useState({ open: '08:00', close: '17:00', timezone: 'America/Chicago' });

    return (
        <div className="space-y-6">
            <SectionCard title="Firm Information">
                <div className="flex items-center space-x-4">
                    {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Firm Logo" className="w-20 h-20 rounded-lg object-cover border" />
                    ) : (
                        <div className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-medium">No Logo</div>
                    )}
                    <div className="flex-1">
                        <Label>Logo URL</Label>
                        <Input type="text" placeholder="https://..." value={settings.logoUrl} onChange={e => setSettings({ ...settings, logoUrl: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Firm Name</Label>
                        <Input type="text" value={settings.firmName} onChange={e => setSettings({ ...settings, firmName: e.target.value })} />
                    </div>
                    <div>
                        <Label>Phone</Label>
                        <Input type="tel" placeholder="(555) 000-0000" />
                    </div>
                    <div>
                        <Label>Website</Label>
                        <Input type="url" placeholder="https://greatelephantlaw.com" />
                    </div>
                </div>

                <div>
                    <Label>Address</Label>
                    <TextArea rows={3} value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} />
                </div>
            </SectionCard>

            <SectionCard title="Default Practice Areas">
                <div className="flex flex-wrap gap-2">
                    {practiceAreas.map(area => (
                        <span key={area} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {area}
                            <button onClick={() => setPracticeAreas(p => p.filter(a => a !== area))} className="ml-1 text-blue-400 hover:text-red-500 transition-colors">
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Add practice area..."
                        value={newArea}
                        onChange={e => setNewArea(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && newArea.trim()) {
                                setPracticeAreas(p => [...p, newArea.trim()]);
                                setNewArea('');
                            }
                        }}
                    />
                    <button
                        onClick={() => { if (newArea.trim()) { setPracticeAreas(p => [...p, newArea.trim()]); setNewArea(''); } }}
                        className="mt-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        Add
                    </button>
                </div>
            </SectionCard>

            <SectionCard title="Business Hours">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>Opening Time</Label>
                        <Input type="time" value={businessHours.open} onChange={e => setBusinessHours(p => ({ ...p, open: e.target.value }))} />
                    </div>
                    <div>
                        <Label>Closing Time</Label>
                        <Input type="time" value={businessHours.close} onChange={e => setBusinessHours(p => ({ ...p, close: e.target.value }))} />
                    </div>
                    <div>
                        <Label>Timezone</Label>
                        <Select value={businessHours.timezone} onChange={e => setBusinessHours(p => ({ ...p, timezone: e.target.value }))}>
                            <option value="America/New_York">Eastern</option>
                            <option value="America/Chicago">Central</option>
                            <option value="America/Denver">Mountain</option>
                            <option value="America/Los_Angeles">Pacific</option>
                        </Select>
                    </div>
                </div>

                <SaveButton onClick={() => addToast('Firm profile saved', 'success')} />
            </SectionCard>
        </div>
    );
};

// ============================================================================
// TAB: USERS & PERMISSIONS
// ============================================================================

const UsersPermissionsTab: React.FC = () => {
    const { addToast } = useStore(s => ({ addToast: s.addToast }));
    const [users, setUsers] = useState<User[]>([...MOCK_USERS]);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Attorney' as UserRole });
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [deactivated, setDeactivated] = useState<Set<string>>(new Set());
    const [showMatrix, setShowMatrix] = useState(false);

    const isAdmin = CURRENT_USER.role === 'Admin';

    const handleInvite = () => {
        if (!inviteForm.name || !inviteForm.email) return;
        const newUser: User = {
            id: `USER_${Date.now()}`,
            name: inviteForm.name,
            email: inviteForm.email,
            role: inviteForm.role,
            lastLogin: 'Never',
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(inviteForm.name)}&background=random`,
        };
        setUsers(prev => [...prev, newUser]);
        setInviteForm({ name: '', email: '', role: 'Attorney' });
        setShowInvite(false);
        addToast(`Invitation sent to ${newUser.email}`, 'success');
    };

    const toggleDeactivate = (userId: string) => {
        setDeactivated(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId); else next.add(userId);
            return next;
        });
    };

    const permissionMatrix: { permission: string; Admin: boolean; Attorney: boolean; Paralegal: boolean; Client: boolean }[] = [
        { permission: 'View All Matters', Admin: true, Attorney: true, Paralegal: true, Client: false },
        { permission: 'Create/Edit Matters', Admin: true, Attorney: true, Paralegal: false, Client: false },
        { permission: 'Delete Matters', Admin: true, Attorney: false, Paralegal: false, Client: false },
        { permission: 'View Billing', Admin: true, Attorney: true, Paralegal: false, Client: false },
        { permission: 'Edit Billing Rates', Admin: true, Attorney: false, Paralegal: false, Client: false },
        { permission: 'Generate Invoices', Admin: true, Attorney: true, Paralegal: false, Client: false },
        { permission: 'Manage Users', Admin: true, Attorney: false, Paralegal: false, Client: false },
        { permission: 'View Reports', Admin: true, Attorney: true, Paralegal: true, Client: false },
        { permission: 'Export Data', Admin: true, Attorney: true, Paralegal: false, Client: false },
        { permission: 'Access Client Portal', Admin: true, Attorney: true, Paralegal: true, Client: true },
        { permission: 'Manage Integrations', Admin: true, Attorney: false, Paralegal: false, Client: false },
        { permission: 'View Audit Log', Admin: true, Attorney: false, Paralegal: false, Client: false },
    ];

    return (
        <div className="space-y-6">
            <SectionCard>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <UserGroupIcon className="w-6 h-6 text-slate-500" /> Users & Roles
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowMatrix(!showMatrix)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ShieldCheckIcon className="w-4 h-4" /> Permissions
                        </button>
                        <button
                            disabled={!isAdmin}
                            onClick={() => setShowInvite(true)}
                            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            <PlusIcon className="w-4 h-4" /> Invite User
                        </button>
                    </div>
                </div>

                {/* Invite Form */}
                {showInvite && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-4">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Invite New User</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Full Name</Label>
                                <Input type="text" value={inviteForm.name} onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input type="email" value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))} />
                            </div>
                            <div>
                                <Label>Role</Label>
                                <Select value={inviteForm.role} onChange={e => setInviteForm(p => ({ ...p, role: e.target.value as UserRole }))}>
                                    <option value="Admin">Admin</option>
                                    <option value="Attorney">Attorney</option>
                                    <option value="Paralegal">Paralegal</option>
                                    <option value="Client">Client</option>
                                </Select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <SaveButton label="Send Invite" onClick={handleInvite} disabled={!inviteForm.name || !inviteForm.email} />
                            <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">Cancel</button>
                        </div>
                    </div>
                )}

                {/* User Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-left">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Role</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Last Login</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                                {isAdmin && <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => {
                                const isDeactivated = deactivated.has(u.id);
                                const isEditing = editingUserId === u.id;
                                return (
                                    <tr key={u.id} className={`border-t border-slate-200 dark:border-slate-700 ${isDeactivated ? 'opacity-50' : ''}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`; }} />
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-slate-200">{u.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {isEditing ? (
                                                <Select
                                                    value={u.role}
                                                    onChange={e => {
                                                        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: e.target.value as UserRole } : x));
                                                    }}
                                                    className="!mt-0 !w-32"
                                                >
                                                    <option value="Admin">Admin</option>
                                                    <option value="Attorney">Attorney</option>
                                                    <option value="Paralegal">Paralegal</option>
                                                    <option value="Client">Client</option>
                                                </Select>
                                            ) : (
                                                getRoleBadge(u.role)
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">{u.lastLogin}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isDeactivated ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                                                {isDeactivated ? 'Inactive' : 'Active'}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setEditingUserId(isEditing ? null : u.id)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                        title={isEditing ? 'Done editing' : 'Edit role'}
                                                    >
                                                        {isEditing ? <CheckIcon className="w-4 h-4" /> : <PencilSquareIcon className="w-4 h-4" />}
                                                    </button>
                                                    {u.id !== CURRENT_USER.id && (
                                                        <button
                                                            onClick={() => toggleDeactivate(u.id)}
                                                            className={`p-1.5 transition-colors ${isDeactivated ? 'text-green-500 hover:text-green-700' : 'text-slate-400 hover:text-red-500'}`}
                                                            title={isDeactivated ? 'Reactivate' : 'Deactivate'}
                                                        >
                                                            {isDeactivated ? <CheckIcon className="w-4 h-4" /> : <XMarkIcon className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </SectionCard>

            {/* Permission Matrix */}
            {showMatrix && (
                <SectionCard title="Permission Matrix">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Permission</th>
                                    <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Admin</th>
                                    <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Attorney</th>
                                    <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Paralegal</th>
                                    <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Client</th>
                                </tr>
                            </thead>
                            <tbody>
                                {permissionMatrix.map((row, i) => (
                                    <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{row.permission}</td>
                                        {(['Admin', 'Attorney', 'Paralegal', 'Client'] as const).map(role => (
                                            <td key={role} className="p-3 text-center">
                                                {row[role] ? (
                                                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <XMarkIcon className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>
            )}
        </div>
    );
};

// ============================================================================
// TAB: BILLING CONFIGURATION
// ============================================================================

const BillingConfigTab: React.FC = () => {
    const { addToast } = useStore(s => ({ addToast: s.addToast }));
    const [users] = useState<User[]>([...MOCK_USERS]);
    const [rates, setRates] = useState<Record<string, number>>(
        Object.fromEntries(MOCK_USERS.map(u => [u.id, u.defaultRate || 0]))
    );
    const [roundingIncrement, setRoundingIncrement] = useState('6');
    const [paymentTerms, setPaymentTerms] = useState('Net 30');
    const [invoiceFormat, setInvoiceFormat] = useState('INV-{YEAR}-{SEQ}');
    const [taxRate, setTaxRate] = useState('0');
    const [lateFee, setLateFee] = useState({ enabled: false, percentage: '1.5', graceDays: '30' });
    const [onlinePayments, setOnlinePayments] = useState({ creditCard: true, ach: true });

    return (
        <div className="space-y-6">
            <SectionCard title="Default Billing Rates">
                <div className="space-y-3">
                    {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                                <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`; }} />
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-slate-200">{u.name}</p>
                                    <p className="text-xs text-slate-500">{u.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-slate-500">$</span>
                                <input
                                    type="number"
                                    value={rates[u.id] || ''}
                                    onChange={e => setRates(p => ({ ...p, [u.id]: Number(e.target.value) }))}
                                    className="w-24 p-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-slate-100 text-right"
                                />
                                <span className="text-slate-500 text-sm">/ hr</span>
                            </div>
                        </div>
                    ))}
                </div>
                <SaveButton label="Save Rates" onClick={() => addToast('Billing rates saved', 'success')} />
            </SectionCard>

            <SectionCard title="Billing Rules">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>Rounding Increment</Label>
                        <Select value={roundingIncrement} onChange={e => setRoundingIncrement(e.target.value)}>
                            <option value="6">6 minutes (1/10 hour)</option>
                            <option value="10">10 minutes</option>
                            <option value="15">15 minutes (1/4 hour)</option>
                        </Select>
                    </div>
                    <div>
                        <Label>Default Payment Terms</Label>
                        <Select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                            <option value="Net 15">Net 15</option>
                            <option value="Net 30">Net 30</option>
                            <option value="Net 60">Net 60</option>
                            <option value="Net 90">Net 90</option>
                            <option value="Due on Receipt">Due on Receipt</option>
                        </Select>
                    </div>
                    <div>
                        <Label>Invoice Number Format</Label>
                        <Input type="text" value={invoiceFormat} onChange={e => setInvoiceFormat(e.target.value)} />
                        <p className="text-xs text-slate-500 mt-1">Variables: {'{YEAR}'}, {'{SEQ}'}, {'{MATTER}'}</p>
                    </div>
                    <div>
                        <Label>Tax Rate (%)</Label>
                        <Input type="number" step="0.01" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Late Fee Settings">
                <Toggle label="Enable Late Fees" description="Automatically apply late fees to overdue invoices" checked={lateFee.enabled} onChange={v => setLateFee(p => ({ ...p, enabled: v }))} />
                {lateFee.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                            <Label>Late Fee Percentage (%)</Label>
                            <Input type="number" step="0.1" value={lateFee.percentage} onChange={e => setLateFee(p => ({ ...p, percentage: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Grace Period (days)</Label>
                            <Input type="number" value={lateFee.graceDays} onChange={e => setLateFee(p => ({ ...p, graceDays: e.target.value }))} />
                        </div>
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Online Payment Methods">
                <Toggle label="Credit Card Payments" description="Accept Visa, Mastercard, Amex via payment processor" checked={onlinePayments.creditCard} onChange={v => setOnlinePayments(p => ({ ...p, creditCard: v }))} />
                <Toggle label="ACH / Bank Transfer" description="Accept direct bank transfers" checked={onlinePayments.ach} onChange={v => setOnlinePayments(p => ({ ...p, ach: v }))} />
            </SectionCard>

            <SectionCard title="Invoice Template Preview">
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-slate-50 dark:bg-slate-900">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{MOCK_FIRM_SETTINGS.firmName}</h3>
                            <p className="text-sm text-slate-500 whitespace-pre-line">{MOCK_FIRM_SETTINGS.address}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">INVOICE</p>
                            <p className="text-sm text-slate-500">{invoiceFormat.replace('{YEAR}', '2026').replace('{SEQ}', '0001')}</p>
                            <p className="text-sm text-slate-500">Terms: {paymentTerms}</p>
                        </div>
                    </div>
                    <div className="border-t border-slate-300 dark:border-slate-600 pt-4">
                        <div className="grid grid-cols-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            <span>Date</span><span>Description</span><span className="text-right">Hours</span><span className="text-right">Amount</span>
                        </div>
                        <div className="grid grid-cols-4 text-sm text-slate-600 dark:text-slate-400 py-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                            <span>04/01/2026</span><span>Legal research and analysis</span><span className="text-right">2.5</span><span className="text-right">$875.00</span>
                        </div>
                        <div className="grid grid-cols-4 text-sm font-bold text-slate-800 dark:text-slate-100 pt-4 border-t border-slate-300 dark:border-slate-600">
                            <span></span><span></span><span className="text-right">Total:</span><span className="text-right">$875.00</span>
                        </div>
                    </div>
                </div>
                <SaveButton onClick={() => addToast('Billing configuration saved', 'success')} />
            </SectionCard>
        </div>
    );
};

// ============================================================================
// TAB: CUSTOM FIELDS
// ============================================================================

const CustomFieldsTab: React.FC = () => {
    const { addToast } = useStore(s => ({ addToast: s.addToast }));
    const [fields, setFields] = useState<CustomField[]>([...MOCK_CUSTOM_FIELDS]);
    const [showAdd, setShowAdd] = useState(false);
    const [newField, setNewField] = useState({ name: '', type: 'Text' as CustomField['type'], appliesTo: 'Matter' as CustomField['appliesTo'] });
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleAdd = () => {
        if (!newField.name.trim()) return;
        setFields(prev => [...prev, { id: `CF_${Date.now()}`, ...newField }]);
        setNewField({ name: '', type: 'Text', appliesTo: 'Matter' });
        setShowAdd(false);
        addToast('Custom field added', 'success');
    };

    const handleDelete = (id: string) => {
        setFields(prev => prev.filter(f => f.id !== id));
        addToast('Custom field deleted', 'success');
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newFields = [...fields];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newFields.length) return;
        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
        setFields(newFields);
    };

    return (
        <SectionCard>
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Custom Fields</h2>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="w-4 h-4" /> Add Field
                </button>
            </div>

            {showAdd && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">New Custom Field</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Field Name</Label>
                            <Input type="text" value={newField.name} onChange={e => setNewField(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Case Number" />
                        </div>
                        <div>
                            <Label>Type</Label>
                            <Select value={newField.type} onChange={e => setNewField(p => ({ ...p, type: e.target.value as CustomField['type'] }))}>
                                <option value="Text">Text</option>
                                <option value="Date">Date</option>
                                <option value="Number">Number</option>
                            </Select>
                        </div>
                        <div>
                            <Label>Applies To</Label>
                            <Select value={newField.appliesTo} onChange={e => setNewField(p => ({ ...p, appliesTo: e.target.value as CustomField['appliesTo'] }))}>
                                <option value="Matter">Matter</option>
                            </Select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <SaveButton label="Add Field" onClick={handleAdd} disabled={!newField.name.trim()} />
                        <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400">Cancel</button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-left">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-10"></th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Field Name</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Type</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Applies To</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map((field, idx) => (
                            <tr key={field.id} className="border-t border-slate-200 dark:border-slate-700">
                                <td className="p-4">
                                    <div className="flex flex-col gap-0.5">
                                        <button onClick={() => moveField(idx, 'up')} disabled={idx === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
                                            <ChevronUpIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => moveField(idx, 'down')} disabled={idx === fields.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
                                            <ChevronDownIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {editingId === field.id ? (
                                        <Input
                                            type="text"
                                            value={field.name}
                                            onChange={e => setFields(prev => prev.map(f => f.id === field.id ? { ...f, name: e.target.value } : f))}
                                            className="!mt-0"
                                        />
                                    ) : (
                                        <span className="font-medium text-slate-800 dark:text-slate-200">{field.name}</span>
                                    )}
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">
                                    <span className="px-2 py-1 text-xs font-medium rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{field.type}</span>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{field.appliesTo}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setEditingId(editingId === field.id ? null : field.id)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            {editingId === field.id ? <CheckIcon className="w-4 h-4" /> : <PencilSquareIcon className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => handleDelete(field.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </SectionCard>
    );
};

// ============================================================================
// TAB: PRACTICE AREAS
// ============================================================================

const PracticeAreasTab: React.FC = () => {
    const { addToast } = useStore(s => ({ addToast: s.addToast }));
    const [pipelines, setPipelines] = useState<PracticeAreaPipeline[]>([...MOCK_PIPELINES]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [newPA, setNewPA] = useState('');
    const [newStageName, setNewStageName] = useState('');

    const handleAddPracticeArea = () => {
        if (!newPA.trim()) return;
        const newPipeline: PracticeAreaPipeline = {
            id: `PIPE_${Date.now()}`,
            practiceArea: newPA.trim(),
            stages: [],
        };
        setPipelines(prev => [...prev, newPipeline]);
        setNewPA('');
        setShowAdd(false);
        setExpandedId(newPipeline.id);
        addToast('Practice area added', 'success');
    };

    const handleAddStage = (pipelineId: string) => {
        if (!newStageName.trim()) return;
        setPipelines(prev => prev.map(p => {
            if (p.id !== pipelineId) return p;
            const newStage: MatterStage = {
                id: `STG_${Date.now()}`,
                name: newStageName.trim(),
                order: p.stages.length + 1,
            };
            return { ...p, stages: [...p.stages, newStage] };
        }));
        setNewStageName('');
    };

    const handleRemoveStage = (pipelineId: string, stageId: string) => {
        setPipelines(prev => prev.map(p => {
            if (p.id !== pipelineId) return p;
            const filtered = p.stages.filter(s => s.id !== stageId);
            return { ...p, stages: filtered.map((s, i) => ({ ...s, order: i + 1 })) };
        }));
    };

    const moveStage = (pipelineId: string, stageIndex: number, direction: 'up' | 'down') => {
        setPipelines(prev => prev.map(p => {
            if (p.id !== pipelineId) return p;
            const stages = [...p.stages];
            const target = direction === 'up' ? stageIndex - 1 : stageIndex + 1;
            if (target < 0 || target >= stages.length) return p;
            [stages[stageIndex], stages[target]] = [stages[target], stages[stageIndex]];
            return { ...p, stages: stages.map((s, i) => ({ ...s, order: i + 1 })) };
        }));
    };

    return (
        <div className="space-y-6">
            <SectionCard>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Practice Areas & Pipelines</h2>
                    <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        <PlusIcon className="w-4 h-4" /> Add Practice Area
                    </button>
                </div>

                {showAdd && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3">
                        <Label>Practice Area Name</Label>
                        <div className="flex gap-2">
                            <Input type="text" value={newPA} onChange={e => setNewPA(e.target.value)} placeholder="e.g., Family Law" onKeyDown={e => { if (e.key === 'Enter') handleAddPracticeArea(); }} />
                            <button onClick={handleAddPracticeArea} className="mt-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium whitespace-nowrap">Add</button>
                            <button onClick={() => setShowAdd(false)} className="mt-1 px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Cancel</button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {pipelines.map(pipeline => {
                        const isExpanded = expandedId === pipeline.id;
                        return (
                            <div key={pipeline.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : pipeline.id)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                                >
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{pipeline.practiceArea}</h3>
                                        <p className="text-xs text-slate-500">{pipeline.stages.length} stages</p>
                                    </div>
                                    {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-slate-400" /> : <ChevronDownIcon className="w-5 h-5 text-slate-400" />}
                                </button>

                                {isExpanded && (
                                    <div className="p-4 space-y-3">
                                        {pipeline.stages.length > 0 ? (
                                            <div className="space-y-2">
                                                {pipeline.stages.map((stage, idx) => (
                                                    <div key={stage.id} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                                        <div className="flex flex-col gap-0.5">
                                                            <button onClick={() => moveStage(pipeline.id, idx, 'up')} disabled={idx === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
                                                                <ChevronUpIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => moveStage(pipeline.id, idx, 'down')} disabled={idx === pipeline.stages.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
                                                                <ChevronDownIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold">{stage.order}</span>
                                                        <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{stage.name}</span>
                                                        <button onClick={() => handleRemoveStage(pipeline.id, stage.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">No stages defined yet.</p>
                                        )}
                                        <div className="flex gap-2 pt-2">
                                            <Input type="text" placeholder="New stage name..." value={newStageName} onChange={e => setNewStageName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddStage(pipeline.id); }} />
                                            <button onClick={() => handleAddStage(pipeline.id)} className="mt-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium whitespace-nowrap">Add Stage</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </SectionCard>
        </div>
    );
};

// ============================================================================
// TAB: INTEGRATIONS
// ============================================================================

interface Integration {
    id: string;
    name: string;
    category: string;
    description: string;
    connected: boolean;
    icon: string;
    status: 'Connected' | 'Disconnected' | 'Error';
}

const IntegrationsTab: React.FC = () => {
    const { addToast } = useStore(s => ({ addToast: s.addToast }));
    const [integrations, setIntegrations] = useState<Integration[]>([
        { id: 'google-cal', name: 'Google Calendar', category: 'Calendar Sync', description: 'Sync court dates and deadlines with Google Calendar', connected: false, icon: 'CAL', status: 'Disconnected' },
        { id: 'outlook-cal', name: 'Outlook Calendar', category: 'Calendar Sync', description: 'Sync events with Microsoft Outlook', connected: false, icon: 'CAL', status: 'Disconnected' },
        { id: 'gmail', name: 'Gmail', category: 'Email', description: 'Import and track email communications', connected: false, icon: 'EMAIL', status: 'Disconnected' },
        { id: 'outlook-mail', name: 'Outlook Mail', category: 'Email', description: 'Import and track Outlook emails', connected: false, icon: 'EMAIL', status: 'Disconnected' },
        { id: 'quickbooks', name: 'QuickBooks', category: 'Accounting', description: 'Sync invoices and payments with QuickBooks', connected: false, icon: 'ACCT', status: 'Disconnected' },
        { id: 'xero', name: 'Xero', category: 'Accounting', description: 'Sync financial data with Xero', connected: false, icon: 'ACCT', status: 'Disconnected' },
        { id: 'dropbox', name: 'Dropbox', category: 'Storage', description: 'Store and access documents from Dropbox', connected: false, icon: 'STOR', status: 'Disconnected' },
        { id: 'box', name: 'Box', category: 'Storage', description: 'Enterprise document storage with Box', connected: false, icon: 'STOR', status: 'Disconnected' },
        { id: 'stripe', name: 'Stripe', category: 'Payment', description: 'Accept credit card and ACH payments', connected: false, icon: 'PAY', status: 'Disconnected' },
        { id: 'lawpay', name: 'LawPay', category: 'Payment', description: 'Legal-specific payment processing with IOLTA compliance', connected: false, icon: 'PAY', status: 'Disconnected' },
    ]);

    const [showApiKeys, setShowApiKeys] = useState(false);
    const [apiKeys, setApiKeys] = useState([
        { id: 'key-1', name: 'CaseFlow API Key', key: 'cf_live_xxxxxxxxxxxxxxxxxxxx', created: '2026-01-15' },
    ]);

    const toggleConnect = (id: string) => {
        setIntegrations(prev => prev.map(i => {
            if (i.id !== id) return i;
            const connected = !i.connected;
            return { ...i, connected, status: connected ? 'Connected' : 'Disconnected' };
        }));
        const integration = integrations.find(i => i.id === id);
        if (integration) {
            addToast(`${integration.name} ${integration.connected ? 'disconnected' : 'connected'}`, integration.connected ? 'info' : 'success');
        }
    };

    const categoryColors: Record<string, string> = {
        'Calendar Sync': 'bg-blue-500',
        'Email': 'bg-purple-500',
        'Accounting': 'bg-green-500',
        'Storage': 'bg-orange-500',
        'Payment': 'bg-pink-500',
    };

    const categories = Array.from(new Set(integrations.map(i => i.category)));

    return (
        <div className="space-y-6">
            {categories.map(cat => (
                <SectionCard key={cat} title={cat}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {integrations.filter(i => i.category === cat).map(integration => (
                            <div key={integration.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                <div className={`w-10 h-10 rounded-lg ${categoryColors[integration.category]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                    {integration.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{integration.name}</h4>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                            integration.status === 'Connected' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                            integration.status === 'Error' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                        }`}>
                                            {integration.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{integration.description}</p>
                                </div>
                                <button
                                    onClick={() => toggleConnect(integration.id)}
                                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        integration.connected
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {integration.connected ? 'Disconnect' : 'Connect'}
                                </button>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            ))}

            <SectionCard title="API Key Management">
                <div className="space-y-3">
                    {apiKeys.map(key => (
                        <div key={key.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div>
                                <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{key.name}</p>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                    {showApiKeys ? key.key : key.key.replace(/./g, '*').slice(0, 20) + '...'}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Created: {key.created}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowApiKeys(!showApiKeys)} className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 border border-slate-300 dark:border-slate-600 rounded">
                                    {showApiKeys ? 'Hide' : 'Reveal'}
                                </button>
                                <button className="px-2 py-1 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded">Revoke</button>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => {
                        setApiKeys(prev => [...prev, { id: `key-${Date.now()}`, name: 'New API Key', key: `cf_live_${Math.random().toString(36).slice(2, 22)}`, created: new Date().toISOString().slice(0, 10) }]);
                        addToast('New API key generated', 'success');
                    }}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    <PlusIcon className="w-4 h-4" /> Generate New API Key
                </button>
            </SectionCard>
        </div>
    );
};

// ============================================================================
// TAB: NOTIFICATIONS
// ============================================================================

const NotificationsTab: React.FC = () => {
    const { addToast } = useStore(s => ({ addToast: s.addToast }));
    const [emailNotifs, setEmailNotifs] = useState({
        newTasks: true,
        upcomingDeadlines: true,
        clientMessages: true,
        invoicePayments: true,
        newLeads: true,
    });
    const [inAppNotifs, setInAppNotifs] = useState({
        newTasks: true,
        upcomingDeadlines: true,
        clientMessages: true,
        invoicePayments: true,
        newLeads: true,
    });
    const [digestFrequency, setDigestFrequency] = useState('realtime');

    return (
        <div className="space-y-6">
            <SectionCard title="Email Notifications">
                <Toggle label="New Tasks Assigned" description="Receive email when a task is assigned to you" checked={emailNotifs.newTasks} onChange={v => setEmailNotifs(p => ({ ...p, newTasks: v }))} />
                <Toggle label="Upcoming Deadlines" description="Email reminders for court deadlines and statute dates" checked={emailNotifs.upcomingDeadlines} onChange={v => setEmailNotifs(p => ({ ...p, upcomingDeadlines: v }))} />
                <Toggle label="Client Messages" description="Email alerts for new portal messages from clients" checked={emailNotifs.clientMessages} onChange={v => setEmailNotifs(p => ({ ...p, clientMessages: v }))} />
                <Toggle label="Invoice Payments" description="Notification when a client pays an invoice" checked={emailNotifs.invoicePayments} onChange={v => setEmailNotifs(p => ({ ...p, invoicePayments: v }))} />
                <Toggle label="New Leads" description="Alert when a new potential client submits an intake form" checked={emailNotifs.newLeads} onChange={v => setEmailNotifs(p => ({ ...p, newLeads: v }))} />
            </SectionCard>

            <SectionCard title="In-App Notifications">
                <Toggle label="New Tasks Assigned" checked={inAppNotifs.newTasks} onChange={v => setInAppNotifs(p => ({ ...p, newTasks: v }))} />
                <Toggle label="Upcoming Deadlines" checked={inAppNotifs.upcomingDeadlines} onChange={v => setInAppNotifs(p => ({ ...p, upcomingDeadlines: v }))} />
                <Toggle label="Client Messages" checked={inAppNotifs.clientMessages} onChange={v => setInAppNotifs(p => ({ ...p, clientMessages: v }))} />
                <Toggle label="Invoice Payments" checked={inAppNotifs.invoicePayments} onChange={v => setInAppNotifs(p => ({ ...p, invoicePayments: v }))} />
                <Toggle label="New Leads" checked={inAppNotifs.newLeads} onChange={v => setInAppNotifs(p => ({ ...p, newLeads: v }))} />
            </SectionCard>

            <SectionCard title="Digest Frequency">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { value: 'realtime', label: 'Real-time', desc: 'Instant notifications' },
                        { value: 'daily', label: 'Daily Digest', desc: 'Summary every morning' },
                        { value: 'weekly', label: 'Weekly Digest', desc: 'Summary every Monday' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setDigestFrequency(opt.value)}
                            className={`p-4 rounded-xl border-2 text-left transition-colors ${
                                digestFrequency === opt.value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <p className={`font-semibold text-sm ${digestFrequency === opt.value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>{opt.label}</p>
                            <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                        </button>
                    ))}
                </div>
                <SaveButton onClick={() => addToast('Notification preferences saved', 'success')} />
            </SectionCard>
        </div>
    );
};

// ============================================================================
// TAB: DATA MANAGEMENT
// ============================================================================

const DataManagementTab: React.FC = () => {
    const { addToast } = useStore(s => ({ addToast: s.addToast }));
    const [backupStatus] = useState({ lastBackup: '2026-03-31 11:45 PM', status: 'Healthy', size: '142 MB' });

    const importTypes = ['Contacts', 'Matters', 'Time Entries'] as const;
    const exportTypes = ['Contacts', 'Matters', 'Time Entries', 'Invoices', 'Documents', 'Tasks'] as const;

    return (
        <div className="space-y-6">
            <SectionCard title="Import Data">
                <p className="text-sm text-slate-500 dark:text-slate-400">Upload CSV files to bulk import data into CaseFlow.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {importTypes.map(type => (
                        <div key={type} className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer">
                            <ArrowDownTrayIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                            <p className="font-medium text-sm text-slate-700 dark:text-slate-300">Import {type}</p>
                            <p className="text-xs text-slate-400 mt-1">Upload .csv file</p>
                            <input type="file" accept=".csv" className="hidden" id={`import-${type}`} onChange={() => addToast(`${type} imported successfully`, 'success')} />
                            <label htmlFor={`import-${type}`} className="mt-2 inline-block px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium cursor-pointer hover:bg-blue-700">
                                Choose File
                            </label>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Export Data">
                <p className="text-sm text-slate-500 dark:text-slate-400">Download your data as CSV files for backup or migration.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {exportTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => addToast(`${type} exported as CSV`, 'success')}
                            className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                        >
                            <DocumentTextIcon className="w-5 h-5 text-slate-400" />
                            <div>
                                <p className="font-medium text-sm text-slate-700 dark:text-slate-300">{type}</p>
                                <p className="text-[10px] text-slate-400">Download .csv</p>
                            </div>
                        </button>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Data Backup Status">
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Last Backup</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">{backupStatus.lastBackup}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Status</p>
                        <p className="text-sm font-medium text-green-600 mt-1">{backupStatus.status}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Database Size</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">{backupStatus.size}</p>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Danger Zone">
                <div className="p-4 border-2 border-red-200 dark:border-red-900 rounded-xl bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-red-800 dark:text-red-300">Clear Demo Data</h3>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">Remove all sample data and start fresh. This action cannot be undone.</p>
                        </div>
                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to clear all demo data? This cannot be undone.')) {
                                    addToast('Demo data cleared', 'info');
                                }
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                        >
                            Clear All Data
                        </button>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

// ============================================================================
// TAB: AUDIT LOG (preserved from original)
// ============================================================================

const AuditLogTab: React.FC = () => (
    <SectionCard>
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheckIcon className="w-6 h-6 text-slate-500" /> Audit Log
            </h2>
            <input
                type="text"
                placeholder="Filter logs..."
                className="w-64 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
            />
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
            {MOCK_AUDIT_LOG.length === 0 ? (
                <div className="text-center py-16">
                    <ShieldCheckIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No audit log entries yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Activity will appear here as users interact with the system.</p>
                </div>
            ) : (
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-left sticky top-0">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Timestamp</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">User</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Action</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_AUDIT_LOG.map(log => (
                            <tr key={log.id} className="border-t border-slate-200 dark:border-slate-700">
                                <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                                <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{log.user}</td>
                                <td className="p-4"><span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{log.action}</span></td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    </SectionCard>
);

export default Settings;
