'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCartStore } from '@/store/cart';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { Card } from '@/components/ui/Card';

export default function CartPage() {
  const items = useCartStore((state) => state.items);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <h1 className="text-3xl font-black text-gray-900">Корзина покупок</h1>

        {items.length === 0 ? (
          <Card hoverEffect={false} className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-gray-50 flex items-center justify-center rounded-full text-gray-400">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-xl font-bold text-gray-900">Ваша корзина пуста</h3>
              <p className="text-sm text-gray-500">Похоже, вы еще ничего не добавили в корзину. Самое время заглянуть в наш каталог!</p>
            </div>
            <Link href="/catalog" className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-green-700 hover:bg-green-800 transition-colors shadow-sm">
              Перейти в каталог
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
              <div className="pt-2">
                <Link href="/catalog" className="text-sm font-semibold text-green-700 hover:text-green-800 flex items-center space-x-1">
                  <span>&larr;</span>
                  <span>Продолжить покупки</span>
                </Link>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <CartSummary />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
