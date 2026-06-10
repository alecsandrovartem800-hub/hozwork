'use client';

import React from 'react';
import { Product } from '@/types';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

interface ProductDetailActionsProps {
  product: Product;
}

export function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`Товар "${product.name}" добавлен в корзину`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
      <Button
        onClick={handleAddToCart}
        size="lg"
        className="font-bold px-8 py-3 bg-green-700 hover:bg-green-800 text-white cursor-pointer"
      >
        Добавить в корзину
      </Button>
    </div>
  );
}
