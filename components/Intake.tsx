
import React, { useState, useMemo, useCallback } from 'react';
import { IntakeStatus, PotentialClient, Matter, Contact, Event } from '../types';
import {
  PlusIcon, ChatBubbleLeftRightIcon, SparklesIcon, XMarkIcon,
  CalendarIcon, DocumentTextIcon, EnvelopeIcon, PhoneIcon,
  ClockIcon, ChartBarIcon, UserPlusIcon, CheckCircleIcon,
  FunnelIcon, EllipsisHorizontalIcon, PencilSquareIcon,
  ArrowTrendingUpIcon, CheckBadgeIcon, NoSymbolIcon,
  BriefcaseIcon, EyeIcon, TrashIcon, ArrowsUpDownIcon,
  PaperAirplaneIcon, DocumentDuplicateIcon, LockClosedIcon,
} from './icons';
import AddNewLeadModal from './AddNewLeadModal';
import IntakeFormBuilder from './IntakeFormBuilder';
import { generateMarketingCampaign } from '../services/geminiService';
import { useStore } from '../store/useStore';

// ============================================================================
// CONSTANTS
// ============================================================================

const INTAKE_STAGES: IntakeStatus[] = ['New Lead', 'Consultation Scheduled', 'Awaiting Signature', 'Converted', 'Lost'];

const STAGE_COLORS: Record<IntakeStatus, { bg: string; text: string; border: string; darkBg: string; darkText: string; darkBorder: string }> = {
  'New Lead': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', darkBg: 'dark:bg-blue-950/40', darkText: 'dark:text-blue-300', darkBorder: 'dark:border-blue-800' },
  'Consultation Scheduled': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', darkBg: 'dark:bg-purple-950/40', darkText: 'dark:text-purple-300', darkBorder: 'dark:border-purple-800' },
  'Awaiting Signature': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', darkBg: 'dark:bg-yellow-950/40', darkText: 'dark:text-yellow-300', darkBorder: 'dark:border-yellow-800' },
  'Converted': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', darkBg: 'dark:bg-green-950/40', darkText: 'dark:text-green-300', darkBorder: 'dark:border-green-800' },
  'Lost': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', darkBg: 'dark:bg-slate-800/40', darkText: 'dark:text-slate-400', darkBorder: 'dark:border-slate-700' },
};

type TabKey = 'Pipeline' | 'Lead Sources' | 'Appointments' | 'Intake Forms' | 'Nurturing' | 'E-Signatures';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'Pipeline', label: 'Pipeline' },
  { key: 'Lead Sources', label: 'Lead Sources' },
  { key: 'Appointments', label: 'Appointments' },
  { key: 'Intake Forms', label: 'Intake Forms' },
  { key: 'Nurturing', label: 'Nurturing' },
  { key: 'E-Signatures', label: 'E-Signatures' },
];

// ============================================================================
// HELPER: days since a date
// ============================================================================
function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// ============================================================================
// PIPELINE CARD
// ============================================================================
interface IntakeCardProps {
  client: PotentialClient;
  onDragStart: (e: React.DragEvent, clientId: string) => void;
  onConvert: (client: PotentialClient) => void;
  onSchedule: (client: PotentialClient) => void;
  onMarkLost: (client: PotentialClient) => void;
}

const IntakeCard: React.FC<IntakeCardProps> = ({ client, onDragStart, onConvert, onSchedule, onMarkLost }) => {
  const [showMenu, setShowMenu] = useState(false);
  const createdDate = (client as any).createdAt;
  const daysInStage = daysSince(createdDate) || Math.floor(Math.random() * 14) + 1;

  return (
    <div
      draggable="true"
      onDragStart={(e) => { onDragStart(e, client.id); }}
      onDragEnd={(e) => (e.target as HTMLElement).classList.remove('opacity-50')}
      className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{client.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{client.source || 'Unknown source'}</p>
        </div>
        <div className="relative ml-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <EllipsisHorizontalIcon className="w-4 h-4 text-slate-400" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-6 z-20 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
                {client.status !== 'Converted' && client.status !== 'Lost' && (
                  <>
                    <button onClick={() => { onConvert(client); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                      <BriefcaseIcon className="w-4 h-4" /> Convert to Matter
                    </button>
                    <button onClick={() => { onSchedule(client); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" /> Schedule Consultation
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4" /> Send Email
                    </button>
                    <button onClick={() => { onMarkLost(client); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                      <NoSymbolIcon className="w-4 h-4" /> Mark Lost
                    </button>
                  </>
                )}
                {(client.status === 'Converted' || client.status === 'Lost') && (
                  <p className="px-3 py-2 text-xs text-slate-400">No actions available</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="mt-2 space-y-1">
        {client.phone && (
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <PhoneIcon className="w-3 h-3" /> {client.phone}
          </p>
        )}
        {client.email && (
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
            <EnvelopeIcon className="w-3 h-3" /> {client.email}
          </p>
        )}
      </div>

      {client.notes && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{client.notes}</p>
      )}

      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <ClockIcon className="w-3 h-3" /> {daysInStage}d in stage
        </span>
        {client.status !== 'Converted' && client.status !== 'Lost' && (
          <button
            onClick={() => onConvert(client)}
            className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 whitespace-nowrap transition-colors"
          >
            Convert
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CONVERT TO MATTER MODAL
// ============================================================================
interface ConvertToMatterModalProps {
  isOpen: boolean;
  client: PotentialClient | null;
  onClose: () => void;
}

const ConvertToMatterModal: React.FC<ConvertToMatterModalProps> = ({ isOpen, client, onClose }) => {
  const addMatter = useStore(s => s.addMatter);
  const addContact = useStore(s => s.addContact);
  const updatePotentialClient = useStore(s => s.updatePotentialClient);
  const addToast = useStore(s => s.addToast);

  const [matterName, setMatterName] = useState('');
  const [practiceArea, setPracticeArea] = useState('Personal Injury');
  const [billingType, setBillingType] = useState<'Hourly' | 'Flat Fee' | 'Contingency'>('Hourly');
  const [rate, setRate] = useState<number>(350);

  React.useEffect(() => {
    if (client) {
      setMatterName(`${client.name} - New Matter`);
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    const matterId = `MAT-${Date.now()}`;
    const contactId = `CON-${Date.now()}`;

    const newContact: Contact = {
      id: contactId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      type: 'Client',
      associatedMatters: [matterId],
      hasPortalAccess: false,
    };

    const newMatter: Matter = {
      id: matterId,
      name: matterName,
      client: client.name,
      status: 'Open',
      openDate: new Date().toISOString().split('T')[0],
      notes: client.notes || '',
      billing: {
        type: billingType,
        rate: billingType === 'Hourly' ? rate : undefined,
        fee: billingType === 'Flat Fee' ? rate : undefined,
      },
      practiceArea,
    };

    addContact(newContact);
    addMatter(newMatter);
    updatePotentialClient({ ...client, status: 'Converted' });
    addToast(`${client.name} converted to matter successfully!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg">
        <form onSubmit={handleConvert}>
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Convert to Matter</h2>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Converting: {client.name}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{client.email} {client.phone ? `| ${client.phone}` : ''}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Matter Name</label>
              <input type="text" value={matterName} onChange={e => setMatterName(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Practice Area</label>
                <select value={practiceArea} onChange={e => setPracticeArea(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <option>Personal Injury</option>
                  <option>Criminal Defense</option>
                  <option>Family Law</option>
                  <option>Estate Planning</option>
                  <option>Corporate</option>
                  <option>Real Estate</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Billing Type</label>
                <select value={billingType} onChange={e => setBillingType(e.target.value as any)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <option value="Hourly">Hourly</option>
                  <option value="Flat Fee">Flat Fee</option>
                  <option value="Contingency">Contingency</option>
                </select>
              </div>
            </div>
            {billingType !== 'Contingency' && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">{billingType === 'Hourly' ? 'Hourly Rate' : 'Flat Fee Amount'}</label>
                <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
              </div>
            )}
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-600 text-sm">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 text-sm">Create Matter & Contact</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// SCHEDULE CONSULTATION MODAL
// ============================================================================
interface ScheduleModalProps {
  isOpen: boolean;
  client: PotentialClient | null;
  onClose: () => void;
}

const ScheduleConsultationModal: React.FC<ScheduleModalProps> = ({ isOpen, client, onClose }) => {
  const addEvent = useStore(s => s.addEvent);
  const updatePotentialClient = useStore(s => s.updatePotentialClient);
  const addToast = useStore(s => s.addToast);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00 AM');
  const [duration, setDuration] = useState(30);
  const [consultType, setConsultType] = useState('Initial Consultation');
  const [notes, setNotes] = useState('');

  if (!isOpen || !client) return null;

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const endHour = parseInt(startTime) + Math.floor(duration / 60);
    const endMin = duration % 60;
    const isPM = startTime.includes('PM');
    const endTime = `${endHour > 12 ? endHour - 12 : endHour}:${endMin.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;

    const event: Event = {
      id: `EVT-${Date.now()}`,
      title: `${consultType} - ${client.name}`,
      date,
      startTime,
      endTime,
      matterId: '',
      type: 'Meeting',
      location: 'Office',
      description: notes,
    };

    addEvent(event);
    updatePotentialClient({ ...client, status: 'Consultation Scheduled' });
    addToast(`Consultation scheduled for ${client.name}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md">
        <form onSubmit={handleSchedule}>
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Schedule Consultation</h2>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">{client.name}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">{client.phone} {client.email ? `| ${client.email}` : ''}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Consultation Type</label>
              <select value={consultType} onChange={e => setConsultType(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                <option>Initial Consultation</option>
                <option>Case Review</option>
                <option>Follow-up</option>
                <option>Phone Screening</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Time</label>
                <select value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {['8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Duration (minutes)</label>
              <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg font-medium text-sm">Cancel</button>
            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 text-sm">Schedule</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 1: PIPELINE
// ============================================================================
const PipelineTab: React.FC = () => {
  const potentialClients = useStore(s => s.potentialClients);
  const updatePotentialClient = useStore(s => s.updatePotentialClient);
  const [dragOverStage, setDragOverStage] = useState<IntakeStatus | null>(null);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [convertClient, setConvertClient] = useState<PotentialClient | null>(null);
  const [scheduleClient, setScheduleClient] = useState<PotentialClient | null>(null);

  const stats = useMemo(() => {
    const total = potentialClients.length;
    const converted = potentialClients.filter(c => c.status === 'Converted').length;
    const lost = potentialClients.filter(c => c.status === 'Lost').length;
    const active = total - converted - lost;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';
    return { total, converted, active, conversionRate, lost };
  }, [potentialClients]);

  const handleDragStart = useCallback((e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData('clientId', clientId);
    (e.target as HTMLElement).classList.add('opacity-50');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, newStatus: IntakeStatus) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData('clientId');
    const client = potentialClients.find(c => c.id === clientId);
    if (client) {
      updatePotentialClient({ ...client, status: newStatus });
    }
    setDragOverStage(null);
  }, [potentialClients, updatePotentialClient]);

  const handleMarkLost = useCallback((client: PotentialClient) => {
    updatePotentialClient({ ...client, status: 'Lost' });
  }, [updatePotentialClient]);

  return (
    <>
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Leads</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Leads</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Conversion Rate</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.conversionRate}%</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Converted</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.converted}</p>
        </div>
      </div>

      {/* Add Lead button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsAddLeadModalOpen(true)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
        >
          <PlusIcon className="w-4 h-4 mr-2" /> Add New Lead
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
        {INTAKE_STAGES.map(stage => {
          const clientsInStage = potentialClients.filter(c => c.status === stage);
          const colors = STAGE_COLORS[stage];
          const isDragOver = dragOverStage === stage;
          return (
            <div
              key={stage}
              className={`flex-shrink-0 w-72 sm:w-80 ${colors.bg} ${colors.darkBg} rounded-xl transition-colors ${isDragOver ? 'ring-2 ring-blue-400' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, stage)}
              onDragEnter={() => setDragOverStage(stage)}
              onDragLeave={() => setDragOverStage(null)}
            >
              <div className={`p-4 border-b-2 ${colors.border} ${colors.darkBorder}`}>
                <h2 className={`font-semibold ${colors.text} ${colors.darkText}`}>
                  {stage} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">{clientsInStage.length}</span>
                </h2>
              </div>
              <div className="p-3 space-y-3 min-h-[200px]">
                {clientsInStage.length > 0 ? clientsInStage.map(client => (
                  <IntakeCard
                    key={client.id}
                    client={client}
                    onDragStart={handleDragStart}
                    onConvert={setConvertClient}
                    onSchedule={setScheduleClient}
                    onMarkLost={handleMarkLost}
                  />
                )) : (
                  <div className="flex items-center justify-center h-full text-center py-8 text-sm text-slate-400 dark:text-slate-500">
                    {isDragOver ? 'Drop here' : 'No leads in this stage.'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddNewLeadModal isOpen={isAddLeadModalOpen} onClose={() => setIsAddLeadModalOpen(false)} onAddLead={(lead) => { useStore.getState().addPotentialClient(lead); }} />
      <ConvertToMatterModal isOpen={!!convertClient} client={convertClient} onClose={() => setConvertClient(null)} />
      <ScheduleConsultationModal isOpen={!!scheduleClient} client={scheduleClient} onClose={() => setScheduleClient(null)} />
    </>
  );
};

// ============================================================================
// TAB 2: LEAD SOURCES
// ============================================================================
interface LeadSource {
  id: string;
  name: string;
  leads: number;
  conversions: number;
  costPerLead: number;
  color: string;
}

const DEFAULT_SOURCES: LeadSource[] = [
  { id: 'src-1', name: 'Referral', leads: 45, conversions: 22, costPerLead: 0, color: '#3b82f6' },
  { id: 'src-2', name: 'Google Ads', leads: 32, conversions: 8, costPerLead: 85, color: '#ef4444' },
  { id: 'src-3', name: 'Website', leads: 28, conversions: 12, costPerLead: 15, color: '#10b981' },
  { id: 'src-4', name: 'Social Media', leads: 18, conversions: 5, costPerLead: 42, color: '#8b5cf6' },
  { id: 'src-5', name: 'Avvo/Lawyers.com', leads: 15, conversions: 4, costPerLead: 65, color: '#f59e0b' },
  { id: 'src-6', name: 'Walk-in', leads: 8, conversions: 3, costPerLead: 0, color: '#6366f1' },
];

const LeadSourcesTab: React.FC = () => {
  const potentialClients = useStore(s => s.potentialClients);
  const [sources, setSources] = useState<LeadSource[]>(DEFAULT_SOURCES);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');

  // Compute real source counts from store data
  const liveSourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pc of potentialClients) {
      const src = pc.source || 'Unknown';
      counts[src] = (counts[src] || 0) + 1;
    }
    return counts;
  }, [potentialClients]);

  const totalLeads = sources.reduce((sum, s) => sum + s.leads, 0) + Object.values(liveSourceCounts).reduce((a, b) => a + b, 0);

  const handleAddSource = () => {
    if (!newSourceName.trim()) return;
    const colors = ['#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];
    setSources([...sources, {
      id: `src-${Date.now()}`,
      name: newSourceName,
      leads: 0,
      conversions: 0,
      costPerLead: 0,
      color: colors[sources.length % colors.length],
    }]);
    setNewSourceName('');
    setShowAddSource(false);
  };

  return (
    <div className="space-y-6">
      {/* Pie chart area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Lead Source Breakdown</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let offset = 0;
                  return sources.map(source => {
                    const pct = totalLeads > 0 ? (source.leads / totalLeads) * 100 : 0;
                    const circumference = Math.PI * 80;
                    const strokeLen = (pct / 100) * circumference;
                    const el = (
                      <circle
                        key={source.id}
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke={source.color}
                        strokeWidth="12"
                        strokeDasharray={`${strokeLen} ${circumference - strokeLen}`}
                        strokeDashoffset={-offset}
                        className="transition-all duration-500"
                      />
                    );
                    offset += strokeLen;
                    return el;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalLeads}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {sources.map(s => (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-slate-600 dark:text-slate-300 truncate">{s.name}</span>
                <span className="text-slate-400 dark:text-slate-500 ml-auto text-xs">{s.leads}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live store sources */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Live Pipeline Sources</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Sources from your active lead pipeline</p>
          {Object.entries(liveSourceCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(liveSourceCounts).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{source}</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{count} leads</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">No leads in pipeline yet. Add leads to see live source data.</p>
          )}
        </div>
      </div>

      {/* Source ROI Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Source ROI Analysis</h3>
          <button onClick={() => setShowAddSource(true)} className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
            <PlusIcon className="w-4 h-4" /> Add Source
          </button>
        </div>
        {showAddSource && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex gap-2">
            <input type="text" value={newSourceName} onChange={e => setNewSourceName(e.target.value)} placeholder="Source name..." className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" onKeyDown={e => e.key === 'Enter' && handleAddSource()} />
            <button onClick={handleAddSource} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium">Add</button>
            <button onClick={() => setShowAddSource(false)} className="text-slate-500 px-3 py-2 text-sm">Cancel</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="p-4">Source</th>
                <th className="p-4 text-right">Leads</th>
                <th className="p-4 text-right">Conversions</th>
                <th className="p-4 text-right">Conversion Rate</th>
                <th className="p-4 text-right">Cost/Lead</th>
                <th className="p-4 text-right">Total Spend</th>
              </tr>
            </thead>
            <tbody>
              {sources.map(source => (
                <tr key={source.id} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color }} />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{source.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-slate-700 dark:text-slate-300">{source.leads}</td>
                  <td className="p-4 text-right text-slate-700 dark:text-slate-300">{source.conversions}</td>
                  <td className="p-4 text-right">
                    <span className={`font-medium ${source.leads > 0 && (source.conversions / source.leads) >= 0.3 ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      {source.leads > 0 ? ((source.conversions / source.leads) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                  <td className="p-4 text-right text-slate-700 dark:text-slate-300">${source.costPerLead.toFixed(2)}</td>
                  <td className="p-4 text-right font-medium text-slate-800 dark:text-slate-200">${(source.costPerLead * source.leads).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 3: APPOINTMENT SCHEDULING
// ============================================================================
interface Appointment {
  id: string;
  clientName: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

const AppointmentSchedulingTab: React.FC = () => {
  const events = useStore(s => s.events);
  const addEvent = useStore(s => s.addEvent);
  const potentialClients = useStore(s => s.potentialClients);
  const addToast = useStore(s => s.addToast);

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingClient, setBookingClient] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [bookingDuration, setBookingDuration] = useState(30);
  const [bookingType, setBookingType] = useState('Initial Consultation');
  const [bookingNotes, setBookingNotes] = useState('');

  // Get current week days
  const weekDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, []);

  const consultationEvents = useMemo(() => {
    return events.filter(e =>
      e.title.toLowerCase().includes('consultation') ||
      e.type === 'Meeting'
    );
  }, [events]);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const event: Event = {
      id: `EVT-${Date.now()}`,
      title: `${bookingType} - ${bookingClient}`,
      date: bookingDate,
      startTime: bookingTime,
      endTime: bookingTime,
      matterId: '',
      type: 'Meeting',
      location: 'Office',
      description: bookingNotes,
    };
    addEvent(event);
    addToast('Consultation booked successfully', 'success');
    setShowBookingForm(false);
    setBookingClient('');
    setBookingNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Consultation Calendar</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage consultations and appointment scheduling</p>
        </div>
        <button onClick={() => setShowBookingForm(true)} className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 text-sm">
          <PlusIcon className="w-4 h-4 mr-2" /> Book Consultation
        </button>
      </div>

      {/* Week calendar view */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="grid grid-cols-5 border-b border-slate-200 dark:border-slate-700">
          {weekDays.map(day => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dateStr = day.toISOString().split('T')[0];
            const dayEvents = consultationEvents.filter(e => e.date === dateStr);
            return (
              <div key={dateStr} className={`p-4 border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                <div className="text-center mb-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className={`text-lg font-bold mt-1 ${isToday ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 w-8 h-8 rounded-full flex items-center justify-center mx-auto' : 'text-slate-800 dark:text-slate-200'}`}>
                    {day.getDate()}
                  </p>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {dayEvents.map(event => (
                    <div key={event.id} className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-xs font-medium text-purple-800 dark:text-purple-200 truncate">{event.title}</p>
                      <p className="text-[10px] text-purple-600 dark:text-purple-400">{event.startTime}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Public booking link placeholder */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-xl">
            <CalendarIcon className="w-6 h-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Public Booking Page</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Share this link with potential clients to let them book consultations directly.</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="text-xs bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">https://caseflow.app/book/your-firm-slug</code>
              <button className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline">Copy Link</button>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming consultations */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Upcoming Consultations</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {consultationEvents.length > 0 ? consultationEvents.slice(0, 8).map(event => (
            <div key={event.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{event.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{event.date} at {event.startTime}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">Scheduled</span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">
              No upcoming consultations. Book a consultation to get started.
            </div>
          )}
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md">
            <form onSubmit={handleBooking}>
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Book Consultation</h2>
                <button type="button" onClick={() => setShowBookingForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Client Name <span className="text-red-500">*</span></label>
                  <input type="text" value={bookingClient} onChange={e => setBookingClient(e.target.value)} list="client-suggestions" required className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                  <datalist id="client-suggestions">
                    {potentialClients.map(pc => <option key={pc.id} value={pc.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Consultation Type</label>
                  <select value={bookingType} onChange={e => setBookingType(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <option>Initial Consultation</option>
                    <option>Case Review</option>
                    <option>Follow-up</option>
                    <option>Phone Screening</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Date</label>
                    <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Time</label>
                    <select value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {['8:00 AM','8:30 AM','9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Duration</label>
                  <select value={bookingDuration} onChange={e => setBookingDuration(Number(e.target.value))} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Notes</label>
                  <textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} rows={2} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-xl">
                <button type="button" onClick={() => setShowBookingForm(false)} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg font-medium text-sm">Cancel</button>
                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 text-sm">Book Consultation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TAB 4: INTAKE FORMS (delegates to existing IntakeFormBuilder + templates)
// ============================================================================
const IntakeFormsTab: React.FC = () => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const templates = [
    { id: 'tmpl-pi', name: 'Personal Injury Intake', fields: 12, description: 'Standard PI intake: accident details, injuries, insurance, medical treatment.', submissions: 24 },
    { id: 'tmpl-cd', name: 'Criminal Defense Questionnaire', fields: 10, description: 'Criminal case intake: charges, court info, prior record, incident details.', submissions: 18 },
    { id: 'tmpl-fl', name: 'Family Law Intake', fields: 14, description: 'Divorce/custody intake: children, assets, income, custody preferences.', submissions: 11 },
    { id: 'tmpl-ep', name: 'Estate Planning Questionnaire', fields: 8, description: 'Estate planning: assets, beneficiaries, existing documents, wishes.', submissions: 7 },
  ];

  if (showBuilder) {
    return (
      <div className="space-y-4">
        <button onClick={() => setShowBuilder(false)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
          &larr; Back to Forms List
        </button>
        <IntakeFormBuilder />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Templates */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Intake Form Templates</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pre-built templates for common practice areas</p>
          </div>
          <button onClick={() => setShowBuilder(true)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 text-sm">
            <PlusIcon className="w-4 h-4 mr-2" /> Create Custom Form
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{tmpl.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{tmpl.description}</p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>{tmpl.fields} fields</span>
                  <span>{tmpl.submissions} submissions</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowBuilder(true)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                  <button className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:underline">Preview</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Embed Code Placeholder */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Embed on Your Website</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Copy the embed code below to add your intake form to any website.</p>
        <div className="bg-slate-900 dark:bg-slate-950 p-4 rounded-lg">
          <code className="text-sm text-green-400 font-mono block whitespace-pre-wrap">{`<iframe src="https://caseflow.app/forms/your-firm/intake"\n  width="100%" height="800"\n  frameborder="0"\n  style="border: none;">\n</iframe>`}</code>
        </div>
        <button className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Copy Embed Code</button>
      </div>

      {/* Submissions table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Form Submissions</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="p-4">Form Name</th>
              <th className="p-4">Submissions</th>
              <th className="p-4">Last Updated</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(tmpl => (
              <tr key={tmpl.id} className="border-t border-slate-100 dark:border-slate-700">
                <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{tmpl.name}</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">{tmpl.submissions}</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">Mar 28, 2026</td>
                <td className="p-4 text-right">
                  <button onClick={() => setShowBuilder(true)} className="text-blue-600 dark:text-blue-400 text-sm hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 5: NURTURING (enhanced)
// ============================================================================
interface NurtureSequence {
  id: string;
  name: string;
  steps: number;
  activeLeads: number;
  conversion: string;
  status: 'Active' | 'Paused' | 'Draft';
  opens: number;
  clicks: number;
}

const NurturingTab: React.FC = () => {
  const [sequences, setSequences] = useState<NurtureSequence[]>([
    { id: 'seq-1', name: 'Personal Injury Drip', steps: 5, activeLeads: 12, conversion: '18%', status: 'Active', opens: 156, clicks: 42 },
    { id: 'seq-2', name: 'Criminal Defense - DUI Focus', steps: 3, activeLeads: 8, conversion: '22%', status: 'Active', opens: 89, clicks: 28 },
    { id: 'seq-3', name: 'Family Law - Initial Reachout', steps: 4, activeLeads: 15, conversion: '15%', status: 'Active', opens: 210, clicks: 35 },
    { id: 'seq-4', name: 'Estate Planning Follow-up', steps: 3, activeLeads: 6, conversion: '12%', status: 'Paused', opens: 45, clicks: 8 },
  ]);

  const [showBuilder, setShowBuilder] = useState(false);
  const [newSeqName, setNewSeqName] = useState('');

  const handleCreateSequence = () => {
    if (!newSeqName.trim()) return;
    setSequences([...sequences, {
      id: `seq-${Date.now()}`,
      name: newSeqName,
      steps: 0,
      activeLeads: 0,
      conversion: '0%',
      status: 'Draft',
      opens: 0,
      clicks: 0,
    }]);
    setNewSeqName('');
    setShowBuilder(false);
  };

  const activities = [
    { lead: 'Sarah Jenkins', action: 'Email Sent: "Why Choose Us?"', seq: 'Personal Injury Drip', time: '10 mins ago' },
    { lead: 'Michael Ross', action: 'SMS Sent: "Consultation Reminder"', seq: 'Criminal Defense - DUI Focus', time: '1 hour ago' },
    { lead: 'David Miller', action: 'Goal Met: Moved to Consultation Stage', seq: 'Personal Injury Drip', time: '3 hours ago' },
    { lead: 'Emily Chen', action: 'Email Sent: "Case Success Stories"', seq: 'Family Law - Initial Reachout', time: '5 hours ago' },
    { lead: 'James Wilson', action: 'Email Opened: "Free Consultation Offer"', seq: 'Estate Planning Follow-up', time: '6 hours ago' },
    { lead: 'Lisa Park', action: 'Link Clicked: "Book Now"', seq: 'Personal Injury Drip', time: '8 hours ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Analytics summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Sequences</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{sequences.filter(s => s.status === 'Active').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Opens</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{sequences.reduce((sum, s) => sum + s.opens, 0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Clicks</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{sequences.reduce((sum, s) => sum + s.clicks, 0)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Conversion</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {(sequences.reduce((sum, s) => sum + parseFloat(s.conversion), 0) / sequences.length).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Sequences */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Automated Nurture Sequences</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Keep your firm top-of-mind with automated follow-ups.</p>
          </div>
          <button onClick={() => setShowBuilder(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700">
            Create New Sequence
          </button>
        </div>

        {showBuilder && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-2">
            <input type="text" value={newSeqName} onChange={e => setNewSeqName(e.target.value)} placeholder="Sequence name..." className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" onKeyDown={e => e.key === 'Enter' && handleCreateSequence()} />
            <button onClick={handleCreateSequence} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Create</button>
            <button onClick={() => setShowBuilder(false)} className="text-slate-500 px-3 py-2 text-sm">Cancel</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {sequences.map(seq => (
            <div key={seq.id} className="p-5 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                  seq.status === 'Active' ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' :
                  seq.status === 'Paused' ? 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30' :
                  'text-slate-500 bg-slate-200 dark:text-slate-400 dark:bg-slate-600'
                }`}>{seq.status}</span>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{seq.name}</h3>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Steps</p>
                  <p className="text-lg font-black text-slate-700 dark:text-slate-200">{seq.steps}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Leads</p>
                  <p className="text-lg font-black text-slate-700 dark:text-slate-200">{seq.activeLeads}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Conv.</p>
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400">{seq.conversion}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center border-t border-slate-200 dark:border-slate-600 pt-3">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Opens</p>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{seq.opens}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Clicks</p>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{seq.clicks}</p>
                </div>
              </div>
              <button className="w-full mt-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all">
                Edit Sequence
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 dark:text-slate-200">Recent Nurture Activity</h3>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Last 24 Hours</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {activities.map((activity, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                  {activity.lead.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{activity.lead}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activity.action}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1">{activity.seq}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 6: E-SIGNATURES
// ============================================================================
interface ESignTemplate {
  id: string;
  name: string;
  category: string;
  lastUsed: string;
}

interface ESignRequest {
  id: string;
  documentName: string;
  clientName: string;
  sentDate: string;
  status: 'Sent' | 'Viewed' | 'Signed' | 'Completed' | 'Declined';
  completedDate?: string;
}

const ESignaturesTab: React.FC = () => {
  const [templates] = useState<ESignTemplate[]>([
    { id: 'esign-1', name: 'Standard Engagement Letter', category: 'General', lastUsed: 'Mar 25, 2026' },
    { id: 'esign-2', name: 'Contingency Fee Agreement', category: 'Personal Injury', lastUsed: 'Mar 22, 2026' },
    { id: 'esign-3', name: 'Criminal Defense Retainer', category: 'Criminal Defense', lastUsed: 'Mar 18, 2026' },
    { id: 'esign-4', name: 'Family Law Representation Agreement', category: 'Family Law', lastUsed: 'Mar 15, 2026' },
    { id: 'esign-5', name: 'Estate Planning Engagement', category: 'Estate Planning', lastUsed: 'Mar 10, 2026' },
  ]);

  const [requests, setRequests] = useState<ESignRequest[]>([
    { id: 'esr-1', documentName: 'Standard Engagement Letter', clientName: 'Sarah Jenkins', sentDate: 'Mar 28, 2026', status: 'Completed', completedDate: 'Mar 29, 2026' },
    { id: 'esr-2', documentName: 'Contingency Fee Agreement', clientName: 'Michael Ross', sentDate: 'Mar 27, 2026', status: 'Viewed' },
    { id: 'esr-3', documentName: 'Criminal Defense Retainer', clientName: 'David Miller', sentDate: 'Mar 26, 2026', status: 'Sent' },
    { id: 'esr-4', documentName: 'Standard Engagement Letter', clientName: 'Emily Chen', sentDate: 'Mar 25, 2026', status: 'Signed' },
    { id: 'esr-5', documentName: 'Family Law Representation Agreement', clientName: 'James Wilson', sentDate: 'Mar 20, 2026', status: 'Declined' },
  ]);

  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTemplate, setSendTemplate] = useState('');
  const [sendClient, setSendClient] = useState('');
  const [sendEmail, setSendEmail] = useState('');
  const potentialClients = useStore(s => s.potentialClients);
  const addToast = useStore(s => s.addToast);

  const statusColors: Record<string, string> = {
    'Sent': 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    'Viewed': 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
    'Signed': 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    'Completed': 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
    'Declined': 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setRequests([{
      id: `esr-${Date.now()}`,
      documentName: sendTemplate,
      clientName: sendClient,
      sentDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Sent',
    }, ...requests]);
    addToast(`E-signature request sent to ${sendClient}`, 'success');
    setShowSendModal(false);
    setSendTemplate('');
    setSendClient('');
    setSendEmail('');
  };

  const completedCount = requests.filter(r => r.status === 'Completed' || r.status === 'Signed').length;
  const pendingCount = requests.filter(r => r.status === 'Sent' || r.status === 'Viewed').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Templates</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{templates.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{completedCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completion Rate</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {requests.length > 0 ? ((completedCount / requests.length) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      {/* Engagement Letter Templates */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Engagement Letter Templates</h3>
          <button onClick={() => setShowSendModal(true)} className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg font-medium text-sm hover:bg-blue-700">
            <PaperAirplaneIcon className="w-4 h-4 mr-2" /> Send for Signature
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                  <DocumentDuplicateIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-800 dark:text-slate-100 text-sm truncate">{tmpl.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tmpl.category}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Last used: {tmpl.lastUsed}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setSendTemplate(tmpl.name); setShowSendModal(true); }} className="flex-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  Send
                </button>
                <button className="flex-1 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signature Status Tracking */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Signature Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="p-4">Document</th>
                <th className="p-4">Client</th>
                <th className="p-4">Sent</th>
                <th className="p-4">Status</th>
                <th className="p-4">Completed</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{req.documentName}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{req.clientName}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{req.sentDate}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[req.status] || ''}`}>{req.status}</span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{req.completedDate || '--'}</td>
                  <td className="p-4 text-right">
                    {(req.status === 'Sent' || req.status === 'Viewed') && (
                      <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Resend</button>
                    )}
                    {(req.status === 'Completed' || req.status === 'Signed') && (
                      <button className="text-xs text-green-600 dark:text-green-400 hover:underline">Download</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send for Signature Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md">
            <form onSubmit={handleSend}>
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Send for Signature</h2>
                <button type="button" onClick={() => setShowSendModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Template</label>
                  <select value={sendTemplate} onChange={e => setSendTemplate(e.target.value)} required className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <option value="">Select template...</option>
                    {templates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Client Name</label>
                  <input type="text" value={sendClient} onChange={e => setSendClient(e.target.value)} list="esign-client-suggestions" required className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                  <datalist id="esign-client-suggestions">
                    {potentialClients.map(pc => <option key={pc.id} value={pc.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Client Email</label>
                  <input type="email" value={sendEmail} onChange={e => setSendEmail(e.target.value)} required className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-xl">
                <button type="button" onClick={() => setShowSendModal(false)} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-4 py-2 rounded-lg font-medium text-sm">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 text-sm flex items-center gap-2">
                  <PaperAirplaneIcon className="w-4 h-4" /> Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN INTAKE COMPONENT
// ============================================================================
const Intake: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('Pipeline');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">CRM & Intake</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your lead pipeline, consultations, forms, and engagement.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'Pipeline' && <PipelineTab />}
      {activeTab === 'Lead Sources' && <LeadSourcesTab />}
      {activeTab === 'Appointments' && <AppointmentSchedulingTab />}
      {activeTab === 'Intake Forms' && <IntakeFormsTab />}
      {activeTab === 'Nurturing' && <NurturingTab />}
      {activeTab === 'E-Signatures' && <ESignaturesTab />}
    </div>
  );
};

export default Intake;
