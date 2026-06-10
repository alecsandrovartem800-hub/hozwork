'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function CartSummary() {
  const router = useRouter();
  const getTotals = useCartStore((state) => state.getTotals);
  const { totalAmount, totalDeposit, itemCount } = getTotals();

  return (
    <Card hoverEffect={false} className="space-y-6 bg-gray-50/50 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900">Итого в корзине</h3>

      <div className="space-y-3 text-sm">
        {/* Count */}
        <div className="flex justify-between text-gray-600">
          <span>Количество товаров</span>
          <span className="font-semibold">{itemCount} шт.</span>
        </div>

        {/* Subtotal */}
        <div className="flex justify-between text-gray-600">
          <span>Общая сумма</span>
          <span className="font-semibold">{formatPrice(totalAmount)}</span>
        </div>

        {/* Deposit */}
        <div className="flex justify-between items-center text-gray-900 border-t border-gray-100 pt-3">
          <div className="flex flex-col">
            <span className="font-bold">Предоплата (Залог)</span>
            <span className="text-xs text-orange-600 font-medium">Оплачивается сразу (30%)</span>
          </div>
          <span className="text-lg font-black text-orange-600">{formatPrice(totalDeposit)}</span>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="bg-orange-50 border border-orange-200/50 rounded-xl p-4 text-xs text-orange-800 leading-relaxed">
        ⚠️ <strong>Внимание!</strong> После оформления заказа и оплаты залога товар обмену и возврату не подлежит.
      </div>

      {/* Action */}
      <Button
        onClick={() => router.push('/checkout')}
        variant="primary"
        fullWidth
        className="py-3 font-bold cursor-pointer"
      >
        Перейти к оформлению
      </Button>
    </Card>
  );
}
