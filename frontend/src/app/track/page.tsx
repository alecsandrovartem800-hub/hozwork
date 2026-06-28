'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { Order, STATUS_LABELS, STATUS_EMOJI } from '@/types';
import { Suspense } from 'react';

const STEPS = ['pending', 'assigned', 'preparing', 'ready', 'serving', 'completed'];
const STEP_LABELS = ['Создан', 'Мастер назначен', 'Готовится', 'Готов', 'Подан', 'Завершён'];
const STEP_ICONS = ['📋', '👨‍🍳', '🔥', '✅', '✨', '🎉'];

function TrackContent() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get('id') || '';
  const [orderId, setOrderId] = useState(idFromUrl);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState(!!idFromUrl);

  const fetchOrder = async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getOrder(id);
      setOrder(data);
      setError('');
    } catch (e: any) {
      setError('Заказ не найден');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idFromUrl) {
      setOrderId(idFromUrl);
      setTracking(true);
      fetchOrder(idFromUrl);
    }
  }, [idFromUrl]);

  useEffect(() => {
    if (!tracking || !orderId) return;
    fetchOrder(orderId);
    const interval = setInterval(() => fetchOrder(orderId), 5000);
    return () => clearInterval(interval);
  }, [tracking, orderId]);

  const handleTrack = () => {
    if (!orderId) return;
    setTracking(true);
    fetchOrder(orderId);
  };

  const currentStepIndex = order ? STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
        Статус заказа
      </h1>

      {/* Search bar */}
      {!tracking && (
        <div className="text-center mt-12 mb-10 animate-fade-in">
          <span className="text-5xl block mb-6 animate-float">📍</span>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Введите ID вашего заказа</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input className="input flex-1" placeholder="ID заказа..." value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()} />
            <button onClick={handleTrack} className="btn-gold" disabled={!orderId}>Найти</button>
          </div>
        </div>
      )}

      {tracking && (
        <>
          <p className="text-center mb-8" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Обновляется каждые 5 секунд •{' '}
            <button onClick={() => { setTracking(false); setOrder(null); setError(''); }}
              className="border-none bg-transparent cursor-pointer underline" style={{ color: 'var(--gold)' }}>
              другой заказ
            </button>
          </p>

          {loading && !order && (
            <div className="card p-8">
              <div className="flex flex-col gap-4">
                {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
              </div>
            </div>
          )}

          {error && (
            <div className="card p-12 text-center">
              <span className="text-5xl block mb-4">❌</span>
              <p className="text-lg font-medium mb-2">{error}</p>
              <button onClick={() => { setTracking(false); setError(''); }} className="btn-gold mt-4">Попробовать другой ID</button>
            </div>
          )}

          {order && !error && (
            <>
              {/* Status timeline */}
              <div className="card p-8 mb-6 animate-fade-in">
                {isCancelled ? (
                  <div className="text-center py-6">
                    <span className="text-5xl block mb-4">❌</span>
                    <p className="text-xl font-semibold" style={{ color: 'var(--danger)' }}>Заказ отменён</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {STEPS.map((step, i) => {
                      const isCompleted = currentStepIndex >= i;
                      const isCurrent = currentStepIndex === i;
                      return (
                        <div key={step} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${isCurrent ? 'animate-pulse-slow' : ''}`}
                              style={{
                                background: isCompleted ? 'rgba(212,165,116,0.2)' : 'rgba(255,255,255,0.03)',
                                border: `2px solid ${isCompleted ? 'var(--gold)' : 'var(--border)'}`,
                                boxShadow: isCurrent ? '0 0 20px rgba(212,165,116,0.3)' : 'none',
                              }}>
                              {isCompleted ? STEP_ICONS[i] : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</span>}
                            </div>
                            {i < STEPS.length - 1 && (
                              <div className="w-0.5 h-8 transition-all duration-500" style={{ background: currentStepIndex > i ? 'var(--gold)' : 'var(--border)' }} />
                            )}
                          </div>
                          <div className="pt-2">
                            <p className="font-medium text-sm" style={{ color: isCompleted ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {STEP_LABELS[i]}
                            </p>
                            {isCurrent && <p className="text-xs mt-0.5" style={{ color: 'var(--gold)' }}>← сейчас</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order details */}
              <div className="card p-6 mb-6 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold-light)', fontFamily: "'Playfair Display', serif" }}>
                  Детали заказа
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>Гость</span>
                    <span className="font-medium">{order.guest_name}</span>
                  </div>
                  {order.table_number && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>Стол</span>
                      <span className="font-medium">#{order.table_number}</span>
                    </div>
                  )}
                  {order.master && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>Мастер</span>
                      <span className="font-medium" style={{ color: 'var(--gold)' }}>👨‍🍳 {order.master.name}</span>
                    </div>
                  )}
                  {order.liquid && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>Жидкость</span>
                      <span className="font-medium">{order.liquid.icon} {order.liquid.name}</span>
                    </div>
                  )}
                  {order.total_price > 0 && (
                    <div className="flex justify-between text-sm pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Стоимость</span>
                      <span className="font-bold" style={{ color: 'var(--gold)' }}>{order.total_price}₽</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mix */}
              {order.items && order.items.length > 0 && (
                <div className="card p-6 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold-light)', fontFamily: "'Playfair Display', serif" }}>
                    🍃 Состав микса
                  </h3>
                  <div className="flex flex-col gap-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <span>
                          <span style={{ color: 'var(--gold-dark)' }}>{item.flavor?.brand?.name}</span> {item.flavor?.name}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{item.grams}г</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {order.estimated_wait_minutes && order.status === 'pending' && (
                <div className="card p-4 mt-6 text-center" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <p className="text-sm" style={{ color: 'var(--warning)' }}>
                    ⏱ Расчётное время ожидания: ~{order.estimated_wait_minutes} мин
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <>
      <Header />
      <main className="pt-20 pb-16 min-h-screen">
        <Suspense fallback={<div className="text-center pt-32"><div className="skeleton h-12 w-48 mx-auto rounded-xl" /></div>}>
          <TrackContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
