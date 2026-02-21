import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white rounded-apple border border-slate-200/60 shadow-apple-sm hover:shadow-apple transition-shadow duration-200 ${className}`} {...props}>
      {children}
    </div>
  );
};