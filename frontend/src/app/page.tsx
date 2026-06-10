import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/catalog/ProductCard';

export const revalidate = 60; // Перепроверять кэш каждые 60 секунд

export default async function HomePage() {
  let popularProducts = [];
  
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(8);
      
    popularProducts = data || [];
  } catch (error) {
    console.error('Ошибка загрузки товаров на главной:', error);
  }

  // Категории с иконками
  const categoriesList = [
    { name: 'Чистящие средства', emoji: '🧼', desc: 'Порошки, гели, концентраты' },
    { name: 'Перчатки', emoji: '🧤', desc: 'Латексные, виниловые, нитриловые' },
    { name: 'Мешки для мусора', emoji: '🗑️', desc: 'От 30 до 240 литров, особо прочные' },
    { name: 'Инвентарь', emoji: '🧹', desc: 'Швабры, ведра, тряпки, губки' },
    { name: 'Бумажная продукция', emoji: '🧻', desc: 'Салфетки, полотенца, бумага' },
    { name: 'Дезинфекция', emoji: '🧪', desc: 'Антисептики и обеззараживатели' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-900 to-green-800 py-24 px-4 sm:px-6 lg:px-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          <Badge variant="deposit" className="bg-orange-500 text-white border-none px-4 py-1.5 text-sm rounded-xl">
            🚚 Прямые поставки от производителя
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-3xl">
            Хозяйственные товары с гарантией надежности
          </h1>
          <p className="text-lg sm:text-xl text-green-100 max-w-2xl font-light">
            Профессиональный инвентарь, чистящие средства и расходные материалы для бизнеса и дома. Оптимальная залоговая система оплаты заказа.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <Link href="/catalog">
              <Button size="lg" className="w-full sm:w-auto font-bold bg-white text-green-900 hover:bg-gray-100 cursor-pointer">
                Перейти в каталог
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto border-white text-white hover:bg-white/10 cursor-pointer">
                Как работает залог?
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Info Banner */}
        <section id="how-it-works">
          <Card hoverEffect={false} className="bg-orange-50/50 border border-orange-200/40 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <span className="text-3xl">💳</span>
              <h3 className="text-2xl font-bold text-gray-900">Система залога 30% — ваша гарантия</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Для обеспечения серьезности намерений покупателя мы используем систему залога. При оформлении заказа вы оплачиваете 30% его стоимости сразу. Остальная сумма выплачивается при получении. 
                <br />
                <span className="text-orange-700 font-semibold">⚠️ Обратите внимание: после внесения залога заказ не подлежит отмене, обмену или возврату.</span>
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/catalog">
                <Button className="font-bold bg-green-700 hover:bg-green-800 text-white cursor-pointer">
                  Начать покупки
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* Categories Section */}
        <section className="space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-gray-900">Наш ассортимент</h2>
            <p className="text-sm text-gray-500">Широкий выбор расходных материалов для любых нужд</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriesList.map((cat) => (
              <Link key={cat.name} href={`/catalog?category=${encodeURIComponent(cat.name)}`}>
                <Card className="hover:border-green-600/30 flex items-center space-x-4 p-5">
                  <span className="text-4xl">{cat.emoji}</span>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">{cat.name}</h4>
                    <p className="text-xs text-gray-400">{cat.desc}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular Products */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900">Популярные товары</h2>
            <Link href="/catalog" className="text-sm font-semibold text-green-700 hover:text-green-800">
              Все товары &rarr;
            </Link>
          </div>
          
          {popularProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Загрузка товаров...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
