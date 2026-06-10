'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { Order, OrderStatus } from '@/types';
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Сессия не найдена');

      const data = await api.orders.list(token);
      setOrders(data.items || []);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      toast.error('Не удалось загрузить список заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Сессия не найдена');

      await api.orders.updateStatus(orderId, newStatus, token);
      toast.success(`Статус заказа успешно изменен на "${getStatusLabel(newStatus)}"`);
      
      // Обновляем список локально
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (error: any) {
      console.error('Ошибка изменения статуса:', error);
      toast.error(error.message || 'Не удалось изменить статус заказа');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Сессия не найдена');

      const blob = await api.reports.invoice(orderId, token);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${orderId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Накладная успешно загружена');
    } catch (error) {
      console.error('Ошибка накладной:', error);
      toast.error('Не удалось загрузить накладную');
    } finally {
      setDownloadingId(null);
    }
  };

  const statuses: OrderStatus[] = [
    'pending',
    'deposit_paid',
    'processing',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
    'refunded',
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Управление заказами</h1>
        <p className="text-sm text-gray-500">Просмотр заказов, изменение статусов и скачивание товарных накладных в PDF</p>
      </div>

      {/* Orders List Table */}
      <Card hoverEffect={false} className="p-0 overflow-hidden border border-gray-100 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Заказы отсутствуют.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">№ Заказа</th>
                  <th className="px-6 py-4">Клиент</th>
                  <th className="px-6 py-4">Дата оформления</th>
                  <th className="px-6 py-4 text-right">Сумма</th>
                  <th className="px-6 py-4 text-right">Залог (30%)</th>
                  <th className="px-6 py-4">Статус заказа</th>
                  <th className="px-6 py-4 text-center">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 font-mono">
                      #{order.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{order.email}</span>
                        <span className="text-xs text-gray-400 font-medium">Тел: {order.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-orange-600">
                      {formatPrice(order.deposit_amount)}
                    </td>
                    <td className="px-6 py-4">
                      {updatingId === order.id ? (
                        <div className="w-5 h-5 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={`bg-white border rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-700/20 ${getStatusColor(order.status)}`}
                        >
                          {statuses.map((st) => (
                            <option key={st} value={st} className="bg-white text-gray-800 font-normal">
                              {getStatusLabel(st)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2.5">
                        <Link href={`/admin/chats?order_id=${order.id}`}>
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
      </Card>
    </div>
  );
}
