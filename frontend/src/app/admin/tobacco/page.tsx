'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { TobaccoFlavor, RestockRequest, CATEGORY_LABELS } from '@/types';

export default function AdminTobaccoPage() {
  const [flavors, setFlavors] = useState<TobaccoFlavor[]>([]);
  const [restocks, setRestocks] = useState<RestockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'stock' | 'requests'>('stock');
  const [addStockModal, setAddStockModal] = useState<{ id: number; name: string } | null>(null);
  const [addGrams, setAddGrams] = useState('250');

  const fetchData = () => {
    Promise.all([api.getFlavors(true), api.getRestockRequests()])
      .then(([f, r]) => { setFlavors(f); setRestocks(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddStock = async () => {
    if (!addStockModal) return;
    try {
      await api.addStock(addStockModal.id, parseFloat(addGrams));
      setAddStockModal(null);
      setAddGrams('250');
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleFulfill = async (id: number) => {
    try {
      await api.fulfillRestock(id);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleDismiss = async (id: number) => {
    try {
      await api.dismissRestock(id);
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const handleToggleVisibility = async (id: number, visible: boolean) => {
    try {
      await api.updateFlavor(id, { is_visible: visible });
      fetchData();
    } catch (e: any) { alert(e.message); }
  };

  const stockLevel = (grams: number) => grams > 200 ? 'green' : grams > 100 ? 'yellow' : 'red';
  const stockPercent = (grams: number) => Math.min(100, (grams / 500) * 100);

  const pendingRestocks = restocks.filter((r) => r.status === 'pending');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
        🍃 Управление табаками
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('stock')}
          className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-all"
          style={{ background: tab === 'stock' ? 'var(--gold)' : 'rgba(255,255,255,0.04)', color: tab === 'stock' ? '#0a0a0a' : 'var(--text-secondary)' }}>
          Запасы ({flavors.length})
        </button>
        <button onClick={() => setTab('requests')}
          className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-all relative"
          style={{ background: tab === 'requests' ? 'var(--gold)' : 'rgba(255,255,255,0.04)', color: tab === 'requests' ? '#0a0a0a' : 'var(--text-secondary)' }}>
          Заявки {pendingRestocks.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center" style={{ background: 'var(--danger)', color: 'white' }}>
              {pendingRestocks.length}
            </span>
          )}
        </button>
      </div>

      {loading && <div className="skeleton h-64 rounded-2xl" />}

      {/* Stock Tab */}
      {!loading && tab === 'stock' && (
        <div className="flex flex-col gap-3 stagger-children">
          {flavors.map((flavor) => (
            <div key={flavor.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{flavor.brand?.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                    <span className="text-sm font-semibold">{flavor.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,165,116,0.1)', color: 'var(--gold)' }}>
                      {CATEGORY_LABELS[flavor.category] || flavor.category}
                    </span>
                    {!flavor.is_visible && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
                        Скрыт
                      </span>
                    )}
                  </div>

                  {/* Stock bar */}
                  <div className="flex items-center gap-3">
                    <div className={`progress-bar flex-1 progress-${stockLevel(flavor.stock_grams)}`}>
                      <div className="progress-bar-fill" style={{ width: `${stockPercent(flavor.stock_grams)}%` }} />
                    </div>
                    <span className="text-xs font-medium w-12 text-right" style={{
                      color: stockLevel(flavor.stock_grams) === 'red' ? 'var(--danger)' : stockLevel(flavor.stock_grams) === 'yellow' ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {Math.round(flavor.stock_grams)}г
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setAddStockModal({ id: flavor.id, name: `${flavor.brand?.name} ${flavor.name}` })}
                    className="btn-success btn-sm text-xs">+ Пополнить</button>
                  <button onClick={() => handleToggleVisibility(flavor.id, !flavor.is_visible)}
                    className="btn-outline btn-sm text-xs" style={{ borderColor: flavor.is_visible ? 'var(--border)' : 'var(--warning)' }}>
                    {flavor.is_visible ? '👁 Скрыть' : '👁 Показать'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requests Tab */}
      {!loading && tab === 'requests' && (
        <div className="flex flex-col gap-3 stagger-children">
          {restocks.length === 0 ? (
            <div className="card p-12 text-center">
              <span className="text-5xl block mb-4">✅</span>
              <p style={{ color: 'var(--text-muted)' }}>Нет заявок на пополнение</p>
            </div>
          ) : (
            restocks.map((req) => (
              <div key={req.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">{req.brand_name} — {req.flavor_name}</h3>
                    <div className="flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>Остаток: <span style={{ color: 'var(--danger)' }}>{Math.round(req.current_stock_grams)}г</span></span>
                      <span>Запрошено: {req.requested_grams}г</span>
                      <span>{new Date(req.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button onClick={() => handleFulfill(req.id)} className="btn-success btn-sm text-xs">
                          ✅ Добавить в наличие
                        </button>
                        <button onClick={() => handleDismiss(req.id)} className="btn-danger btn-sm text-xs">
                          Отклонить
                        </button>
                      </>
                    ) : (
                      <span className={`badge badge-${req.status === 'fulfilled' ? 'completed' : 'cancelled'} text-xs`}>
                        {req.status === 'fulfilled' ? '✅ Выполнена' : req.status === 'dismissed' ? '❌ Отклонена' : req.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Stock Modal */}
      {addStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setAddStockModal(null)}>
          <div className="card p-8 max-w-sm w-full mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gold-light)' }}>Пополнить запас</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{addStockModal.name}</p>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Количество (г)</label>
            <input className="input mb-4" type="number" value={addGrams} onChange={(e) => setAddGrams(e.target.value)} min="1" />
            <div className="flex gap-3">
              <button onClick={handleAddStock} className="btn-gold flex-1">Добавить</button>
              <button onClick={() => setAddStockModal(null)} className="btn-outline flex-1">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
