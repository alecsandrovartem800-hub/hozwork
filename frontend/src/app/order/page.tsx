'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { BrandWithFlavors, Liquid, CATEGORY_LABELS } from '@/types';

interface MixItem {
  flavor_id: number;
  name: string;
  brand: string;
  grams: number;
}

export default function OrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState<BrandWithFlavors[]>([]);
  const [liquids, setLiquids] = useState<Liquid[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [mix, setMix] = useState<MixItem[]>([]);
  const [selectedLiquid, setSelectedLiquid] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([api.getFlavorsByBrand(), api.getLiquids()])
      .then(([b, l]) => { setBrands(b); setLiquids(l); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addToMix = (flavorId: number, name: string, brand: string) => {
    if (mix.find((m) => m.flavor_id === flavorId)) return;
    setMix([...mix, { flavor_id: flavorId, name, brand, grams: 15 }]);
  };

  const removeFromMix = (flavorId: number) => {
    setMix(mix.filter((m) => m.flavor_id !== flavorId));
  };

  const updateGrams = (flavorId: number, grams: number) => {
    setMix(mix.map((m) => m.flavor_id === flavorId ? { ...m, grams } : m));
  };

  const canProceed = () => {
    if (step === 1) return guestName.trim().length > 0;
    if (step === 2) return mix.length > 0;
    if (step === 3) return selectedLiquid !== null;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const order = await api.createOrder({
        guest_name: guestName,
        guest_phone: guestPhone || undefined,
        table_number: tableNumber ? parseInt(tableNumber) : undefined,
        liquid_id: selectedLiquid,
        notes: notes || undefined,
        items: mix.map((m) => ({ flavor_id: m.flavor_id, grams: m.grams })),
      });
      router.push(`/track?id=${order.id}`);
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalGrams = mix.reduce((sum, m) => sum + m.grams, 0);

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 pt-8">
          <h1 className="text-4xl font-bold text-center mb-2 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
            Заказать кальян
          </h1>
          <p className="text-center mb-10" style={{ color: 'var(--text-secondary)' }}>
            Создайте свой идеальный микс
          </p>

          {/* Progress stepper */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {['Данные', 'Микс', 'Жидкость', 'Подтверждение'].map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-500" style={{
                  background: step > i + 1 ? 'rgba(74,222,128,0.15)' : step === i + 1 ? 'rgba(212,165,116,0.2)' : 'rgba(255,255,255,0.03)',
                  color: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--gold)' : 'var(--text-muted)',
                  border: `1px solid ${step === i + 1 ? 'rgba(212,165,116,0.3)' : 'transparent'}`,
                }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{
                    background: step > i + 1 ? 'var(--success)' : step === i + 1 ? 'var(--gold)' : 'var(--border)',
                    color: step >= i + 1 ? '#0a0a0a' : 'var(--text-muted)',
                  }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < 3 && <div className="w-8 h-px" style={{ background: step > i + 1 ? 'var(--success)' : 'var(--border)' }} />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              {/* Step 1: Guest Info */}
              {step === 1 && (
                <div className="card p-8 animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--gold-light)' }}>Ваши данные</h2>
                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Имя *</label>
                      <input className="input" placeholder="Как вас зовут?" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Телефон</label>
                      <input className="input" placeholder="+7 (___) ___-__-__" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Номер стола</label>
                      <input className="input" type="number" placeholder="Необязательно" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Mix Builder */}
              {step === 2 && (
                <div className="animate-fade-in">
                  <div className="card p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--gold-light)' }}>Составьте микс</h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Выберите вкусы и настройте пропорции</p>
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
                    </div>
                  ) : (
                    brands.map((brand) => (
                      <div key={brand.id} className="mb-6">
                        <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--gold-dark)' }}>
                          {brand.name}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {brand.flavors.map((flavor) => {
                            const inMix = mix.find((m) => m.flavor_id === flavor.id);
                            return (
                              <button
                                key={flavor.id}
                                onClick={() => inMix ? removeFromMix(flavor.id) : addToMix(flavor.id, flavor.name, brand.name)}
                                className="text-left p-4 rounded-xl border-none cursor-pointer transition-all duration-300"
                                style={{
                                  background: inMix ? 'rgba(212,165,116,0.15)' : 'var(--bg-card)',
                                  border: `1px solid ${inMix ? 'var(--gold)' : 'var(--border)'}`,
                                  color: 'var(--text-primary)',
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{flavor.name}</span>
                                  {inMix ? (
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--gold)', color: '#0a0a0a' }}>✓ В миксе</span>
                                  ) : (
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+ Добавить</span>
                                  )}
                                </div>
                                {flavor.description && (
                                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{flavor.description}</p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Step 3: Liquid Selection */}
              {step === 3 && (
                <div className="card p-8 animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--gold-light)' }}>Выберите жидкость</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {liquids.map((liquid) => (
                      <button
                        key={liquid.id}
                        onClick={() => setSelectedLiquid(liquid.id)}
                        className="p-6 rounded-2xl text-center transition-all duration-300 border-none cursor-pointer"
                        style={{
                          background: selectedLiquid === liquid.id ? 'rgba(212,165,116,0.15)' : 'var(--bg-card)',
                          border: `2px solid ${selectedLiquid === liquid.id ? 'var(--gold)' : 'var(--border)'}`,
                          color: 'var(--text-primary)',
                          transform: selectedLiquid === liquid.id ? 'scale(1.02)' : 'scale(1)',
                        }}
                      >
                        <span className="text-3xl block mb-2">{liquid.icon}</span>
                        <span className="font-medium text-sm block">{liquid.name}</span>
                        {liquid.description && (
                          <span className="text-xs block mt-1" style={{ color: 'var(--text-muted)' }}>{liquid.description}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div className="card p-8 animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--gold-light)' }}>Подтверждение заказа</h2>

                  <div className="flex flex-col gap-4">
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Гость</span>
                      <p className="font-medium">{guestName}</p>
                      {guestPhone && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{guestPhone}</p>}
                      {tableNumber && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Стол {tableNumber}</p>}
                    </div>

                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Микс ({totalGrams}г)</span>
                      {mix.map((m) => (
                        <p key={m.flavor_id} className="text-sm mt-1">
                          <span style={{ color: 'var(--gold)' }}>{m.brand}</span> {m.name} — {m.grams}г
                        </p>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Жидкость</span>
                      <p className="font-medium">
                        {liquids.find((l) => l.id === selectedLiquid)?.icon} {liquids.find((l) => l.id === selectedLiquid)?.name}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Пожелания мастеру</label>
                      <textarea
                        className="input"
                        placeholder="Любые пожелания по крепости, жаростойкости и т.д."
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                      💰 Стоимость назначается мастером после приготовления
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                {step > 1 ? (
                  <button onClick={() => setStep(step - 1)} className="btn-outline">← Назад</button>
                ) : <div />}
                {step < 4 ? (
                  <button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="btn-gold"
                    style={{ opacity: canProceed() ? 1 : 0.5, cursor: canProceed() ? 'pointer' : 'not-allowed' }}>
                    Далее →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting} className="btn-gold animate-glow">
                    {submitting ? '⏳ Отправка...' : '🌿 Отправить заказ'}
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar: Mix Preview */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold-light)', fontFamily: "'Playfair Display', serif" }}>
                  🍃 Ваш микс
                </h3>
                {mix.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Добавьте вкусы для составления микса</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {mix.map((m) => (
                      <div key={m.flavor_id} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-xs" style={{ color: 'var(--gold-dark)' }}>{m.brand}</span>
                            <p className="text-sm font-medium">{m.name}</p>
                          </div>
                          <button onClick={() => removeFromMix(m.flavor_id)} className="text-xs border-none cursor-pointer"
                            style={{ background: 'transparent', color: 'var(--danger)' }}>✕</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={5}
                            max={30}
                            value={m.grams}
                            onChange={(e) => updateGrams(m.flavor_id, parseInt(e.target.value))}
                            className="flex-1"
                            style={{ accentColor: 'var(--gold)' }}
                          />
                          <span className="text-xs font-medium w-8 text-right" style={{ color: 'var(--gold)' }}>{m.grams}г</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>Всего</span>
                        <span className="font-semibold" style={{ color: 'var(--gold)' }}>{totalGrams}г</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
