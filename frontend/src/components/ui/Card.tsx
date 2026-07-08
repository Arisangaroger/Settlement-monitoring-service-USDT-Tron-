import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-stone-200/80 bg-white/80 shadow-sm shadow-stone-200/40 backdrop-blur-sm transition-shadow duration-300 hover:shadow-md hover:shadow-stone-200/50 ${className}`}
    >
      {children}
    </div>
  );
}
