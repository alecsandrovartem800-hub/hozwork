'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotals = useCartStore((state) => state.getTotals);
  const { totalAmount, totalDeposit } = getTotals();
  
  const { user } = useAuthStore();
  const supabase = createClient();

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if empty cart or not logged in
  useEffect(() => {
    if (!user) {
      toast.info('Пожалуйста, авторизуйтесь для оформления заказа');
      router.push('/auth?redirect=/checkout');
    } else if (items.length === 0) {
      toast.info('Ваша корзина пуста');
      router.push('/catalog');
    }
  }, [user, items, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error('Вы должны принять правила отмены заказа');
      return;
    }
    if (!deliveryAddress.trim() || !phone.trim()) {
      toast.error('Пожалуйста, заполните адрес доставки и номер телефона');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Сессия не найдена. Попробуйте перезайти.');
      }

      const orderData = {
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        delivery_address: deliveryAddress.trim(),
        phone: phone.trim(),
        comment: comment.trim(),
      };

      // Вызываем бэкенд для создания заказа и оплаты залога
      const response = await api.orders.create(orderData, token);

      toast.success('Заказ оформлен! Залог оплачен (имитация).');
      clearCart();
      router.push('/account');
    } catch (error: any) {
      console.error('Ошибка создания заказа:', error);
      toast.error(error.message || 'Не удалось оформить заказ. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || items.length === 0) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-black text-gray-900 mb-8">Оформление заказа</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Order Details Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card hoverEffect={false} className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Данные доставки</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Адрес доставки"
                  id="delivery-address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Город, улица, дом, квартира/офис"
                  required
                />
                
                <Input
                  label="Телефон для связи"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  required
                />
                
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="comment" className="text-sm font-medium text-gray-700">
                    Комментарий к заказу (необязательно)
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Например, удобное время доставки, код домофона и т.д."
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition-colors h-24 text-sm"
                  />
                </div>
              </form>
            </Card>

            {/* Checkbox wrapper */}
            <Card hoverEffect={false} className="border border-orange-200/50 bg-orange-50/30 p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 rounded text-green-700 focus:ring-green-700/20 border-gray-300 mt-0.5 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 font-medium select-none cursor-pointer">
                  ✅ Я подтверждаю, что ознакомлен(а) с правилами: товар обмену и возврату не подлежит после оплаты залога
                </label>
              </div>
            </Card>
          </div>

          {/* Cart summary preview */}
          <div className="lg:col-span-1 space-y-6">
            <Card hoverEffect={false} className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Состав заказа</h3>
              <div className="divide-y divide-gray-100 max-h-[250px] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.product.id} className="py-2.5 flex items-center justify-between text-sm">
                    <div className="space-y-0.5 max-w-[70%]">
                      <p className="font-bold text-gray-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-400">{item.quantity} шт. &times; {formatPrice(item.product.price)}</p>
                    </div>
                    <span className="font-black text-gray-900">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Общая сумма</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                
                <div className="flex justify-between items-center text-orange-700 font-extrabold text-base pt-2">
                  <span>Сумма залога (30%)</span>
                  <span>{formatPrice(totalDeposit)}</span>
                </div>
              </div>
              
              <Button
                onClick={handleSubmit}
                isLoading={loading}
                disabled={!termsAccepted || !deliveryAddress.trim() || !phone.trim()}
                variant="primary"
                fullWidth
                className="py-3.5 font-bold mt-4 cursor-pointer"
              >
                Оплатить залог {formatPrice(totalDeposit)}
              </Button>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
