import {
    WorkflowTemplate,
    WorkflowExecution,
    Matter,
    WorkflowStep,
    EmailParsingRule,
    TaskChain,
    MatterTemplate
} from '../types';
import { MOCK_TASK_CHAINS } from '../constants';

/**
 * Advanced Workflow & Automation Service
 * Orchestrates event-driven legal processes and matter lifecycles
 */

const EXECUTIONS: WorkflowExecution[] = [];

export const workflowService = {
    getTaskChains: (): TaskChain[] => {
        return MOCK_TASK_CHAINS;
    },

    getMatterTemplates: (): MatterTemplate[] => {
        return [];
    },

    /**
     * Feature 8: Trigger a workflow based on an event
     */
    triggerWorkflow: (template: WorkflowTemplate, matterId: string, userId: string): WorkflowExecution => {
        const execution: WorkflowExecution = {
            id: `exec-${Date.now()}`,
            workflowTemplateId: template.id,
            matterId,
            triggeredBy: userId,
            triggeredAt: new Date().toISOString(),
            status: 'Running',
            currentStepId: template.steps[0]?.id,
            completedSteps: [],
            failedSteps: []
        };

        EXECUTIONS.push(execution);
        console.log(`[Workflow] Started execution of "${template.name}" for matter ${matterId}`);

        // In production, an async runner would process steps
        return execution;
    },

    /**
     * Feature 8: Execute a single workflow step
     */
    executeStep: async (execution: WorkflowExecution, step: WorkflowStep): Promise<boolean> => {
        console.log(`[Workflow] Executing step: ${step.name} (${step.type})`);

        try {
            switch (step.type) {
                case 'Create Task':
                    // Call taskService.addTask...
                    break;
                case 'Send Email':
                    // Call communicationService.sendEmail...
                    break;
                case 'Generate Document':
                    // Call documentService.generateFromTemplate...
                    break;
                case 'Update Field':
                    // Call matterService.updateMatter...
                    break;
            }

            execution.completedSteps.push(step.id);
            return true;
        } catch (error: any) {
            execution.failedSteps.push({ stepId: step.id, error: error.message });
            execution.status = 'Failed';
            return false;
        }
    },

    /**
     * Feature 8: Process incoming emails based on parsing rules
     */
    processIncomingEmail: (email: { from: string; subject: string; body: string }, rules: EmailParsingRule[]): void => {
        const matchingRule = rules.find(r =>
            new RegExp(r.fromPattern).test(email.from) &&
            (!r.subjectPattern || new RegExp(r.subjectPattern).test(email.subject))
        );

        if (matchingRule) {
            console.log(`[Email Automation] Rule "${matchingRule.name}" matched for email from ${email.from}`);
            if (matchingRule.autoCreateTask) {
                // Logic to create task
            }
        }
    },

    /**
     * Feature 8: Advance matter stage automatically
     */
    autoAdvanceStage: (matter: Matter, condition: any): boolean => {
        // Logic to check if all requirements for current stage are met
        console.log(`[Lifecycle] Checking criteria to advance matter: ${matter.name}`);
        return true;
    }
};
