'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Order, Master, STATUS_LABELS, STATUS_EMOJI } from '@/types';

const TABS = [
  { key: '', label: 'Все' },
  { key: 'pending', label: 'Ожидают' },
  { key: 'assigned,preparing', label: 'В работе' },
  { key: 'ready,serving', label: 'Готовы' },
  { key: 'completed', label: 'Завершённые' },
  { key: 'cancelled', label: 'Отменённые' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');

  const fetchData = () => {
    Promise.all([api.getOrders(tab || undefined), api.getMasters()])
      .then(([o, m]) => { setOrders(o.orders || []); setMasters(m); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [tab]);
  useEffect(() => { const i = setInterval(fetchData, 10000); return () => clearInterval(i); }, [tab]);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handlePriceChange = async (orderId: string, price: number) => {
    try {
      await api.setOrderPrice(orderId, price);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
        📦 Управление заказами
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setLoading(true); }}
            className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-all"
            style={{
              background: tab === t.key ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
              color: tab === t.key ? '#0a0a0a' : 'var(--text-secondary)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="card p-12 text-center">
          <span className="text-5xl block mb-4">📭</span>
          <p style={{ color: 'var(--text-muted)' }}>Нет заказов</p>
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-4 stagger-children">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg">{STATUS_EMOJI[order.status]}</span>
                    <h3 className="text-base font-semibold">{order.guest_name}</h3>
                    <span className={`badge badge-${order.status} text-xs`}>{STATUS_LABELS[order.status]}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {order.table_number && <span>🪑 Стол {order.table_number}</span>}
                    <span>⏰ {new Date(order.created_at).toLocaleString('ru-RU')}</span>
                    {order.master && <span>👨‍🍳 {order.master.name}</span>}
                  </div>
                </div>

                {/* Price tier buttons */}
                <div className="flex items-center gap-1">
                  {[500, 750, 1000].map((price) => (
                    <button key={price} onClick={() => handlePriceChange(order.id, price)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer transition-all"
                      style={{
                        background: order.price_tier === price ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                        color: order.price_tier === price ? '#0a0a0a' : 'var(--text-muted)',
                        border: `1px solid ${order.price_tier === price ? 'var(--gold)' : 'var(--border)'}`,
                      }}>
                      {price}₽
                    </button>
                  ))}
                </div>
              </div>

              {/* Mix */}
              <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex flex-wrap gap-2">
                  {order.items?.map((item) => (
                    <span key={item.id} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(212,165,116,0.1)', color: 'var(--gold)' }}>
                      {item.flavor?.brand?.name} {item.flavor?.name} ({item.grams}г)
                    </span>
                  ))}
                  {order.liquid && (
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(96,165,250,0.1)', color: 'var(--info)' }}>
                      {order.liquid.icon} {order.liquid.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {order.status === 'pending' && (
                  <>
                    <button onClick={() => handleStatusChange(order.id, 'preparing')} className="btn-success btn-sm">✅ Подтвердить</button>
                    <button onClick={() => handleStatusChange(order.id, 'cancelled')} className="btn-danger btn-sm">❌ Отменить</button>
                  </>
                )}
                {['assigned', 'preparing'].includes(order.status) && (
                  <>
                    <button onClick={() => handleStatusChange(order.id, 'ready')} className="btn-success btn-sm">✅ Готов</button>
                    <button onClick={() => handleStatusChange(order.id, 'cancelled')} className="btn-danger btn-sm">❌ Отменить</button>
                  </>
                )}
                {order.status === 'ready' && (
                  <button onClick={() => handleStatusChange(order.id, 'serving')} className="btn-success btn-sm">✨ Подан</button>
                )}
                {order.status === 'serving' && (
                  <button onClick={() => handleStatusChange(order.id, 'completed')} className="btn-success btn-sm">🎉 Завершить</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
