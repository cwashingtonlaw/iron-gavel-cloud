
export enum Page {
  Dashboard = 'Dashboard',
  Matters = 'Matters',
  Tasks = 'Tasks', // Renamed/Added for To-Do items
  Activities = 'Activities', // Reserved for Time & Expenses
  Contacts = 'Contacts',
  Billing = 'Billing',
  Bills = 'Bills',
  Reports = 'Reports', // Added Reports
  Calendar = 'Calendar',
  Workflows = 'Workflows',
  Intake = 'Intake',
  Settings = 'Settings',
  ClientPortal = 'ClientPortal',
  ConflictCheck = 'ConflictCheck',
  Documents = 'Documents',
  Communication = 'Communication',
}

export interface CustomField {
  id: string;
  name: string;
  type: 'Text' | 'Date' | 'Number';
  appliesTo: 'Matter';
}

export interface MatterStage {
  id: string;
  name: string;
  order: number;
}

export interface PracticeAreaPipeline {
  id: string;
  practiceArea: string;
  stages: MatterStage[];
}

export interface Activity {
  id: string;
  description: string;
  date: string;
  user: string;
}

export interface RelatedParty {
  id: string;
  name: string;
  role: 'Opposing Counsel' | 'Opposing Party' | 'Judge' | 'Witness' | 'Co-Counsel' | 'Co-Defendant';
  email?: string;
  phone?: string;
  notes?: string;
}

export interface SettlementDetails {
  grossAmount: number;
  attorneyFeePercent: number;
  attorneyFeeAmount: number;
  costsAdvanced: number;
  medicalLiens: number;
  netToClient: number;
  status: 'Pending' | 'Draft' | 'Finalized' | 'Paid';
  dateSettled?: string;
}

export interface Matter {
  id: string;
  name: string;
  client: string;
  status: 'Open' | 'Closed' | 'Pending';
  openDate: string;
  notes: string;
  billing: {
    type: 'Hourly' | 'Flat Fee' | 'Contingency';
    rate?: number;
    fee?: number;
  };
  customFields?: { [fieldId: string]: string | number };
  allowedUserIds?: string[]; // For matter-specific permissions (RBAC)
  responsibleAttorneyId?: string;
  practiceArea?: string;
  stageId?: string;
  lastStageChangeDate?: string; // ISO Date string
  estimatedValue?: number;
  recurring?: {
    isEnabled: boolean;
    frequency: 'Monthly' | 'Quarterly' | 'Yearly';
    amount: number;
    nextBillDate: string;
  };
  settlement?: SettlementDetails; // For contingency cases
  relatedParties?: RelatedParty[];
  trustBalance?: number;
  originatingAttorneyId?: string;
  responsibleStaffId?: string;
  clientReferenceNumber?: string;
  location?: string;
  description?: string;
  templateId?: string;
  blockedUserIds?: string[];
  notificationPreferences?: { [key: string]: boolean };
  folderStructure?: string[];
  permissions?: 'Firm' | 'Private' | 'Selective';
}

export interface Task {
  id: string;
  description: string; // Acts as the Task Name/Title
  notes?: string; // Detailed description
  dueDate: string;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Low';
  matterId: string;
  recurrence?: 'Weekly' | 'Monthly';
  assignedUserId?: string;
  assignedByUserId?: string;
}

export interface ContactEmail {
  address: string;
  type: string;
  isPrimary: boolean;
}

export interface ContactPhone {
  number: string;
  type: string;
  isPrimary: boolean;
}

export interface ContactAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  type: string;
}

export interface ContactWebsite {
  url: string;
  type: string;
  isPrimary: boolean;
}

export interface Contact {
  id: string;
  name: string;
  email: string; // Primary email for display
  phone: string; // Primary phone for display
  type: 'Client' | 'Witness' | 'Counsel' | 'Potential Client';
  associatedMatters: string[];
  hasPortalAccess: boolean;
  // Extended fields
  isCompany?: boolean;
  prefix?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  companyName?: string;
  title?: string;
  dob?: string;
  emails?: ContactEmail[];
  phones?: ContactPhone[];
  addresses?: ContactAddress[];
  websites?: ContactWebsite[];
  notes?: string;
  tags?: string[];
  value?: number;
  photoUrl?: string;
}

export type EsignStatus = 'None' | 'Sent' | 'Delivered' | 'Signed' | 'Completed' | 'Failed' | 'Declined' | 'Voided';

export interface Document {
  id: string;
  name: string;
  matterId: string;
  category: DocumentCategory;
  uploadDate: string;
  size: string;
  url?: string;
  esignStatus?: EsignStatus; // F6: E-Signature Workflow
  esignRequestedDate?: string;
  esignCompletedDate?: string;
  esignRecipient?: string;
  versions: {
    version: number;
    date: string;
    uploader: string;
  }[];
  sharedWithClient: boolean;
  folder?: string;
  // Deep Discovery Fields
  batesNumber?: string;
  isPrivileged?: boolean;
  privilegeReason?: string;
  exhibitNumber?: string;
  discoveryStatus?: 'Draft' | 'Produced' | 'Received';
}

export interface Communication {
  id: string;
  type: 'Email' | 'Call' | 'Meeting';
  subject: string;
  date: string;
  participants: string[];
  summary: string;
  matterId: string;
}

export interface CommunicationFeedItem {
  id: string;
  senderName: string;
  content: string;
  type: 'Message' | 'Event';
  matterId: string;
  matterName: string;
  date: string;
  attachmentName?: string;
}

export interface TimeEntry {
  id: string;
  matterId: string;
  date: string;
  description: string;
  duration: number; // in hours
  rate: number; // hourly rate
  isBilled: boolean;
  userId: string;
}

export interface Expense {
  id: string;
  matterId: string;
  date: string;
  description: string;
  amount: number;
  type: 'Hard Cost' | 'Soft Cost';
  isBilled: boolean;
}

export interface Invoice {
  id: string;
  matterId: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  lastSentDate?: string;
  balance?: number;
  clientName?: string;
}



export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  content: string; // Added content field
  variables: string[]; // Added variables field
  lastEditedAt: string;
  lastEditedBy: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
}




export interface TaskChainItem {
  id: string;
  description: string;
  priority: Task['priority'];
  dueInDays: number; // Days after the trigger (e.g., matter start date)
  notes?: string;
}

export interface TaskChain {
  id: string;
  name: string;
  description: string;
  items: TaskChainItem[];
  createdBy: string;
}

export interface MatterTemplate {
  id: string;
  name: string;
  description: string;
  defaultPracticeArea?: string;
  defaultBillingType?: Matter['billing']['type'];
  defaultBillingRate?: number;
  taskChainIds: string[]; // IDs of TaskChains to apply
  customFieldDefaults?: { [fieldId: string]: string | number };
  createdBy: string;
}



export interface Transaction {
  id: string;
  date: string;
  type: 'Deposit' | 'Payment' | 'Transfer';
  ledger: 'Operating' | 'Trust'; // F8: Strict IOLTA separation
  matterId: string;
  description: string;
  amount: number; // always positive
  fromAccount?: string;
  toAccount?: string;
}

export type IntakeStatus = 'New Lead' | 'Consultation Scheduled' | 'Awaiting Signature' | 'Converted' | 'Lost';

export interface PotentialClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: IntakeStatus;
  notes: string;
  source: string;
}

export type UserRole = 'Admin' | 'Attorney' | 'Paralegal' | 'Client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLogin: string;
  avatarUrl: string;
  defaultRate?: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface PortalMessage {
  id: string;
  from: 'Client' | 'Firm';
  text: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface DocumentAnalysis {
  summary: string;
  keyEntities: { name: string; type: string }[];
  importantDates: { date: string; description: string }[];
  actionItems: string[];
}


export interface FirmSettings {
  firmName: string;
  logoUrl: string;
  address: string;
  notificationPreferences: {
    newTasks: boolean;
    clientMessages: boolean;
    upcomingDeadlines: boolean;
  }
}

export interface InternalNote {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
  mentions: string[]; // array of user IDs
}

export type SearchResult = {
  answer: string;
  sources: {
    type: 'Matter' | 'Document' | 'Communication';
    id: string;
    title: string;
    snippet: string;
  }[];
} | {
  keywordResults: {
    matters: Matter[];
    contacts: Contact[];
    documents: Document[];
  }
};

export interface InternalMessage {
  id: string;
  fromUserId: string;
  toUserIds: string[];
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  matterId?: string;
}



export interface SuggestedTimeEntry {
  id: string;
  activityId: string;
  userId: string;
  matterId: string;
  description: string;
  suggestedDuration: number;
  status: 'Pending' | 'Accepted' | 'Ignored';
  timestamp: string;
}

export interface ConflictSearchAudit {
  id: string;
  timestamp: string;
  performedByUserId: string;
  searchQuery: string;
  resultsSummary: string;
  aiConflictScore: number;
  finalDecision: 'Clear' | 'Conflict Found' | 'Requires Review';
  notes: string;
}

export interface SettlementStatement extends SettlementDetails {
  id: string;
  matterId: string;
  matterName: string;
  clientName: string;
  disbursements: {
    to: string;
    reason: string;
    amount: number;
  }[];
}

export interface AppState {
  currentUser: User;
  setCurrentUser: (user: User) => void;

  // Matters
  matters: Matter[];
  pipelines: PracticeAreaPipeline[];
  addMatter: (matter: Matter) => void;
  updateMatter: (matter: Matter) => void;
  deleteMatter: (id: string) => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;

  // UI State
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Contacts
  contacts: Contact[];
  addContact: (contact: Contact) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (id: string) => void;

  // Documents
  documents: Document[];
  addDocument: (doc: Document) => void;
  deleteDocument: (id: string) => void;
  updateDocument: (doc: Document) => void;

  // Activities
  activities: Activity[];
  addActivity: (activity: Activity) => void;

  // AI Time Discovery
  suggestedTimeEntries: SuggestedTimeEntry[];
  addSuggestedTimeEntry: (entry: SuggestedTimeEntry) => void;
  updateSuggestedTimeEntry: (entry: SuggestedTimeEntry) => void;

  // Discovery
  produceDocuments: (documentIds: string[], startBates: string) => void;

  // Conflict Logs
  conflictSearchAudits: ConflictSearchAudit[];
  addConflictSearchAudit: (audit: ConflictSearchAudit) => void;
}

export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
  type: 'User' | 'Resource' | 'Firm' | 'System';
  isChecked: boolean;
  isDefault?: boolean;
  createdUserId?: string;
}

export interface EventType {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isDefault?: boolean;
}

export interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM AM/PM
  endTime: string; // HH:MM AM/PM
  matterId: string;
  eventTypeId?: string; // Links to EventType
  type: 'Meeting' | 'Deposition' | 'Court Hearing' | 'Call'; // Keep for backward compatibility
  location: string;
  calendarId?: string;
  allDay?: boolean;
  description?: string;
  recurrence?: {
    frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
    interval: number; // e.g., every 2 weeks = interval 2
    endDate?: string; // when recurrence stops (YYYY-MM-DD)
    count?: number; // or number of occurrences
    daysOfWeek?: number[]; // for weekly: [0,2,4] = Sun, Tue, Thu (0=Sunday)
  };
  isRecurringInstance?: boolean; // true if this is a generated instance
  recurringEventId?: string; // links to parent recurring event ID
  attendees?: string[]; // array of contact IDs or email addresses
  reminders?: {
    time: number; // minutes before event
    type: 'notification' | 'email';
  }[];
}

// ============================================================================
// PHASE 1, 2, 3 FEATURE TYPES
// ============================================================================

// ============================================================================
// PHASE 1: CRITICAL COMPLIANCE & SECURITY
// ============================================================================

// Feature 1: Deadline Calculation Engine
export type Jurisdiction = 'Federal' | 'California' | 'New York' | 'Texas' | 'Florida' | 'Illinois';
export type ServiceMethod = 'Personal' | 'Mail' | 'Email' | 'Electronic Filing';

export interface CourtRule {
  id: string;
  jurisdiction: Jurisdiction;
  ruleName: string; // e.g., "FRCP 12(a)(1)(A)"
  description: string;
  baseDays: number;
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  serviceMethodAdjustments: {
    [key in ServiceMethod]?: number; // additional days
  };
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  jurisdiction: Jurisdiction | 'Federal';
  recurring: boolean; // e.g., New Year's Day
}

export interface DeadlineChain {
  id: string;
  name: string;
  description: string;
  steps: DeadlineChainStep[];
}

export interface DeadlineChainStep {
  id: string;
  name: string;
  ruleId: string; // references CourtRule
  dependsOnStepId?: string; // if null, uses trigger date
  serviceMethod: ServiceMethod;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  autoCreateTask: boolean;
  taskDescription?: string;
}

export interface CalculatedDeadline {
  id: string;
  matterId: string;
  name: string;
  triggerDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  ruleId: string;
  serviceMethod: ServiceMethod;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed' | 'Missed' | 'Extended';
  notes?: string;
  linkedTaskId?: string;
  warnings: DeadlineWarning[];
}

export interface DeadlineWarning {
  id: string;
  deadlineId: string;
  type: 'Approaching' | 'Urgent' | 'Missed';
  daysUntilDue: number;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

// Feature 2: Comprehensive Audit Trail
export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  | 'EXPORT' | 'SHARE' | 'DOWNLOAD' | 'PRINT'
  | 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN'
  | 'PERMISSION_CHANGE' | 'SETTINGS_CHANGE';

export type AuditEntityType =
  | 'Matter' | 'Document' | 'Contact' | 'Task'
  | 'Invoice' | 'Transaction' | 'Event' | 'User'
  | 'Template' | 'Workflow';

export interface AuditLog {
  id: string;
  timestamp: string; // ISO 8601
  userId: string;
  userName: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  changes?: AuditChange[];
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  hash: string; // SHA-256 hash for tamper detection
  previousHash?: string; // blockchain-style linking
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface AuditRetentionPolicy {
  id: string;
  entityType: AuditEntityType;
  retentionYears: number;
  autoArchive: boolean;
  archiveLocation?: string;
}

export interface AuditExport {
  id: string;
  requestedBy: string;
  requestedAt: string;
  startDate: string;
  endDate: string;
  entityTypes: AuditEntityType[];
  format: 'CSV' | 'JSON' | 'PDF';
  status: 'Pending' | 'Completed' | 'Failed';
  downloadUrl?: string;
}

// Feature 3: Advanced Security
export interface TwoFactorAuth {
  userId: string;
  enabled: boolean;
  method: 'SMS' | 'Email' | 'Authenticator App' | 'Biometric';
  phoneNumber?: string;
  email?: string;
  secret?: string; // for TOTP
  backupCodes: string[];
  lastVerified?: string;
}

export interface SecuritySession {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  loginTime: string;
  lastActivity: string;
  expiresAt: string;
  isActive: boolean;
}

export interface EncryptionKey {
  id: string;
  userId: string;
  publicKey: string;
  privateKeyEncrypted: string; // encrypted with user password
  createdAt: string;
  expiresAt?: string;
}

export interface DataAccessLog {
  id: string;
  userId: string;
  documentId: string;
  accessType: 'View' | 'Download' | 'Print' | 'Share';
  timestamp: string;
  ipAddress: string;
  authorized: boolean;
  denialReason?: string;
}

export interface SecurityAlert {
  id: string;
  type: 'Suspicious Login' | 'Multiple Failed Attempts' | 'Unusual Access Pattern' | 'Data Exfiltration Attempt';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  userId?: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

// ============================================================================
// PHASE 2: PRODUCTIVITY & REVENUE
// ============================================================================

// Feature 4: Document OCR & Full-Text Search
export interface OCRResult {
  id: string;
  documentId: string;
  text: string;
  confidence: number; // 0-100
  language: string;
  processedAt: string;
  metadata: OCRMetadata;
}

export interface OCRMetadata {
  pageCount: number;
  extractedDates: { date: string; context: string }[];
  extractedEntities: { name: string; type: 'Person' | 'Organization' | 'Location' | 'Case Number' }[];
  extractedAmounts: { amount: number; context: string }[];
}

export interface SearchIndex {
  documentId: string;
  content: string;
  metadata: {
    title: string;
    category: string;
    matterId: string;
    uploadDate: string;
    tags: string[];
  };
  lastIndexed: string;
}

export interface AdvancedSearchQuery {
  query: string;
  filters: {
    matterIds?: string[];
    categories?: string[];
    dateRange?: { start: string; end: string };
    fileTypes?: string[];
    hasOCR?: boolean;
  };
  fuzzyMatch: boolean;
  maxResults: number;
}

export interface DocumentSearchResult {
  documentId: string;
  documentName: string;
  matterId: string;
  matterName: string;
  score: number; // relevance score
  highlights: SearchHighlight[];
  preview: string;
}

export interface SearchHighlight {
  field: string;
  snippet: string;
  startIndex: number;
  endIndex: number;
}

// Feature 5: Advanced Billing Automation
export interface AutoInvoiceRule {
  id: string;
  name: string;
  matterId?: string; // if null, applies to all matters
  frequency: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  includeUnbilledTime: boolean;
  includeUnbilledExpenses: boolean;
  minimumAmount?: number; // don't generate if below threshold
  autoSend: boolean;
  recipients: string[]; // email addresses
  template?: string;
  active: boolean;
}

export interface ReconciliationRecord {
  id: string;
  date: string;
  ledgerType: 'Operating' | 'Trust';
  bankBalance: number;
  bookBalance: number;
  clientLedgerTotal: number;
  difference: number;
  status: 'Balanced' | 'Discrepancy' | 'Under Review';
  reconciliationItems: ReconciliationItem[];
  performedBy: string;
  notes?: string;
}

export interface ReconciliationItem {
  id: string;
  type: 'Outstanding Check' | 'Deposit in Transit' | 'Bank Fee' | 'Interest' | 'Error';
  amount: number;
  description: string;
  date: string;
  cleared: boolean;
}

export interface IOLTAReport {
  id: string;
  reportDate: string;
  jurisdiction: Jurisdiction;
  trustAccountNumber: string;
  beginningBalance: number;
  deposits: number;
  withdrawals: number;
  endingBalance: number;
  clientLedgers: {
    matterId: string;
    clientName: string;
    balance: number;
  }[];
  interestEarned: number;
  complianceStatus: 'Compliant' | 'Warning' | 'Non-Compliant';
  issues: string[];
}

export interface PaymentReminder {
  id: string;
  invoiceId: string;
  matterId: string;
  clientEmail: string;
  sequence: number; // 1st reminder, 2nd reminder, etc.
  scheduledDate: string;
  sentDate?: string;
  status: 'Scheduled' | 'Sent' | 'Cancelled';
  template: string;
}

export interface ExpenseReimbursement {
  id: string;
  userId: string;
  matterId: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  receiptUrl?: string;
  receiptOCR?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

// Feature 6: Enhanced Client Portal
export interface SecureShare {
  id: string;
  documentId: string;
  sharedBy: string;
  sharedWith: string; // email or contact ID
  shareDate: string;
  expiresAt?: string;
  accessCode?: string;
  allowDownload: boolean;
  allowPrint: boolean;
  requiresAuth: boolean;
  viewCount: number;
  lastViewed?: string;
  status: 'Active' | 'Expired' | 'Revoked';
}

export interface ReadReceipt {
  id: string;
  documentId: string;
  userId: string;
  viewedAt: string;
  duration: number; // seconds
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
}

export interface PortalPayment {
  id: string;
  matterId: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: 'Credit Card' | 'ACH' | 'Wire Transfer';
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refunded';
  transactionId?: string;
  processedAt?: string;
  fee: number; // processing fee
  netAmount: number; // amount - fee
}

export interface ClientNotification {
  id: string;
  matterId: string;
  clientId: string;
  type: 'Document Uploaded' | 'Status Update' | 'Payment Due' | 'Appointment Reminder' | 'Message';
  title: string;
  message: string;
  sentAt: string;
  readAt?: string;
  actionUrl?: string;
  priority: 'Low' | 'Medium' | 'High';
}

export interface PortalSettings {
  matterId: string;
  allowedFeatures: {
    viewDocuments: boolean;
    uploadDocuments: boolean;
    makePayments: boolean;
    viewInvoices: boolean;
    messaging: boolean;
    viewCalendar: boolean;
  };
  customBranding?: {
    logoUrl: string;
    primaryColor: string;
    welcomeMessage: string;
  };
  language: 'en' | 'es' | 'fr' | 'de' | 'zh';
}

// ============================================================================
// PHASE 3: INTELLIGENCE & FUTURE-PROOFING
// ============================================================================

// Feature 7: Graph-Based Conflict Detection
export interface ConflictNode {
  id: string;
  type: 'Person' | 'Organization' | 'Matter' | 'Case';
  name: string;
  metadata: {
    email?: string;
    phone?: string;
    address?: string;
    aliases?: string[];
    dba?: string[]; // doing business as
    parentCompany?: string;
    subsidiaries?: string[];
  };
}

export interface ConflictEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType:
  | 'Client' | 'Opposing Party' | 'Attorney' | 'Witness'
  | 'Family Member' | 'Business Partner' | 'Employee' | 'Shareholder'
  | 'Parent Company' | 'Subsidiary' | 'Affiliate';
  matterId?: string;
  startDate?: string;
  endDate?: string;
  strength: number; // 0-1, how strong the relationship is
  notes?: string;
}

export interface ConflictGraph {
  nodes: ConflictNode[];
  edges: ConflictEdge[];
  lastUpdated: string;
}

export interface ConflictRiskScore {
  searchTerm: string;
  overallRisk: number; // 0-100
  directConflicts: number;
  indirectConflicts: number;
  potentialConflicts: number;
  riskFactors: {
    factor: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    description: string;
  }[];
  recommendation: 'Clear' | 'Proceed with Caution' | 'Requires Waiver' | 'Do Not Proceed';
}

export interface CorporateFamily {
  rootCompanyId: string;
  rootCompanyName: string;
  structure: CorporateFamilyNode[];
  lastVerified: string;
  source: 'Manual Entry' | 'Public Records' | 'Third Party API';
}

export interface CorporateFamilyNode {
  id: string;
  name: string;
  relationship: 'Parent' | 'Subsidiary' | 'Affiliate' | 'DBA';
  ownershipPercent?: number;
  children: CorporateFamilyNode[];
}

// Feature 8: Advanced Workflow Automation
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Litigation' | 'Transactional' | 'Estate Planning' | 'Corporate' | 'Custom';
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export interface WorkflowTrigger {
  type: 'Matter Created' | 'Matter Status Change' | 'Document Uploaded' | 'Deadline Approaching' | 'Payment Received' | 'Manual';
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  field: string; // e.g., "matter.practiceArea"
  operator: '==' | '!=' | '>' | '<' | 'contains' | 'in';
  value: any;
}

export interface WorkflowStep {
  id: string;
  order: number;
  name: string;
  type: 'Create Task' | 'Send Email' | 'Generate Document' | 'Update Field' | 'Wait' | 'Conditional Branch';
  config: WorkflowStepConfig;
  dependsOn?: string[]; // step IDs that must complete first
}

export interface WorkflowStepConfig {
  // For Create Task
  taskDescription?: string;
  taskPriority?: Task['priority'];
  taskDueInDays?: number;
  assignToUserId?: string;

  // For Send Email
  emailTemplate?: string;
  emailRecipients?: string[];
  emailSubject?: string;

  // For Generate Document
  documentTemplateId?: string;
  documentName?: string;

  // For Update Field
  entityType?: 'Matter' | 'Contact' | 'Document';
  fieldName?: string;
  fieldValue?: any;

  // For Wait
  waitDays?: number;
  waitUntilDate?: string;

  // For Conditional Branch
  condition?: WorkflowCondition;
  trueStepId?: string;
  falseStepId?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowTemplateId: string;
  matterId: string;
  triggeredBy: string;
  triggeredAt: string;
  status: 'Running' | 'Completed' | 'Failed' | 'Paused';
  currentStepId?: string;
  completedSteps: string[];
  failedSteps: { stepId: string; error: string }[];
  completedAt?: string;
}

export interface EmailParsingRule {
  id: string;
  name: string;
  fromPattern: string; // regex or email address
  subjectPattern?: string; // regex
  bodyKeywords?: string[];
  autoAssignToMatter: boolean;
  matterMatchStrategy: 'Subject Line' | 'Sender' | 'Keywords' | 'Manual';
  autoCreateDocument: boolean;
  documentCategory?: string;
  autoCreateTask: boolean;
  taskDescription?: string;
}

// Feature 9: Predictive Analytics
export interface CaseOutcomePrediction {
  matterId: string;
  predictionDate: string;
  outcomeType: 'Settlement' | 'Trial Verdict' | 'Dismissal' | 'Summary Judgment';
  probability: number; // 0-100
  confidenceLevel: 'Low' | 'Medium' | 'High';
  basedOn: {
    similarCases: number;
    factors: string[];
    historicalData: string;
  };
  estimatedSettlementRange?: {
    low: number;
    high: number;
    median: number;
  };
}

export interface TimeToResolutionForecast {
  matterId: string;
  forecastDate: string;
  estimatedMonths: number;
  confidenceInterval: {
    low: number;
    high: number;
  };
  milestones: {
    name: string;
    estimatedDate: string;
    probability: number;
  }[];
  factors: {
    factor: string;
    impact: 'Accelerating' | 'Delaying' | 'Neutral';
    description: string;
  }[];
}

export interface AttorneyMetrics {
  userId: string;
  period: { start: string; end: string };
  casesHandled: number;
  casesWon: number;
  casesLost: number;
  casesSettled: number;
  winRate: number; // percentage
  averageSettlementAmount: number;
  totalRevenue: number;
  billableHours: number;
  utilizationRate: number; // percentage
  clientSatisfactionScore?: number; // 0-100
  practiceAreaBreakdown: {
    practiceArea: string;
    caseCount: number;
    revenue: number;
  }[];
}

export interface PracticeAreaTrend {
  practiceArea: string;
  period: { start: string; end: string };
  caseVolume: number;
  volumeChange: number; // percentage change from previous period
  revenue: number;
  revenueChange: number; // percentage change
  averageCaseValue: number;
  profitability: number; // percentage
  trend: 'Growing' | 'Stable' | 'Declining';
  forecast: {
    nextPeriodVolume: number;
    nextPeriodRevenue: number;
  };
}

export interface ClientProfitability {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  totalExpenses: number;
  totalHours: number;
  profitMargin: number; // percentage
  averagePaymentTime: number; // days
  outstandingBalance: number;
  lifetimeValue: number;
  riskScore: number; // 0-100, higher = riskier client
  recommendation: 'High Value' | 'Maintain' | 'Monitor' | 'Consider Terminating';
}

// Feature 10: Mobile-First PWA
export interface PWASettings {
  enabled: boolean;
  offlineMode: boolean;
  syncInterval: number; // minutes
  maxOfflineDocuments: number;
  pushNotificationsEnabled: boolean;
  biometricAuthEnabled: boolean;
}

export interface OfflineQueue {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: AuditEntityType;
  entityId: string;
  data: any;
  timestamp: string;
  synced: boolean;
  syncedAt?: string;
  error?: string;
}

export interface PushNotificationSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  createdAt: string;
  active: boolean;
}

export interface VoiceNote {
  id: string;
  userId: string;
  matterId?: string;
  audioUrl: string;
  transcription?: string;
  duration: number; // seconds
  createdAt: string;
  tags: string[];
  converted: boolean; // converted to time entry or note
}


