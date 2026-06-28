'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { BrandWithFlavors, CATEGORY_LABELS } from '@/types';

const CATEGORIES = [
  { key: 'all', label: 'Все вкусы' },
  { key: 'fruity', label: 'Фруктовые' },
  { key: 'berry', label: 'Ягодные' },
  { key: 'citrus', label: 'Цитрусовые' },
  { key: 'sweet', label: 'Сладкие' },
  { key: 'mint', label: 'Освежающие' },
  { key: 'signature', label: '🌟 Фирменные миксы' },
  { key: 'authors', label: '✍️ Авторские миксы' }
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
    description: "Яркий, взрывной дуэт кислого лимона и сладкой апельсиновой газировки, подчеркнутый терпким темным виноградом.",
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
    // Collect ingredients IDs if we can find them in brands array
    const prefillItems: any[] = [];
    
    mix.ingredients.forEach((ing: any) => {
      const brandObj = brands.find(b => b.name.toLowerCase() === ing.brand.toLowerCase());
      const flavorObj = brandObj?.flavors.find(f => f.name.toLowerCase() === ing.name.toLowerCase());
      if (flavorObj) {
        prefillItems.push({
          flavor_id: flavorObj.id,
          name: flavorObj.name,
          brand: brandObj?.name || ing.brand,
          grams: Math.round(parseFloat(ing.share) / 100 * 25) // Convert share % to approx grams out of 25g
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
      <main className="pt-20 pb-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 pt-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
              Наше меню
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              Более 30 премиальных вкусов и эксклюзивные миксы от наших мастеров
            </p>
          </div>

          {/* Search */}
          {showTobacco && (
            <div className="max-w-md mx-auto mb-8">
              <input
                type="text"
                placeholder="🔍 Поиск по вкусам и брендам..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
              />
            </div>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  setCategory(cat.key);
                  setSearch('');
                }}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border-none cursor-pointer"
                style={{
                  background: category === cat.key ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                  color: category === cat.key ? '#0a0a0a' : 'var(--text-secondary)',
                  border: category === cat.key ? 'none' : '1px solid var(--border)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading && showTobacco && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-2xl" />
              ))}
            </div>
          )}

          {/* Signature mixes display */}
          {category === 'signature' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {SIGNATURE_MIXES.map(mix => (
                <div key={mix.id} className="card p-6 flex flex-col justify-between hover-lift">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {mix.name}
                      </h3>
                      <span className="text-xxs px-2.5 py-1 rounded-full uppercase font-semibold" style={{ background: 'rgba(212,165,116,0.1)', color: 'var(--gold)' }}>
                        Крепость: {mix.strength}
                      </span>
                    </div>
                    <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{mix.description}</p>
                    
                    <div className="mb-6">
                      <h4 className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Состав:</h4>
                      <div className="flex flex-col gap-1.5">
                        {mix.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex justify-between text-xs py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <span><strong style={{ color: 'var(--gold-light)' }}>{ing.brand}</strong> {ing.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{ing.share}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleOrderMix(mix)} className="btn-gold w-full py-2.5 font-semibold text-sm">
                    🌿 Заказать этот микс
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Author's mixes display */}
          {category === 'authors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {AUTHORS_MIXES.map(mix => (
                <div key={mix.id} className="card p-6 flex flex-col justify-between hover-lift">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {mix.name}
                      </h3>
                      <span className="text-xxs px-2.5 py-1 rounded-full uppercase font-semibold" style={{ background: 'rgba(212,165,116,0.1)', color: 'var(--gold)' }}>
                        Крепость: {mix.strength}
                      </span>
                    </div>
                    <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{mix.description}</p>
                    
                    <div className="mb-6">
                      <h4 className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Состав:</h4>
                      <div className="flex flex-col gap-1.5">
                        {mix.ingredients.map((ing, idx) => (
                          <div key={idx} className="flex justify-between text-xs py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <span><strong style={{ color: 'var(--gold-light)' }}>{ing.brand}</strong> {ing.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{ing.share}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleOrderMix(mix)} className="btn-gold w-full py-2.5 font-semibold text-sm">
                    🌿 Заказать этот микс
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tobacco Brands & Flavors list */}
          {showTobacco && !loading && filteredBrands.length === 0 && (
            <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
              <span className="text-5xl block mb-4">🔍</span>
              <p className="text-lg">Ничего не найдено</p>
            </div>
          )}

          {showTobacco && !loading && filteredBrands.map((brand, bi) => (
            <div key={brand.id} className="mb-12 animate-fade-in" style={{ animationDelay: `${bi * 0.05}s`, animationFillMode: 'both' }}>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--gold-light)', fontFamily: "'Playfair Display', serif" }}>
                  {brand.name}
                </h2>
                {brand.country && (
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                    {brand.country}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {brand.flavors.map((flavor) => {
                  const stockLevel = flavor.stock_grams > 200 ? 'high' : flavor.stock_grams > 100 ? 'medium' : 'low';
                  const stockColor = stockLevel === 'high' ? 'var(--success)' : stockLevel === 'medium' ? 'var(--warning)' : 'var(--danger)';

                  return (
                    <div key={flavor.id} className="card p-5 group">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {flavor.name}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: stockColor }} />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {Math.round(flavor.stock_grams)}г
                          </span>
                        </div>
                      </div>

                      {flavor.description && (
                        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {flavor.description}
                        </p>
                      )}

                      <span className="badge text-xs" style={{
                        background: 'rgba(212,165,116,0.1)',
                        color: 'var(--gold)',
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
