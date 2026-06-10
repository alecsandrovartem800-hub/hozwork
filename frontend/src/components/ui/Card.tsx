import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function Card({ children, className, hoverEffect = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-gray-100 rounded-2xl p-6',
        hoverEffect ? 'premium-card' : 'shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
