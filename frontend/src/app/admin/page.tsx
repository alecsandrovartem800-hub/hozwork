'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { DashboardData, STATUS_LABELS, STATUS_EMOJI } from '@/types';

// Calendar component helpers
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Adjust for Russian calendar (starts on Monday)
};

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Calendar state
  const [currentDate] = useState(new Date());
  
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
    { label: 'Выручка сегодня', value: `${data.today.revenue.toLocaleString('ru-RU')}₽`, icon: '💰', accent: 'var(--success)', sub: `${data.today.completed} выполнено` },
    { label: 'Клиенты', value: data.clients?.total || 0, icon: '👥', accent: 'var(--info)', sub: 'Всего в базе' },
    { label: 'Низкий запас', value: data.tobacco.lowStock.length, icon: '⚠️', accent: 'var(--warning)', sub: `${data.tobacco.pendingRestocks} заявок` },
  ];

  // Prepare chart data (using mock or data.kpiHistory)
  const history = data.kpiHistory && data.kpiHistory.length > 0
    ? [...data.kpiHistory].reverse()
    : [
        { snapshot_date: 'Пн', total_revenue: 12000 },
        { snapshot_date: 'Вт', total_revenue: 15500 },
        { snapshot_date: 'Ср', total_revenue: 8000 },
        { snapshot_date: 'Чт', total_revenue: 19000 },
        { snapshot_date: 'Пт', total_revenue: 25000 },
        { snapshot_date: 'Сб', total_revenue: 35000 },
        { snapshot_date: 'Вс', total_revenue: 28000 },
      ];

  const maxRevenue = Math.max(...history.map((h: any) => Number(h.total_revenue || 0)), 1000);

  // Generate calendar days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const todayDate = currentDate.getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push({ day: null, isToday: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      day: d,
      isToday: d === todayDate && month === new Date().getMonth() && year === new Date().getFullYear(),
    });
  }

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

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
          <div key={i} className="card p-5 animate-fade-in" style={{ borderLeft: `3px solid ${kpi.accent}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{kpi.icon}</span>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${kpi.accent}20`, color: kpi.accent }}>
                {kpi.sub}
              </span>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: kpi.accent }}>{kpi.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Analytics Chart */}
        <div className="lg:col-span-2 card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--gold-light)', fontFamily: "'Playfair Display', serif" }}>
              📊 Аналитика выручки
            </h2>
            <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>
              Статистика доходов за последние 7 дней
            </p>
          </div>

          <div className="flex items-end justify-between h-48 gap-4 px-2">
            {history.map((h: any, i: number) => {
              const heightPercent = `${Math.min(100, Math.max(10, (Number(h.total_revenue || 0) / maxRevenue) * 100))}%`;
              const formattedDate = h.snapshot_date.includes('T') 
                ? new Date(h.snapshot_date).toLocaleDateString('ru-RU', { weekday: 'short' }) 
                : h.snapshot_date;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="relative w-full flex justify-center">
                    <span className="absolute -top-8 bg-black/80 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ color: 'var(--gold)' }}>
                      {Number(h.total_revenue || 0).toLocaleString('ru-RU')}₽
                    </span>
                  </div>
                  <div
                    className="w-full rounded-t-lg transition-all duration-1000 ease-out"
                    style={{
                      height: heightPercent,
                      background: 'linear-gradient(to top, var(--gold-dark), var(--gold))',
                      boxShadow: '0 0 15px rgba(212,165,116,0.3)',
                    }}
                  />
                  <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>
                    {formattedDate}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lounge Calendar */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--gold-light)', fontFamily: "'Playfair Display', serif" }}>
              📅 Календарь
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              {monthNames[month]} {year}
            </p>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 font-bold" style={{ color: 'var(--text-muted)' }}>
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(d => <span key={d}>{d}</span>)}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map((item, idx) => (
              <div
                key={idx}
                className="py-1.5 rounded-lg font-medium flex items-center justify-center"
                style={{
                  color: item.isToday ? '#0a0a0a' : (item.day ? 'var(--text-primary)' : 'transparent'),
                  background: item.isToday ? 'var(--gold)' : 'transparent',
                  border: item.isToday ? 'none' : '1px solid transparent',
                }}
              >
                {item.day || ''}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 flex flex-col gap-2 text-xxs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
              <span>Сегодня на смене: Алексей, Дмитрий</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--gold)' }} />
              <span>Текущие акции: Вечерний Дым (минус 15% до 19:00)</span>
            </div>
          </div>
        </div>
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
              data.recentOrders.slice(0, 8).map((order: any) => (
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
            {data.masters.list.map((master: any) => {
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
              {data.tobacco.lowStock.slice(0, 5).map((flavor: any) => (
                <div key={flavor.id} className="flex justify-between text-xs py-1.5">
                  <span style={{ color: 'var(--text-secondary)' }}>{flavor.brand?.name} {flavor.name}</span>
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
