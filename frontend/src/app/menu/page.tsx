'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { BrandWithFlavors, CATEGORY_LABELS } from '@/types';

const CATEGORIES = ['all', 'fruity', 'berry', 'citrus', 'mint', 'sweet', 'exotic', 'floral', 'spicy', 'classic'];

export default function MenuPage() {
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
              Более 30 вкусов от лучших мировых производителей
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <input
              type="text"
              placeholder="🔍 Поиск по вкусам и брендам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border-none cursor-pointer"
                style={{
                  background: category === cat ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                  color: category === cat ? '#0a0a0a' : 'var(--text-secondary)',
                  border: category === cat ? 'none' : '1px solid var(--border)',
                }}
              >
                {cat === 'all' ? 'Все' : CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-2xl" />
              ))}
            </div>
          )}

          {/* Brands with flavors */}
          {!loading && filteredBrands.length === 0 && (
            <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
              <span className="text-5xl block mb-4">🔍</span>
              <p className="text-lg">Ничего не найдено</p>
            </div>
          )}

          {!loading && filteredBrands.map((brand, bi) => (
            <div key={brand.id} className="mb-12 animate-fade-in" style={{ animationDelay: `${bi * 0.1}s`, animationFillMode: 'both' }}>
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
