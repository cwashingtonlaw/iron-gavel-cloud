import { z } from 'zod';

export const taskChainItemSchema = z.object({
    id: z.string(),
    description: z.string().min(1, 'Description is required'),
    priority: z.enum(['High', 'Medium', 'Low']),
    dueInDays: z.number().min(0, 'Days cannot be negative'),
    notes: z.string().optional(),
});

export const taskChainSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Chain name is required'),
    description: z.string().optional(),
    items: z.array(taskChainItemSchema),
    createdBy: z.string(),
});

export const matterTemplateSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Template name is required'),
    description: z.string().optional(),
    defaultPracticeArea: z.string().optional(),
    defaultBillingType: z.enum(['Hourly', 'Flat Fee', 'Contingency']).optional(),
    defaultBillingRate: z.number().min(0).optional(),
    taskChainIds: z.array(z.string()),
    createdBy: z.string(),
    customFieldDefaults: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export type TaskChainFormData = z.infer<typeof taskChainSchema>;
export type MatterTemplateFormData = z.infer<typeof matterTemplateSchema>;
