import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { UserSlice, createUserSlice } from './slices/userSlice';
import { UiSlice, createUiSlice } from './slices/uiSlice';
import { ContactSlice, createContactSlice } from './slices/contactSlice';
import { MatterSlice, createMatterSlice } from './slices/matterSlice';
import { TaskSlice, createTaskSlice } from './slices/taskSlice';
import { ActivitySlice, createActivitySlice } from './slices/activitySlice';
import { DocumentSlice, createDocumentSlice } from './slices/documentSlice';
import { EventSlice, createEventSlice } from './slices/eventSlice';
import { WorkflowSlice, createWorkflowSlice } from './slices/workflowSlice';
import { CommunicationSlice, createCommunicationSlice } from './slices/communicationSlice';
import { BillingSlice, createBillingSlice } from './slices/billingSlice';
import { ConflictSlice, createConflictSlice } from './slices/conflictSlice';
import { CollaborationSlice, createCollaborationSlice } from './slices/collaborationSlice';

// Phase 1, 2, 3 Slices
import { AuditState, createAuditSlice } from './slices/auditSlice';
import { SecurityState, createSecuritySlice } from './slices/securitySlice';
import { DeadlineState, createDeadlineSlice } from './slices/deadlineSlice';
import { PortalState, createPortalSlice } from './slices/portalSlice';
import { AnalyticsState, createAnalyticsSlice } from './slices/analyticsSlice';

export type AppState = UserSlice &
    UiSlice &
    ContactSlice &
    MatterSlice &
    TaskSlice &
    ActivitySlice &
    DocumentSlice &
    EventSlice &
    WorkflowSlice &
    CommunicationSlice &
    BillingSlice &
    ConflictSlice &
    CollaborationSlice &
    AuditState &
    SecurityState &
    DeadlineState &
    PortalState &
    AnalyticsState;

export const useStore = create<AppState>()(
    persist(
        (...a) => ({
            ...createUserSlice(...a),
            ...createUiSlice(...a),
            ...createContactSlice(...a),
            ...createMatterSlice(...a),
            ...createTaskSlice(...a),
            ...createActivitySlice(...a),
            ...createDocumentSlice(...a),
            ...createEventSlice(...a),
            ...createWorkflowSlice(...a),
            ...createCommunicationSlice(...a),
            ...createBillingSlice(...a),
            ...createConflictSlice(...a),
            ...createCollaborationSlice(...a),
            ...createAuditSlice(...a),
            ...createSecuritySlice(...a),
            ...createDeadlineSlice(...a),
            ...createPortalSlice(...a),
            ...createAnalyticsSlice(...a),
        }),
        {
            name: 'caseflow-storage',
        }
    )
);
