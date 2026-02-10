import React from 'react';

export const Card = ({ children, className = '' }: { children?: React.ReactNode, className?: string }) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  );
};