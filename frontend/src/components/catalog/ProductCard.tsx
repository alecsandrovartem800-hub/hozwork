'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { formatPrice, calculateDeposit } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`Товар "${product.name}" добавлен в корзину`);
  };

  const depositAmount = calculateDeposit(product.price, product.deposit_percent);

  // Плейсхолдер изображения, если image_url отсутствует
  const displayImage = product.image_url || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600';

  return (
    <div 
      onClick={() => router.push(`/product/${product.id}`)}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full group"
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50 border-b border-gray-50">
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Deposit overlay badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="deposit">
            Залог: {formatPrice(depositAmount)} ({product.deposit_percent}%)
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow space-y-3">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-green-700 tracking-wider uppercase">
            {product.category || 'Хозтовары'}
          </span>
          <h4 className="text-base font-bold text-gray-900 group-hover:text-green-700 line-clamp-1 transition-colors">
            {product.name}
          </h4>
          <p className="text-xs text-gray-500 line-clamp-2 min-h-[2rem]">
            {product.description || 'Качественный хозяйственный товар для профессионального использования.'}
          </p>
        </div>

        {/* Pricing and Action */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium">Цена</span>
            <span className="text-lg font-black text-gray-900">{formatPrice(product.price)}</span>
          </div>
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="rounded-xl px-4 py-2 font-semibold bg-green-700 hover:bg-green-800 text-white cursor-pointer"
          >
            В корзину
          </Button>
        </div>
      </div>
    </div>
  );
}
