'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ClientProfile } from '@/types';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent'>('orders');

  useEffect(() => {
    api.getClients()
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePriceChange = async (clientId: string, price: number) => {
    try {
      await api.setClientPrice(clientId, price);
      setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, price_tier: price } : c));
    } catch (e: any) { alert(e.message); }
  };

  const filtered = clients
    .filter((c) => !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))
    .sort((a, b) => {
      if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
      if (sortBy === 'orders') return b.total_orders - a.total_orders;
      return b.total_spent - a.total_spent;
    });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
        👥 Клиенты
      </h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <input className="input max-w-xs" placeholder="🔍 Поиск по имени или телефону" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex gap-2">
          {(['orders', 'spent', 'name'] as const).map((s) => (
            <button key={s} onClick={() => setSortBy(s)}
              className="px-3 py-2 rounded-lg text-xs font-medium border-none cursor-pointer transition-all"
              style={{
                background: sortBy === s ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                color: sortBy === s ? '#0a0a0a' : 'var(--text-secondary)',
              }}>
              {s === 'orders' ? 'По заказам' : s === 'spent' ? 'По выручке' : 'По имени'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-5xl block mb-4">👥</span>
          <p style={{ color: 'var(--text-muted)' }}>Клиенты не найдены</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 stagger-children">
          {filtered.map((client) => (
            <div key={client.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold mb-1">{client.full_name || 'Без имени'}</h3>
                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {client.phone && <span>📱 {client.phone}</span>}
                    <span>📦 {client.total_orders} заказов</span>
                    <span>💰 {client.total_spent.toLocaleString('ru-RU')}₽</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs mr-2" style={{ color: 'var(--text-muted)' }}>Тариф:</span>
                  {[500, 750, 1000].map((price) => (
                    <button key={price} onClick={() => handlePriceChange(client.id, price)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border-none cursor-pointer transition-all"
                      style={{
                        background: client.price_tier === price ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                        color: client.price_tier === price ? '#0a0a0a' : 'var(--text-muted)',
                        border: `1px solid ${client.price_tier === price ? 'var(--gold)' : 'var(--border)'}`,
                      }}>
                      {price}₽
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
