import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'deposit';
  className?: string;
}

export function Badge({ children, variant = 'info', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        {
          'bg-green-50 text-green-700 border-green-200': variant === 'success',
          'bg-yellow-50 text-yellow-800 border-yellow-200': variant === 'warning',
          'bg-red-50 text-red-700 border-red-200': variant === 'danger',
          'bg-blue-50 text-blue-700 border-blue-200': variant === 'info',
          'bg-orange-50 text-orange-700 border-orange-200': variant === 'deposit',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
