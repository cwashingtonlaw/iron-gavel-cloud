import React from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { ContactFormData } from '../../schemas/contactSchema';
import { PlusIcon } from '../icons';

interface ContactAddressInfoProps {
    form: UseFormReturn<ContactFormData>;
}

const ContactAddressInfo: React.FC<ContactAddressInfoProps> = ({ form }) => {
    const { register, control } = form;
    const { fields, append, remove } = useFieldArray({
        control,
        name: "addresses"
    });

    return (
        <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Address</h3>
            {fields.length === 0 && (
                <button type="button" onClick={() => append({ street: '', city: '', state: '', zip: '', country: 'United States', type: 'Work' })} className="flex items-center text-blue-600 font-medium text-sm">
                    <PlusIcon className="w-4 h-4 mr-1" /> Add address
                </button>
            )}
            <div className="space-y-6">
                {fields.map((field, idx) => (
                    <div key={field.id} className="bg-slate-50 p-4 rounded border border-slate-200 relative">
                        <button type="button" onClick={() => remove(idx)} className="absolute top-2 right-2 text-blue-600 text-xs hover:underline">Remove</button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Street</label>
                                <textarea
                                    rows={2}
                                    {...register(`addresses.${idx}.street`)}
                                    className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                                <input {...register(`addresses.${idx}.city`)} className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">State/Province</label>
                                <input {...register(`addresses.${idx}.state`)} className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Zip/Postal code</label>
                                <input {...register(`addresses.${idx}.zip`)} className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                                    <select {...register(`addresses.${idx}.country`)} className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2">
                                        <option>United States</option>
                                        <option>Canada</option>
                                        <option>United Kingdom</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                    <select {...register(`addresses.${idx}.type`)} className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2">
                                        <option>Work</option>
                                        <option>Home</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {fields.length > 0 && (
                    <button type="button" onClick={() => append({ street: '', city: '', state: '', zip: '', country: 'United States', type: 'Work' })} className="flex items-center text-blue-600 font-medium text-sm mt-2">
                        <PlusIcon className="w-4 h-4 mr-1" /> Add another address
                    </button>
                )}
            </div>
        </section>
    );
};

export default ContactAddressInfo;
