import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Contact } from '../types';
import { XMarkIcon } from './icons';
import { contactSchema, ContactFormData } from '../schemas/contactSchema';
import ContactBasicInfo from './contacts/ContactBasicInfo';
import ContactContactInfo from './contacts/ContactContactInfo';
import ContactAddressInfo from './contacts/ContactAddressInfo';
import ConflictAlert from './ConflictAlert';

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddContact: (contact: Contact) => void;
    contact?: Contact | null;
    onUpdateContact?: (contact: Contact) => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, onAddContact, contact, onUpdateContact }) => {
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const methods = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            isCompany: false,
            emails: [{ address: '', type: 'Work', isPrimary: true }],
            phones: [{ number: '', type: 'Work', isPrimary: true }],
            websites: [],
            addresses: [],
            type: 'Client',
            notes: '',
        }
    });

    const { handleSubmit, reset, setValue } = methods;

    useEffect(() => {
        if (isOpen) {
            if (contact) {
                // Populate form for editing
                let firstName = contact.firstName || '';
                let lastName = contact.lastName || '';

                if (!firstName && !lastName && contact.name) {
                    const parts = contact.name.split(' ');
                    firstName = parts[0] || '';
                    lastName = parts.slice(1).join(' ') || '';
                }

                reset({
                    isCompany: contact.isCompany || false,
                    prefix: contact.prefix || '',
                    firstName,
                    middleName: contact.middleName || '',
                    lastName,
                    companyName: contact.companyName || '',
                    title: contact.title || '',
                    dob: contact.dob || '',
                    emails: (contact.emails && contact.emails.length > 0 ? contact.emails : [{ address: contact.email || '', type: 'Work', isPrimary: true }]) as any,
                    phones: (contact.phones && contact.phones.length > 0 ? contact.phones : [{ number: contact.phone || '', type: 'Work', isPrimary: true }]) as any,
                    websites: (contact.websites || []) as any,
                    addresses: (contact.addresses || []) as any,
                    type: contact.type,
                    notes: contact.notes || '',
                    photoUrl: contact.photoUrl || null,
                });
                setPhotoPreview(contact.photoUrl || null);
            } else {
                // Reset for new contact
                reset({
                    isCompany: false,
                    prefix: '',
                    firstName: '',
                    middleName: '',
                    lastName: '',
                    companyName: '',
                    title: '',
                    dob: '',
                    emails: [{ address: '', type: 'Work', isPrimary: true }],
                    phones: [{ number: '', type: 'Work', isPrimary: true }],
                    websites: [],
                    addresses: [],
                    type: 'Client',
                    notes: '',
                    photoUrl: null,
                });
                setPhotoPreview(null);
            }
        }
    }, [isOpen, contact, reset]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPhotoPreview(result);
                setValue('photoUrl', result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = (data: ContactFormData) => {
        const displayName = data.isCompany ? data.companyName! : `${data.firstName} ${data.lastName}`;
        const primaryEmail = data.emails.find(e => e.isPrimary)?.address || data.emails[0]?.address || '';
        const primaryPhone = data.phones.find(p => p.isPrimary)?.number || data.phones[0]?.number || '';

        const newContact: Contact = {
            id: contact ? contact.id : `CON_${Date.now()}`,
            name: displayName,
            email: primaryEmail,
            phone: primaryPhone,
            type: data.type,
            associatedMatters: contact ? contact.associatedMatters : [],
            hasPortalAccess: contact ? contact.hasPortalAccess : false,
            isCompany: data.isCompany,
            prefix: data.prefix,
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            companyName: data.companyName,
            title: data.title,
            dob: data.dob,
            emails: data.emails.filter(e => e.address),
            phones: data.phones.filter(p => p.number),
            websites: data.websites.filter(w => w.url),
            addresses: data.addresses,
            notes: data.notes,
            photoUrl: data.photoUrl || undefined,
        };

        if (contact && onUpdateContact) {
            onUpdateContact(newContact);
        } else {
            onAddContact(newContact);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl transform transition-all my-8">
                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">{contact ? 'Edit Contact' : 'New Contact'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
                        <div className="p-6 space-y-8 max-h-[75vh] overflow-y-auto">

                            <ConflictAlert
                                name={methods.watch('isCompany') ? methods.watch('companyName') || '' : `${methods.watch('firstName') || ''} ${methods.watch('lastName') || ''}`.trim()}
                                excludeId={contact?.id}
                            />

                            <ContactBasicInfo form={methods} photoPreview={photoPreview} onPhotoChange={handlePhotoChange} />

                            <ContactContactInfo form={methods} />

                            <ContactAddressInfo form={methods} />

                            <hr className="border-slate-200" />

                            {/* Section 6: Custom Fields */}
                            <section>
                                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                                    <span className="mr-2 text-slate-800">▼</span> Custom fields <span className="ml-2 text-sm font-normal text-slate-500">Required fields</span>
                                </h3>
                                <p className="text-sm text-slate-600 mb-3">Speed up your workflow by <a href="#" className="text-blue-600 underline">creating custom field sets</a> for often-used custom fields.</p>
                                <select className="w-full md:w-1/3 bg-white border border-slate-300 text-slate-900 rounded px-3 py-2">
                                    <option>Add a custom field or custom field ...</option>
                                </select>
                            </section>

                            <hr className="border-slate-200" />

                            {/* Section 7: General */}
                            <section>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><span className="mr-2">▼</span> General</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Type <span className="text-red-500">*</span></label>
                                        <select {...methods.register('type')} className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2">
                                            <option value="Client">Client</option>
                                            <option value="Witness">Witness</option>
                                            <option value="Counsel">Counsel</option>
                                            <option value="Potential Client">Potential Client</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes About Contact</label>
                                        <textarea
                                            rows={4}
                                            {...methods.register('notes')}
                                            className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section 8: Tags */}
                            <section className="border-t border-slate-200 pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-slate-800">Tags</h3>
                                    <button type="button" className="px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50">Manage tags</button>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4 flex items-start">
                                    <div className="text-blue-500 mr-3 mt-0.5">ℹ</div>
                                    <p className="text-sm text-blue-800">Add up to 50 tags to a contact for easier searching, filtering, and categorization. The tags will appear on a contact's dashboard, the contacts table, related contacts section in a matter's dashboard, and contact selector drop-downs. <a href="#" className="underline">How do I manage my contact tags?</a></p>
                                </div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contact tags</label>
                                <input type="text" placeholder="Search contact tags" className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2" />
                            </section>

                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl sticky bottom-0 z-10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                            >
                                {contact ? 'Save Changes' : 'Save Contact'}
                            </button>
                        </div>
                    </form>
                </FormProvider>
            </div>
        </div>
    );
};

export default AddContactModal;
