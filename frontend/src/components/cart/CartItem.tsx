'use client';

import React from 'react';
import { CartItem as CartItemType } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { Badge } from '@/components/ui/Badge';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { product, quantity } = item;
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const displayImage = product.image_url || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=300';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl gap-4">
      {/* Product info */}
      <div className="flex items-center space-x-4 flex-grow">
        <img
          src={displayImage}
          alt={product.name}
          className="w-16 h-16 object-cover rounded-xl bg-gray-50 border border-gray-100"
        />
        <div className="space-y-1">
          <h4 className="text-base font-bold text-gray-900">{product.name}</h4>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-500">{formatPrice(product.price)} / шт.</span>
            <Badge variant="deposit">
              Залог: {formatPrice(Math.round(product.price * product.deposit_percent / 100))} (30%)
            </Badge>
          </div>
        </div>
      </div>

      {/* Quantity controls & Total */}
      <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-8 border-t sm:border-t-0 pt-3 sm:pt-0">
        {/* Quantity Controls */}
        <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
          <button
            onClick={() => updateQuantity(product.id, quantity - 1)}
            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors font-bold cursor-pointer"
          >
            -
          </button>
          <span className="px-4 text-sm font-bold text-gray-900">{quantity}</span>
          <button
            onClick={() => updateQuantity(product.id, quantity + 1)}
            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors font-bold cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Item total */}
        <div className="flex flex-col items-end min-w-[5rem]">
          <span className="text-sm text-gray-400 font-medium">Итого</span>
          <span className="text-base font-black text-gray-900">{formatPrice(product.price * quantity)}</span>
        </div>

        {/* Delete button */}
        <button
          onClick={() => removeItem(product.id)}
          className="text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
