import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ContactFormData } from '../../schemas/contactSchema';
import { UserCircleIcon, BuildingOfficeIcon } from '../icons';

interface ContactBasicInfoProps {
    form: UseFormReturn<ContactFormData>;
    photoPreview: string | null;
    onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ContactBasicInfo: React.FC<ContactBasicInfoProps> = ({ form, photoPreview, onPhotoChange }) => {
    const { register, watch, setValue, formState: { errors } } = form;
    const isCompany = watch('isCompany');

    return (
        <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Contact information</h3>

            <div className="mb-6">
                <label className="block text-sm text-slate-700 mb-2">Is this contact a person or a company?</label>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setValue('isCompany', false)}
                        className={`flex items-center px-4 py-2 rounded border ${!isCompany ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-slate-300 text-slate-600'}`}
                    >
                        <UserCircleIcon className="w-5 h-5 mr-2" /> Person
                    </button>
                    <button
                        type="button"
                        onClick={() => setValue('isCompany', true)}
                        className={`flex items-center px-4 py-2 rounded border ${isCompany ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-white border-slate-300 text-slate-600'}`}
                    >
                        <BuildingOfficeIcon className="w-5 h-5 mr-2" /> Company
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                    {!isCompany && (
                        <>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Prefix</label>
                                    <input {...register('prefix')} className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">First name <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('firstName')}
                                        className={`w-full bg-white border ${errors.firstName ? 'border-red-500' : 'border-slate-300'} text-slate-900 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    />
                                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Middle name</label>
                                    <input {...register('middleName')} className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Last name <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('lastName')}
                                        className={`w-full bg-white border ${errors.lastName ? 'border-red-500' : 'border-slate-300'} text-slate-900 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    />
                                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{isCompany ? 'Company Name' : 'Company'} {isCompany && <span className="text-red-500">*</span>}</label>
                        <input
                            {...register('companyName')}
                            placeholder="What's the company's name?"
                            className={`w-full bg-white border ${errors.companyName ? 'border-red-500' : 'border-slate-300'} text-slate-900 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                        {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input {...register('title')} className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date of birth</label>
                            <div className="relative">
                                <input type="date" {...register('dob')} className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-48 flex flex-col items-center">
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">Profile photo</label>
                    <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200 mb-3 overflow-hidden">
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <UserCircleIcon className="w-16 h-16 text-slate-300" />
                        )}
                    </div>
                    <label className="cursor-pointer text-blue-600 text-sm hover:underline font-medium flex items-center">
                        Upload photo
                        <input
                            type="file"
                            accept="image/*"
                            onChange={onPhotoChange}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>
        </section>
    );
};

export default ContactBasicInfo;
