'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/auth';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

export default function AccountPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error('Сессия не найдена');

        const data = await api.orders.list(token);
        // orders.list возвращает { total, page, size, items }
        setOrders(data.items || []);
      } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        toast.error('Не удалось загрузить список заказов');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, router, supabase]);

  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Сессия не найдена');

      const blob = await api.reports.invoice(orderId, token);
      
      // Создаем ссылку для скачивания файла
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${orderId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Накладная успешно скачана');
    } catch (error: any) {
      console.error('Ошибка скачивания накладной:', error);
      toast.error('Не удалось скачать накладную');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 font-sans">Личный кабинет</h1>
            <p className="text-sm text-gray-500">Добро пожаловать, <span className="font-bold text-gray-800">{user.email}</span></p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="secondary"
            className="sm:w-auto font-semibold border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 cursor-pointer"
          >
            Выйти из аккаунта
          </Button>
        </div>

        {/* Orders list */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Ваши заказы</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            <Card hoverEffect={false} className="py-16 text-center text-gray-400 space-y-4">
              <p className="text-sm font-medium">У вас пока нет оформленных заказов.</p>
              <Link href="/catalog" className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 rounded-xl">
                За покупками
              </Link>
            </Card>
          ) : (
            <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4">№ Заказа</th>
                    <th className="px-6 py-4">Дата оформления</th>
                    <th className="px-6 py-4">Статус</th>
                    <th className="px-6 py-4 text-right">Сумма</th>
                    <th className="px-6 py-4 text-right">Залог (30%)</th>
                    <th className="px-6 py-4 text-center">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 font-mono">
                        #{order.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-gray-900">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-orange-600">
                        {formatPrice(order.deposit_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2.5">
                          <Link href={`/chat/${order.id}`}>
                            <Button size="sm" variant="secondary" className="cursor-pointer">
                              💬 Чат
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="secondary"
                            isLoading={downloadingId === order.id}
                            onClick={() => handleDownloadInvoice(order.id)}
                            className="cursor-pointer"
                          >
                            📄 Накладная
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Business Rule banner */}
        <Card hoverEffect={false} className="bg-red-50/40 border border-red-100 p-5 rounded-2xl flex items-start space-x-3 text-red-950">
          <span className="text-xl">🛡️</span>
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Ограничение по отмене и возвратам</h4>
            <p className="text-xs text-red-800/80 leading-relaxed">
              Все заказы поступают в работу сразу же после оплаты залогового платежа (предоплаты). По этой причине товары в заказах обмену, возврату и отмене не подлежат. В случае возникновения вопросов по качеству, пишите в чат заказа для связи с администратором.
            </p>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
