'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Order, STATUS_LABELS, STATUS_EMOJI } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [mixes, setMixes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
        return;
      }
      
      try {
        const token = session.access_token;
        const [profile, history, savedMixes] = await Promise.all([
          api.getCurrentUser(token),
          api.getUserOrders(token),
          api.getUserMixes(token)
        ]);
        
        setUser(profile);
        setOrders(history);
        setMixes(savedMixes);
      } catch (e) {
        console.error('Error fetching user profile data:', e);
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleDeleteMix = async (mixId: number) => {
    if (!confirm('Вы действительно хотите удалить этот микс?')) return;
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      
      await api.deleteUserMix(session.access_token, mixId);
      setMixes(mixes.filter(m => m.id !== mixId));
    } catch (e: any) {
      alert('Ошибка при удалении: ' + e.message);
    }
  };

  const handleOrderMix = (mix: any) => {
    // Save mix to localStorage so that order page can retrieve it
    localStorage.setItem('sport_lounge_prefill_mix', JSON.stringify(mix.items.map((i: any) => ({
      flavor_id: i.flavor_id,
      name: i.flavor.name,
      brand: i.flavor.brand?.name || 'Unknown',
      grams: i.grams
    }))));
    router.push('/create');
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <span className="animate-spin inline-block w-8 h-8 rounded-full border-4 border-solid border-current border-t-transparent text-gold mr-3" style={{ color: 'var(--gold)' }} />
            <p className="mt-2 text-sm text-secondary" style={{ color: 'var(--text-secondary)' }}>Загрузка профиля...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 pt-4 animate-fade-in">
          {/* Profile header card */}
          {user && (
            <div className="card p-6 md:p-8 mb-8 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center gap-6 z-10 relative">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full border-2 border-solid" style={{ borderColor: 'var(--gold)' }} />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: 'rgba(255,255,255,0.03)' }}>👤</div>
                )}
                
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-2xl font-bold text-gold-gradient mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {user.name || 'Гость'}
                  </h1>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs">
                    <span className="px-3 py-1 rounded-full" style={{ background: 'rgba(212,165,116,0.1)', color: 'var(--gold)', border: '1px solid rgba(212,165,116,0.2)' }}>
                      🔑 Роль: {user.role === 'admin' ? 'Администратор' : user.role === 'master' ? 'Кальянный Мастер' : 'Клиент'}
                    </span>
                    <span className="px-3 py-1 rounded-full" style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--success)' }}>
                      📦 {user.total_orders || 0} заказов
                    </span>
                    <span className="px-3 py-1 rounded-full" style={{ background: 'rgba(96,165,250,0.1)', color: 'var(--info)' }}>
                      💰 Потрачено: {(user.total_spent || 0).toLocaleString('ru-RU')}₽
                    </span>
                  </div>
                </div>

                <button onClick={handleLogout} className="btn-outline text-xs px-4 py-2 mt-4 md:mt-0">Выйти</button>
              </div>
              
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full filter blur-[50px] opacity-[0.05]"
                style={{ background: 'var(--gold)' }} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side: Favourite Mixes */}
            <div>
              <h2 className="text-lg font-bold mb-4 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
                💾 Мои миксы
              </h2>
              
              {mixes.length === 0 ? (
                <div className="card p-6 text-center">
                  <span className="text-3xl block mb-2">🍃</span>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>У вас пока нет сохраненных миксов</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {mixes.map(mix => (
                    <div key={mix.id} className="card p-5 hover-lift">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm">{mix.name}</h3>
                        <div className="flex gap-2">
                          <button onClick={() => handleOrderMix(mix)} className="text-xs border-none cursor-pointer px-2.5 py-1 rounded-lg btn-gold font-medium">Заказать</button>
                          <button onClick={() => handleDeleteMix(mix.id)} className="text-xs border-none cursor-pointer p-1 rounded-lg" style={{ color: 'var(--danger)', background: 'transparent' }}>✕</button>
                        </div>
                      </div>
                      
                      {mix.description && <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{mix.description}</p>}
                      
                      <div className="flex flex-wrap gap-1.5 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        {mix.items.map((i: any) => (
                          <span key={i.id} className="text-xxs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                            {i.flavor.brand?.name} {i.flavor.name} ({i.grams}г)
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right side: Orders History */}
            <div>
              <h2 className="text-lg font-bold mb-4 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
                📦 История заказов
              </h2>

              {orders.length === 0 ? (
                <div className="card p-6 text-center">
                  <span className="text-3xl block mb-2">💨</span>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>История заказов пуста</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {orders.map(order => (
                    <div key={order.id} className="card p-5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(order.created_at).toLocaleDateString('ru-RU')} в {new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                          background: order.status === 'completed' ? 'rgba(74,222,128,0.1)' : order.status === 'cancelled' ? 'rgba(239,68,68,0.1)' : 'rgba(212,165,116,0.1)',
                          color: order.status === 'completed' ? 'var(--success)' : order.status === 'cancelled' ? 'var(--danger)' : 'var(--gold)'
                        }}>
                          {STATUS_EMOJI[order.status]} {STATUS_LABELS[order.status]}
                        </span>
                      </div>

                      <div className="mb-3">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Микс:</span>
                        <p className="text-xs">
                          {order.items?.map(i => `${i.flavor?.brand?.name} ${i.flavor?.name} (${i.grams}г)`).join(', ')}
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-2" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <span>Жидкость: {order.liquid?.icon} {order.liquid?.name}</span>
                        <span className="font-semibold" style={{ color: 'var(--gold)' }}>
                          {order.total_price > 0 ? `${order.total_price}₽` : 'Цена назначается'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
