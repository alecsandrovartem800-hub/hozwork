'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
        {
          // Variants
          'bg-green-700 hover:bg-green-800 text-white focus:ring-green-600 shadow-sm hover:shadow': variant === 'primary',
          'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-gray-400': variant === 'secondary',
          'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm': variant === 'danger',
          'hover:bg-gray-100 text-gray-700 focus:ring-gray-300': variant === 'ghost',
          
          // Sizes
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-5 py-2.5 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
          
          'w-full': fullWidth,
        },
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <Spinner className={variant === 'secondary' || variant === 'ghost' ? 'text-gray-700' : 'text-white'} size="sm" />
          <span>Загрузка...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
