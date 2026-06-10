'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { Card } from '@/components/ui/Card';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { cn, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

export default function AdminChatsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('order_id') || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    // Sync with query param changes if any (e.g. clicking 'Чат' in orders page redirect)
    if (initialOrderId) {
      setSelectedOrderId(initialOrderId);
    }
  }, [initialOrderId]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error('Сессия не найдена');

        const response = await api.orders.list(token);
        setOrders(response.items || []);
        
        // По умолчанию выбираем первый заказ, если не передан конкретный
        if (response.items?.length > 0 && !initialOrderId) {
          setSelectedOrderId(response.items[0].id);
        }
      } catch (error) {
        console.error('Ошибка загрузки чатов заказов:', error);
        toast.error('Не удалось загрузить чаты');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [supabase, initialOrderId]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    // Обновляем URL параметры без перезагрузки
    router.replace(`/admin/chats?order_id=${orderId}`);
  };

  return (
    <div className="flex h-[calc(100vh-160px)] gap-6 animate-fade-in font-sans">
      {/* Sidebar List */}
      <Card hoverEffect={false} className="w-80 p-0 flex flex-col overflow-hidden border border-gray-100 bg-white">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Каналы чатов по заказам</h3>
          <p className="text-xs text-gray-400">Выберите заказ для общения с клиентом</p>
        </div>
        
        <div className="flex-grow overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400">Нет доступных заказов с чатами.</div>
          ) : (
            orders.map((o) => {
              const isSelected = o.id === selectedOrderId;
              return (
                <div
                  key={o.id}
                  onClick={() => handleSelectOrder(o.id)}
                  className={cn(
                    'p-4 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col space-y-1',
                    isSelected && 'bg-green-50/70 border-l-4 border-green-700 hover:bg-green-50/70'
                  )}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-900 font-mono">#{o.id.substring(0, 8)}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(o.created_at).split('в')[0]}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-semibold truncate">{o.email}</span>
                  <span className="text-[10px] text-gray-400 truncate">Сумма: {o.total_amount} ₽</span>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {selectedOrderId ? (
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-bold text-gray-900">Чат поддержки по заказу #{selectedOrderId.substring(0, 8)}</h3>
                <p className="text-xs text-gray-500">
                  Владелец: {orders.find((o) => o.id === selectedOrderId)?.email || 'Загрузка...'}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-0">
              <ChatWindow orderId={selectedOrderId} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm font-semibold">Выберите чат из списка слева для начала общения.</p>
          </div>
        )}
      </div>
    </div>
  );
}
