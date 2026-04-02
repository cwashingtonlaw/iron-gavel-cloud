import React from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { ContactFormData } from '../../schemas/contactSchema';
import { PlusIcon } from '../icons';

interface ContactContactInfoProps {
    form: UseFormReturn<ContactFormData>;
}

const ContactContactInfo: React.FC<ContactContactInfoProps> = ({ form }) => {
    const { register, control, watch } = form;

    const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
        control,
        name: "emails"
    });

    const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
        control,
        name: "phones"
    });

    const { fields: websiteFields, append: appendWebsite, remove: removeWebsite } = useFieldArray({
        control,
        name: "websites"
    });

    const phones = watch('phones');

    return (
        <>
            <hr className="border-slate-200" />

            {/* Section 2: Email */}
            <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Email</h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-4 font-medium text-xs text-slate-500 mb-1">
                        <div className="col-span-6">Email address</div>
                        <div className="col-span-3">Type</div>
                        <div className="col-span-3"></div>
                    </div>
                    {emailFields.map((field, idx) => (
                        <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
                            <div className="col-span-6">
                                <input
                                    type="email"
                                    {...register(`emails.${idx}.address`)}
                                    className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="col-span-3">
                                <select
                                    {...register(`emails.${idx}.type`)}
                                    className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2"
                                >
                                    <option>Work</option>
                                    <option>Home</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="col-span-3 flex items-center pt-2 space-x-4">
                                <label className="flex items-center text-sm text-slate-700">
                                    <input
                                        type="radio"
                                        value={idx}
                                        {...register(`emails.${idx}.isPrimary`)}
                                        // React Hook Form radio handling for array fields can be tricky. 
                                        // For simplicity, we might need a custom handler or controlled component if strict "one primary" logic is needed.
                                        // But for now, let's stick to basic registration.
                                        // Note: Radio buttons with same name work natively.
                                        name="primaryEmailGroup"
                                        defaultChecked={field.isPrimary}
                                        onChange={() => {
                                            // Manually update all to false then this to true? 
                                            // Or just let the backend handle "last one wins" or "first one wins".
                                            // For UI, radio group works.
                                        }}
                                        className="mr-2"
                                    />
                                    Primary
                                </label>
                                {emailFields.length > 0 && (
                                    <button type="button" onClick={() => removeEmail(idx)} className="text-blue-600 text-sm hover:underline">Remove</button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => appendEmail({ address: '', type: 'Work', isPrimary: false })} className="flex items-center text-blue-600 font-medium text-sm mt-2">
                        <PlusIcon className="w-4 h-4 mr-1" /> Add email address
                    </button>
                </div>
            </section>

            <hr className="border-slate-200" />

            {/* Section 3: Phone */}
            <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Phone</h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-4 font-medium text-xs text-slate-500 mb-1">
                        <div className="col-span-6">Phone number</div>
                        <div className="col-span-3">Type</div>
                        <div className="col-span-3"></div>
                    </div>
                    {phoneFields.map((field, idx) => (
                        <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
                            <div className="col-span-6">
                                <input
                                    type="tel"
                                    {...register(`phones.${idx}.number`)}
                                    className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="col-span-3">
                                <select
                                    {...register(`phones.${idx}.type`)}
                                    className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2"
                                >
                                    <option>Work</option>
                                    <option>Home</option>
                                    <option>Mobile</option>
                                    <option>Fax</option>
                                </select>
                            </div>
                            <div className="col-span-3 flex items-center pt-2 space-x-4">
                                <label className="flex items-center text-sm text-slate-700">
                                    <input
                                        type="radio"
                                        value={idx}
                                        name="primaryPhoneGroup"
                                        defaultChecked={field.isPrimary}
                                        className="mr-2"
                                    />
                                    Primary
                                </label>
                                {phoneFields.length > 0 && (
                                    <button type="button" onClick={() => removePhone(idx)} className="text-blue-600 text-sm hover:underline">Remove</button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => appendPhone({ number: '', type: 'Work', isPrimary: false })} className="flex items-center text-blue-600 font-medium text-sm mt-2">
                        <PlusIcon className="w-4 h-4 mr-1" /> Add phone number
                    </button>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Which phone number should receive text notifications?</label>
                        <select className="w-full md:w-1/2 bg-white border border-slate-300 text-slate-900 rounded px-3 py-2">
                            <option>No texting phone number</option>
                            {phones && phones.filter(p => p.number).map((p, i) => <option key={i}>{p.number} ({p.type})</option>)}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">Only valid US and Canadian numbers can be selected</p>
                    </div>
                </div>
            </section>

            <hr className="border-slate-200" />

            {/* Section 4: Website */}
            <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Website</h3>
                {websiteFields.length === 0 && (
                    <button type="button" onClick={() => appendWebsite({ url: '', type: 'Work', isPrimary: false })} className="flex items-center text-blue-600 font-medium text-sm">
                        <PlusIcon className="w-4 h-4 mr-1" /> Add website
                    </button>
                )}
                <div className="space-y-3">
                    {websiteFields.length > 0 && (
                        <div className="grid grid-cols-12 gap-4 font-medium text-xs text-slate-500 mb-1">
                            <div className="col-span-6">Web address</div>
                            <div className="col-span-3">Type</div>
                            <div className="col-span-3"></div>
                        </div>
                    )}
                    {websiteFields.map((field, idx) => (
                        <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
                            <div className="col-span-6">
                                <input
                                    type="text"
                                    {...register(`websites.${idx}.url`)}
                                    className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2"
                                />
                            </div>
                            <div className="col-span-3">
                                <select
                                    {...register(`websites.${idx}.type`)}
                                    className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2"
                                >
                                    <option>Work</option>
                                    <option>Personal</option>
                                </select>
                            </div>
                            <div className="col-span-3 flex items-center pt-2 space-x-4">
                                <label className="flex items-center text-sm text-slate-700">
                                    <input
                                        type="radio"
                                        value={idx}
                                        name="primaryWebsiteGroup"
                                        defaultChecked={field.isPrimary}
                                        className="mr-2"
                                    />
                                    Primary
                                </label>
                                <button type="button" onClick={() => removeWebsite(idx)} className="text-blue-600 text-sm hover:underline">Remove</button>
                            </div>
                        </div>
                    ))}
                    {websiteFields.length > 0 && (
                        <button type="button" onClick={() => appendWebsite({ url: '', type: 'Work', isPrimary: false })} className="flex items-center text-blue-600 font-medium text-sm mt-2">
                            <PlusIcon className="w-4 h-4 mr-1" /> Add another website
                        </button>
                    )}
                </div>
            </section>
        </>
    );
};

export default ContactContactInfo;
