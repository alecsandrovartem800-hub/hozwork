'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { BrandWithFlavors, CATEGORY_LABELS } from '@/types';
import { CrownIcon, PenIcon } from '@/components/ui/Icons';

const CATEGORIES = [
  { key: 'all', label: 'Все вкусы' },
  { key: 'fruity', label: 'Фруктовые' },
  { key: 'berry', label: 'Ягодные' },
  { key: 'citrus', label: 'Цитрусовые' },
  { key: 'sweet', label: 'Сладкие' },
  { key: 'mint', label: 'Освежающие' },
  { key: 'signature', label: 'Фирменные миксы' },
  { key: 'authors', label: 'Авторские миксы' }
];

const SIGNATURE_MIXES = [
  {
    id: 101,
    name: "Космический Джем",
    description: "Насыщенный сладко-сливочный микс спелой клубники и малины с легким оттенком ментоловой прохлады.",
    strength: "Средняя",
    ingredients: [
      { brand: "Must Have", name: "Pinkman", share: "50%" },
      { brand: "Daily Hookah", name: "Клубничный Джем", share: "30%" },
      { brand: "Darkside", name: "Supernova", share: "20%" }
    ]
  },
  {
    id: 102,
    name: "Тропический Бриз",
    description: "Экзотический кисло-сладкий коктейль из манго, ананаса и спелого киви. Дарит ощущение отдыха на побережье.",
    strength: "Легкая",
    ingredients: [
      { brand: "Must Have", name: "Mango", share: "40%" },
      { brand: "Fumari", name: "Tropical Punch", share: "35%" },
      { brand: "Element", name: "Kiwi", share: "25%" }
    ]
  }
];

const AUTHORS_MIXES = [
  {
    id: 201,
    name: "Цитрусовый Шторм",
    description: "Яркий, взрывной дуэт кислого лимона и апельсиновой газировки, подчеркнутый терпким темным виноградом.",
    strength: "Крепкая",
    ingredients: [
      { brand: "Tangiers", name: "Orange Soda", share: "45%" },
      { brand: "Fumari", name: "Lemon Mint", share: "35%" },
      { brand: "Darkside", name: "Grape Core", share: "20%" }
    ]
  },
  {
    id: 202,
    name: "Карибский Вечер",
    description: "Теплый пряный аромат выдержанного темного рома в идеальном сочетании со свежевыпеченным черничным кексом.",
    strength: "Выше средней",
    ingredients: [
      { brand: "Spectrum", name: "Caribbean Rum", share: "50%" },
      { brand: "Fumari", name: "Blueberry Muffin", share: "30%" },
      { brand: "BlackBurn", name: "Haribon", share: "20%" }
    ]
  }
];

export default function MenuPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandWithFlavors[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getFlavorsByBrand()
      .then((data) => setBrands(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredBrands = brands.map((brand) => ({
    ...brand,
    flavors: brand.flavors.filter((f) => {
      const matchCategory = category === 'all' || f.category === category;
      const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || brand.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    }),
  })).filter((b) => b.flavors.length > 0);

  const handleOrderMix = (mix: any) => {
    const prefillItems: any[] = [];
    
    mix.ingredients.forEach((ing: any) => {
      const brandObj = brands.find(b => b.name.toLowerCase() === ing.brand.toLowerCase());
      const flavorObj = brandObj?.flavors.find(f => f.name.toLowerCase() === ing.name.toLowerCase());
      if (flavorObj) {
        prefillItems.push({
          flavor_id: flavorObj.id,
          name: flavorObj.name,
          brand: brandObj?.name || ing.brand,
          grams: Math.round(parseFloat(ing.share) / 100 * 25)
        });
      }
    });

    if (prefillItems.length > 0) {
      localStorage.setItem('sport_lounge_prefill_mix', JSON.stringify(prefillItems));
    }
    router.push('/create');
  };

  const showTobacco = category !== 'signature' && category !== 'authors';

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16 pt-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gold-gradient tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
              Карта вкусов
            </h1>
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              Эксклюзивная коллекция для истинных ценителей
            </p>
          </div>

          {/* Search */}
          {showTobacco && (
            <div className="max-w-md mx-auto mb-10">
              <input
                type="text"
                placeholder="🔍 Поиск по вкусам и брендам..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input text-center text-xs uppercase tracking-wider"
              />
            </div>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-16">
            {CATEGORIES.map((cat) => {
              const isSpecial = cat.key === 'signature' || cat.key === 'authors';
              const isActive = category === cat.key;
              
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setCategory(cat.key);
                    setSearch('');
                  }}
                  className="px-5 py-2.5 rounded-full text-xxs font-bold uppercase tracking-wider transition-all duration-500 border-none cursor-pointer flex items-center gap-2"
                  style={{
                    background: isActive ? 'var(--gold)' : 'rgba(255,255,255,0.02)',
                    color: isActive ? '#060608' : 'var(--text-secondary)',
                    border: `1px solid ${isActive ? 'var(--gold)' : 'var(--border)'}`,
                    boxShadow: isActive ? '0 5px 15px rgba(217, 178, 130, 0.2)' : 'none'
                  }}
                >
                  {cat.key === 'signature' && <CrownIcon size={12} color={isActive ? '#060608' : 'var(--gold)'} />}
                  {cat.key === 'authors' && <PenIcon size={12} color={isActive ? '#060608' : 'var(--gold)'} />}
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Loading state */}
          {loading && showTobacco && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-2xl" />
              ))}
            </div>
          )}

          {/* Signature mixes display */}
          {category === 'signature' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              {SIGNATURE_MIXES.map(mix => (
                <div key={mix.id} className="card p-8 flex flex-col justify-between shadow-premium shadow-premium-hover" style={{ border: '1px solid var(--border)' }}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {mix.name}
                      </h3>
                      <span className="text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-wider" style={{ background: 'rgba(217,178,130,0.05)', color: 'var(--gold)', border: '1px solid var(--border)' }}>
                        {mix.strength}
                      </span>
                    </div>
                    <p className="text-sm mb-6 leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>{mix.description}</p>
                    
                    <div className="mb-8">
                      <h4 className="text-[10px] uppercase tracking-[0.15em] mb-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Состав микса:</h4>
                      <div className="flex flex-col gap-2">
                        {mix.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex justify-between text-xs py-1.5" style={{ borderBottom: '1px solid rgba(217,178,130,0.03)' }}>
                            <span><strong style={{ color: 'var(--gold-light)', fontWeight: 500 }}>{ing.brand}</strong> {ing.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{ing.share}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleOrderMix(mix)} className="btn-gold w-full py-3.5 font-bold text-xs tracking-wider">
                    Заказать этот микс
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Author's mixes display */}
          {category === 'authors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              {AUTHORS_MIXES.map(mix => (
                <div key={mix.id} className="card p-8 flex flex-col justify-between shadow-premium shadow-premium-hover" style={{ border: '1px solid var(--border)' }}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {mix.name}
                      </h3>
                      <span className="text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-wider" style={{ background: 'rgba(217,178,130,0.05)', color: 'var(--gold)', border: '1px solid var(--border)' }}>
                        {mix.strength}
                      </span>
                    </div>
                    <p className="text-sm mb-6 leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>{mix.description}</p>
                    
                    <div className="mb-8">
                      <h4 className="text-[10px] uppercase tracking-[0.15em] mb-3 font-semibold" style={{ color: 'var(--text-muted)' }}>Состав микса:</h4>
                      <div className="flex flex-col gap-2">
                        {mix.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex justify-between text-xs py-1.5" style={{ borderBottom: '1px solid rgba(217,178,130,0.03)' }}>
                            <span><strong style={{ color: 'var(--gold-light)', fontWeight: 500 }}>{ing.brand}</strong> {ing.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{ing.share}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleOrderMix(mix)} className="btn-gold w-full py-3.5 font-bold text-xs tracking-wider">
                    Заказать этот микс
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tobacco Brands & Flavors list */}
          {showTobacco && !loading && filteredBrands.length === 0 && (
            <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
              <span className="text-5xl block mb-4">🔍</span>
              <p className="text-lg">Вкусы не найдены</p>
            </div>
          )}

          {showTobacco && !loading && filteredBrands.map((brand, bi) => (
            <div key={brand.id} className="mb-16 animate-fade-in" style={{ animationDelay: `${bi * 0.05}s`, animationFillMode: 'both' }}>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold tracking-wide" style={{ color: 'var(--gold-light)', fontFamily: "'Playfair Display', serif" }}>
                  {brand.name}
                </h2>
                {brand.country && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    {brand.country}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                {brand.flavors.map((flavor) => {
                  const stockLevel = flavor.stock_grams > 200 ? 'high' : flavor.stock_grams > 100 ? 'medium' : 'low';
                  const stockColor = stockLevel === 'high' ? 'var(--success)' : stockLevel === 'medium' ? 'var(--warning)' : 'var(--danger)';

                  return (
                    <div key={flavor.id} className="card p-6 flex flex-col justify-between shadow-premium hover-lift" style={{ border: '1px solid var(--border)' }}>
                      <div>
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {flavor.name}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: stockColor }} />
                            <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                              {Math.round(flavor.stock_grams)}г
                            </span>
                          </div>
                        </div>

                        {flavor.description && (
                          <p className="text-xs mb-4 leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>
                            {flavor.description}
                          </p>
                        )}
                      </div>

                      <span className="badge text-[9px] w-max font-bold tracking-wider" style={{
                        background: 'rgba(217,178,130,0.05)',
                        color: 'var(--gold)',
                        border: '1px solid var(--border)'
                      }}>
                        {CATEGORY_LABELS[flavor.category] || flavor.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
