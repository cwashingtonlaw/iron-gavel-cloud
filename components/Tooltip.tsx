
import React, { useState } from 'react';
import { QuestionMarkCircleIcon } from './icons';

interface TooltipProps {
  text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-flex ml-1.5"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <QuestionMarkCircleIcon className="w-4 h-4 text-slate-400 cursor-pointer" />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs rounded-lg py-1.5 px-2.5 z-10 shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
