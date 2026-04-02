import { z } from 'zod';

export const contactEmailSchema = z.object({
    address: z.string().email({ message: "Invalid email address" }).or(z.literal('')),
    type: z.string(),
    isPrimary: z.boolean(),
});

export const contactPhoneSchema = z.object({
    number: z.string().min(1, { message: "Phone number is required" }).or(z.literal('')),
    type: z.string(),
    isPrimary: z.boolean(),
});

export const contactWebsiteSchema = z.object({
    url: z.string().url({ message: "Invalid URL" }).or(z.literal('')),
    type: z.string(),
    isPrimary: z.boolean(),
});

export const contactAddressSchema = z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
    type: z.string(),
});

export const contactSchema = z.object({
    id: z.string().optional(),
    isCompany: z.boolean(),
    // Person fields
    prefix: z.string().optional(),
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    lastName: z.string().optional(),
    // Company fields
    companyName: z.string().optional(),
    title: z.string().optional(),
    dob: z.string().optional(),

    // Lists
    emails: z.array(contactEmailSchema),
    phones: z.array(contactPhoneSchema),
    websites: z.array(contactWebsiteSchema),
    addresses: z.array(contactAddressSchema),

    // General
    type: z.enum(['Client', 'Witness', 'Counsel', 'Potential Client']),
    notes: z.string().optional(),
    photoUrl: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
    if (data.isCompany) {
        if (!data.companyName || data.companyName.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Company name is required",
                path: ["companyName"],
            });
        }
    } else {
        if (!data.firstName || data.firstName.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "First name is required",
                path: ["firstName"],
            });
        }
        if (!data.lastName || data.lastName.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Last name is required",
                path: ["lastName"],
            });
        }
    }
});

export type ContactFormData = z.infer<typeof contactSchema>;
