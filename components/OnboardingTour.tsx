
import React from 'react';
import { XMarkIcon, ScaleIcon } from './icons';

interface OnboardingTourProps {
  onClose: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all text-center p-8">
        <ScaleIcon className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-2xl font-bold mt-4 text-slate-800">Welcome to CaseFlow!</h2>
        <p className="text-slate-500 mt-2">
          This is your central dashboard for managing your legal practice.
          Explore matters, track tasks, and streamline your billing.
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default OnboardingTour;
