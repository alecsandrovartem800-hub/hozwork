'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { DashboardData, STATUS_LABELS, STATUS_EMOJI } from '@/types';

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    api.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>Дашборд</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!data) return <div style={{ color: 'var(--danger)' }}>Ошибка загрузки данных</div>;

  const kpis = [
    { label: 'Заказов сегодня', value: data.today.orders, icon: '🔥', accent: 'var(--gold)', sub: `${data.today.active} активных` },
    { label: 'Выручка', value: `${data.today.revenue.toLocaleString('ru-RU')}₽`, icon: '💰', accent: 'var(--success)', sub: `${data.today.completed} выполнено` },
    { label: 'Мастера', value: `${data.masters.free}/${data.masters.total}`, icon: '👨‍🍳', accent: 'var(--info)', sub: `${data.masters.busy} заняты` },
    { label: 'Низкий запас', value: data.tobacco.lowStock.length, icon: '⚠️', accent: 'var(--warning)', sub: `${data.tobacco.pendingRestocks} заявок` },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>Дашборд</h1>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Обновлено: {new Date().toLocaleTimeString('ru-RU')}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {kpis.map((kpi, i) => (
          <div key={i} className="card p-5" style={{ borderLeft: `3px solid ${kpi.accent}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{kpi.icon}</span>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${kpi.accent}20`, color: kpi.accent }}>
                {kpi.sub}
              </span>
            </div>
            <p className="text-2xl font-bold mb-1 animate-fade-in" style={{ color: kpi.accent }}>{kpi.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold-light)', fontFamily: "'Playfair Display', serif" }}>
            Последние заказы
          </h2>
          <div className="flex flex-col gap-3">
            {data.recentOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Нет заказов</p>
            ) : (
              data.recentOrders.slice(0, 8).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <span>{STATUS_EMOJI[order.status] || '⚪'}</span>
                    <div>
                      <p className="text-sm font-medium">{order.guest_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {order.items?.length || 0} вкусов • {order.master?.name || 'Нет мастера'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge badge-${order.status} text-xs`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    {order.total_price > 0 && (
                      <p className="text-xs mt-1 font-medium" style={{ color: 'var(--gold)' }}>{order.total_price}₽</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Masters Status */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold-light)', fontFamily: "'Playfair Display', serif" }}>
            👨‍🍳 Мастера
          </h2>
          <div className="flex flex-col gap-3">
            {data.masters.list.map((master) => {
              const statusColors: Record<string, string> = { free: 'var(--success)', busy: 'var(--danger)', offline: 'var(--text-muted)' };
              const statusLabels: Record<string, string> = { free: 'Свободен', busy: 'Занят', offline: 'Офлайн' };

              return (
                <div key={master.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: statusColors[master.status] }} />
                    <span className="text-sm font-medium">{master.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs" style={{ color: statusColors[master.status] }}>{statusLabels[master.status]}</span>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Сегодня: {master.completed_today}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Low stock alerts */}
          {data.tobacco.lowStock.length > 0 && (
            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--warning)' }}>⚠️ Низкий запас</h3>
              {data.tobacco.lowStock.slice(0, 5).map((flavor) => (
                <div key={flavor.id} className="flex justify-between text-xs py-1.5">
                  <span style={{ color: 'var(--text-secondary)' }}>{(flavor as any).brand?.name} {flavor.name}</span>
                  <span style={{ color: 'var(--danger)' }}>{Math.round(flavor.stock_grams)}г</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
