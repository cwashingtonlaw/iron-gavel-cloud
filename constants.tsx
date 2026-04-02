
import React from 'react';
// FIX: Corrected import path for types from './' to './types'.
import { Matter, Task, Contact, Page, Document, Communication, TimeEntry, Invoice, DocumentTemplate, Transaction, PotentialClient, CustomField, Expense, User, AuditLogEntry, PortalMessage, Notification, FirmSettings, InternalNote, Event, CalendarCategory, PracticeAreaPipeline, DocumentCategory, CommunicationFeedItem, EventType, Activity, TaskChain, TaskChainItem } from './types';

export const CURRENT_USER: User = {
  id: 'USER_1',
  name: 'Christopher Washington',
  email: 'christopher.washington@greatelephantlaw.com',
  role: 'Admin',
  lastLogin: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
  avatarUrl: '/christopher-washington.jpg',
  defaultRate: 350,
};

export const MOCK_USERS: User[] = [
  CURRENT_USER,
  {
    id: 'USER_2',
    name: 'Rozshelle Laher',
    email: 'rozshelle@greatelephantlaw.com',
    role: 'Attorney',
    lastLogin: 'Yesterday',
    avatarUrl: 'https://ui-avatars.com/api/?name=Rozshelle+Laher&background=random',
    defaultRate: 300
  },
  {
    id: 'USER_3',
    name: 'Riza Fortes',
    email: 'riza@greatelephantlaw.com',
    role: 'Paralegal',
    lastLogin: '2 days ago',
    avatarUrl: 'https://ui-avatars.com/api/?name=Riza+Fortes&background=random',
    defaultRate: 150
  }
];

export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'CON_1',
    name: 'Arthur Dent',
    email: 'arthur@dent.com',
    phone: '555-4242',
    type: 'Client',
    associatedMatters: ['MAT-001'],
    hasPortalAccess: true,
    isCompany: false
  }
];

export const MOCK_PIPELINES: PracticeAreaPipeline[] = [
  {
    id: 'PIPE_PI',
    practiceArea: 'Personal Injury',
    stages: [
      { id: 'STG_PI_1', name: 'Intake & Invest.', order: 1 },
      { id: 'STG_PI_2', name: 'Medical Treatment', order: 2 },
      { id: 'STG_PI_3', name: 'Demand Package', order: 3 },
      { id: 'STG_PI_4', name: 'Negotiation', order: 4 },
      { id: 'STG_PI_5', name: 'Litigation', order: 5 },
      { id: 'STG_PI_6', name: 'Settlement', order: 6 },
    ]
  },
  {
    id: 'PIPE_CRIM',
    practiceArea: 'Criminal Defense',
    stages: [
      { id: 'STG_CR_1', name: 'Arrest/Bail', order: 1 },
      { id: 'STG_CR_2', name: 'Arraignment', order: 2 },
      { id: 'STG_CR_3', name: 'Discovery', order: 3 },
      { id: 'STG_CR_4', name: 'Pre-Trial Motions', order: 4 },
      { id: 'STG_CR_5', name: 'Plea Bargaining', order: 5 },
      { id: 'STG_CR_6', name: 'Trial', order: 6 },
    ]
  },
  {
    id: 'PIPE_LIT',
    practiceArea: 'Litigation',
    stages: [
      { id: 'STG_LIT_1', name: 'Pleadings', order: 1 },
      { id: 'STG_LIT_2', name: 'Discovery', order: 2 },
      { id: 'STG_LIT_3', name: 'Pre-Trial', order: 3 },
      { id: 'STG_LIT_4', name: 'Trial', order: 4 },
      { id: 'STG_LIT_5', name: 'Appeal', order: 5 },
    ]
  },
  {
    id: 'PIPE_IP',
    practiceArea: 'Intellectual Property',
    stages: [
      { id: 'STG_IP_1', name: 'Search & Analysis', order: 1 },
      { id: 'STG_IP_2', name: 'Application Prep', order: 2 },
      { id: 'STG_IP_3', name: 'Filing', order: 3 },
      { id: 'STG_IP_4', name: 'Examination', order: 4 },
      { id: 'STG_IP_5', name: 'Publication', order: 5 },
      { id: 'STG_IP_6', name: 'Registration', order: 6 },
    ]
  }
];

export const MOCK_MATTERS: Matter[] = [
  {
    id: 'MAT-001',
    name: 'Demolition of Property vs. Council',
    client: 'Arthur Dent',
    status: 'Open',
    openDate: '2025-11-01',
    notes: 'Client is protesting the demolition of his home for a bypass.',
    billing: { type: 'Hourly', rate: 300 },
    practiceArea: 'Litigation',
    responsibleAttorneyId: 'USER_1',
    stageId: 'STG_LIT_1',
    lastStageChangeDate: '2025-11-01',
    customFields: { 'CF_2': '2026-05-01' } // SOL Date
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'TSK-001',
    description: 'Review Council Demolition Order',
    dueDate: '2025-11-20',
    priority: 'High',
    matterId: 'MAT-001',
    assignedUserId: 'USER_1',
    assignedByUserId: 'USER_1',
    completed: false,
    notes: 'Check for proper notice periods and procedural errors.'
  }
];

export const MOCK_DOCUMENTS: Document[] = [];

export const MOCK_COMMUNICATIONS: Communication[] = [];

export const MOCK_COMMUNICATION_FEED: CommunicationFeedItem[] = [];

export const MOCK_TIME_ENTRIES: TimeEntry[] = [];

export const MOCK_EXPENSES: Expense[] = [];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: 'ACT_1', description: 'Created new matter: Demolition of Property', date: '2025-11-01T09:00:00', user: 'Christopher Washington' },
  { id: 'ACT_2', description: 'Added client: Arthur Dent', date: '2025-11-01T08:45:00', user: 'Christopher Washington' },
  { id: 'ACT_3', description: 'Uploaded document: Evidence.pdf', date: '2025-11-02T14:30:00', user: 'Christopher Washington' },
];

export const MOCK_INVOICES: Invoice[] = [];





export const MOCK_TRANSACTIONS: Transaction[] = [];

export const MOCK_POTENTIAL_CLIENTS: PotentialClient[] = [];

export const MOCK_CUSTOM_FIELDS: CustomField[] = [
  { id: 'CF_1', name: 'Case Number', type: 'Text', appliesTo: 'Matter' },
  { id: 'CF_2', name: 'Statute of Limitations', type: 'Date', appliesTo: 'Matter' },
];


export const MOCK_DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  { id: 'DT_1', name: 'Criminal Contract.docx', category: 'Contracts', lastEditedAt: '11/18/2025 3:15 PM', lastEditedBy: 'Christopher Washington', content: 'This Criminal Contract ("Contract") is entered into...', variables: ['Client Name', 'Date'] },
  { id: 'DT_2', name: 'Discovery Tracking', category: 'Evidence', lastEditedAt: '09/13/2023 1:46 PM', lastEditedBy: 'Christopher Washington', content: 'Discovery Tracking Log...', variables: ['Case Number'] },
  { id: 'DT_3', name: 'Witness List', category: 'Evidence', lastEditedAt: '09/13/2023 1:34 PM', lastEditedBy: 'Christopher Washington', content: 'Witness List for Case...', variables: ['Case Name'] },
  { id: 'DT_4', name: 'Authorization to compromise Claim and Sign Draft (Form).doc', category: 'Resolutions', lastEditedAt: '09/28/2022 11:02 AM', lastEditedBy: 'Christopher Washington', content: 'Authorization to Compromise...', variables: ['Claimant', 'Amount'] },
  { id: 'DT_5', name: 'Authorization for Information.doc', category: 'Letters', lastEditedAt: '08/09/2022 7:58 PM', lastEditedBy: 'Christopher Washington', content: 'Authorization for Release of Information...', variables: ['Patient Name', 'Provider'] },
  { id: 'DT_6', name: 'Req to Reissue SOP.doc', category: 'Letters', lastEditedAt: '11/03/2020 5:43 PM', lastEditedBy: 'Christopher Washington', content: 'Request to Reissue Service of Process...', variables: ['Defendant'] },
  { id: 'DT_7', name: 'Response to Request to Postpone Surgery.docx', category: 'Medicals', lastEditedAt: '11/03/2020 5:35 PM', lastEditedBy: 'Christopher Washington', content: 'Response regarding surgery postponement...', variables: ['Doctor Name'] },
  { id: 'DT_8', name: 'Notice to Def. Produce And:Or Preserve Evidence.docx', category: 'Evidence', lastEditedAt: '11/03/2020 5:20 PM', lastEditedBy: 'Christopher Washington', content: 'Notice to Produce/Preserve Evidence...', variables: ['Opposing Counsel'] },
  { id: 'DT_9', name: 'Ltr of Rep-UM.docx', category: 'Insurance Coverages', lastEditedAt: '11/03/2020 4:58 PM', lastEditedBy: 'Christopher Washington', content: 'Letter of Representation (Uninsured Motorist)...', variables: ['Insurance Company'] },
  { id: 'DT_10', name: 'Letter of Rep-LIA.docx', category: 'Insurance Coverages', lastEditedAt: '11/03/2020 4:58 PM', lastEditedBy: 'Christopher Washington', content: 'Letter of Representation (Liability)...', variables: ['Adjuster Name'] },
  { id: 'DT_11', name: 'Request for Ins. Coverage to State.doc', category: 'Insurance Coverages', lastEditedAt: '11/03/2020 4:58 PM', lastEditedBy: 'Christopher Washington', content: 'Request for Insurance Coverage Verification...', variables: ['State Agency'] },
];

export const MOCK_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'DC_1', name: 'Answers' },
  { id: 'DC_2', name: 'Case Costs' },
  { id: 'DC_3', name: 'Contracts' },
  { id: 'DC_4', name: 'Correspondence' },
  { id: 'DC_5', name: 'Economic Losses' },
  { id: 'DC_6', name: 'Email Attachment' },
  { id: 'DC_7', name: 'Evidence' },
  { id: 'DC_8', name: 'Instructions' },
  { id: 'DC_9', name: 'Insurance Coverages' },
  { id: 'DC_10', name: 'Letters' },
  { id: 'DC_11', name: 'Liens & Subrogation' },
];



export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'NOT_1', text: 'Welcome to CaseFlow! Complete your profile to get started.', timestamp: 'Just now', read: false },
];

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [];

export const MOCK_FIRM_SETTINGS: FirmSettings = {
  firmName: 'Great Elephant Law',
  logoUrl: '',
  address: '123 Constitution Ave\nWashington, D.C. 20001',
  notificationPreferences: {
    newTasks: true,
    clientMessages: true,
    upcomingDeadlines: true,
  }
};

export const MOCK_INTERNAL_NOTES: InternalNote[] = [];

export const MOCK_PORTAL_MESSAGES: PortalMessage[] = [];

export const MATTER_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];

// Default Calendars as per requirements
export const MOCK_CALENDARS: CalendarCategory[] = [
  { id: 'CAL_USER', name: 'Christopher Washington', color: '#1d4ed8', type: 'User', isChecked: true, isDefault: true, createdUserId: 'USER_1' }, // Blue
  { id: 'CAL_TASKS', name: 'Tasks', color: '#ef4444', type: 'System', isChecked: true, isDefault: true, createdUserId: 'SYSTEM' }, // Red
  { id: 'CAL_SOL', name: 'Statute of Limitations', color: '#dc2626', type: 'System', isChecked: true, isDefault: true, createdUserId: 'SYSTEM' }, // Dark Red
  { id: 'CAL_FIRM', name: 'Firm', color: '#f59e0b', type: 'Firm', isChecked: true, isDefault: true, createdUserId: 'SYSTEM' }, // Orange
  // Example of another user's calendar sharing
  { id: 'CAL_HARRY', name: 'Harry Daniels III', color: '#10b981', type: 'User', isChecked: false, isDefault: false, createdUserId: 'USER_2' }, // Green
];

// Default Event Types with color coding
export const MOCK_EVENT_TYPES: EventType[] = [
  { id: 'ET_MEETING', name: 'Meeting', color: '#3b82f6', icon: '👥', isDefault: true }, // Blue
  { id: 'ET_COURT', name: 'Court Hearing', color: '#ef4444', icon: '⚖️', isDefault: true }, // Red
  { id: 'ET_DEPOSITION', name: 'Deposition', color: '#f97316', icon: '📝', isDefault: true }, // Orange
  { id: 'ET_DEADLINE', name: 'Deadline', color: '#dc2626', icon: '⏰', isDefault: true }, // Dark Red
  { id: 'ET_CALL', name: 'Phone Call', color: '#10b981', icon: '📞', isDefault: true }, // Green
  { id: 'ET_CONSULTATION', name: 'Consultation', color: '#8b5cf6', icon: '💬', isDefault: true }, // Purple
  { id: 'ET_FILING', name: 'Filing', color: '#f59e0b', icon: '📋', isDefault: true }, // Amber
];

export const MOCK_EVENTS: Event[] = [
  {
    id: 'EVT-001',
    title: 'Client Initial Consultation',
    date: '2025-11-20',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    matterId: 'MAT-001',
    type: 'Meeting',
    location: 'Conference Room A',
    calendarId: 'CAL_USER',
    allDay: false
  },
  {
    id: 'EVT-002',
    title: 'Court Filing Deadline',
    date: '2025-11-22',
    startTime: '05:00 PM',
    endTime: '05:00 PM',
    matterId: 'MAT-001',
    type: 'Court Hearing',
    location: 'District Court',
    calendarId: 'CAL_FIRM',
    allDay: false
  },
  {
    id: 'EVT-003',
    title: 'Deposition - Witness Testimony',
    date: '2025-11-25',
    startTime: '02:00 PM',
    endTime: '04:00 PM',
    matterId: 'MAT-001',
    type: 'Deposition',
    location: 'Law Office',
    calendarId: 'CAL_USER',
    allDay: false
  },
  {
    id: 'EVT-004',
    title: 'Team Strategy Meeting',
    date: '2025-11-27',
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    matterId: 'MAT-001',
    type: 'Meeting',
    location: 'Virtual - Zoom',
    calendarId: 'CAL_FIRM',
    allDay: false
  },
  {
    id: 'EVT-005',
    title: 'Weekly Team Sync',
    date: '2025-11-18', // Starting Monday
    startTime: '09:00 AM',
    endTime: '09:30 AM',
    matterId: 'MAT-001',
    type: 'Meeting',
    location: 'Conference Room B',
    calendarId: 'CAL_FIRM',
    allDay: false,
    recurrence: {
      frequency: 'Weekly',
      interval: 1,
      daysOfWeek: [1], // Mondays
    }
  }
];

export const MOCK_TASK_CHAINS: TaskChain[] = [
  {
    id: 'TC_INTAKE',
    name: 'Initial Intake Checklist',
    description: 'Standard tasks for opening a new matter',
    createdBy: 'USER_1',
    items: [
      { id: 'TCI_1', description: 'Run Conflict Check', priority: 'High', dueInDays: 0 },
      { id: 'TCI_2', description: 'Request Engagement Letter', priority: 'High', dueInDays: 1 },
      { id: 'TCI_3', description: 'Collect Initial Retainer', priority: 'High', dueInDays: 3 },
      { id: 'TCI_4', description: 'Open Internal File', priority: 'Medium', dueInDays: 0 }
    ]
  },
  {
    id: 'TC_DISCOVERY',
    name: 'Discovery Phase 1',
    description: 'First round of discovery requests and responses',
    createdBy: 'USER_1',
    items: [
      { id: 'TCI_5', description: 'Draft Interrogatories', priority: 'Medium', dueInDays: 10 },
      { id: 'TCI_6', description: 'Request Production of Documents', priority: 'Medium', dueInDays: 14 },
      { id: 'TCI_7', description: 'Identify Key Witnesses', priority: 'High', dueInDays: 7 }
    ]
  },
  {
    id: 'TC_TRIAL',
    name: 'Trial Preparation',
    description: 'Final push before trial starts',
    createdBy: 'USER_1',
    items: [
      { id: 'TCI_8', description: 'Finalize Witness List', priority: 'High', dueInDays: 30 },
      { id: 'TCI_9', description: 'Prepare Exhibit List', priority: 'High', dueInDays: 30 },
      { id: 'TCI_10', description: 'Draft Jury Instructions', priority: 'High', dueInDays: 45 }
    ]
  }
];
