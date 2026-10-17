import React from 'react';

export const StaffPulseLogo: React.FC<{ className?: string; onClick?: () => void }> = ({ className = "w-7 h-7", onClick }) => (
  <div onClick={onClick} className={`relative flex items-center justify-center bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white rounded-xl shadow-md ${className} ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}>
    <svg className="w-4 h-4 text-white drop-shadow-xs" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white shadow-xs" />
  </div>
);
