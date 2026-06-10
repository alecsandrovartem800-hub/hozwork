import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';
import { formatPrice, calculateDeposit } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProductDetailActions } from './ProductDetailActions';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Product } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  let product: Product | null = null;
  let recommendations: Product[] = [];

  try {
    const supabase = await createClient();
    
    // 1. Загрузка основного товара
    const { data: productData, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !productData) {
      return notFound();
    }
    
    product = productData as Product;

    // 2. Загрузка рекомендаций из бэкенда
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/v1/recommendations/${id}`, {
        next: { revalidate: 60 }
      });
      if (res.ok) {
        recommendations = await res.json();
      }
    } catch (err) {
      console.error('Ошибка загрузки рекомендаций с бэкенда:', err);
      // Фолбэк на товары той же категории
      const { data: fallbackData } = await supabase
        .from('products')
        .select('*')
        .eq('category', product.category)
        .neq('id', id)
        .limit(4);
      recommendations = (fallbackData || []) as Product[];
    }

  } catch (error) {
    console.error('Ошибка на странице товара:', error);
    return notFound();
  }

  const depositAmount = calculateDeposit(product.price, product.deposit_percent);
  const displayImage = product.image_url || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Breadcrumbs */}
        <nav className="text-sm font-medium text-gray-500 flex items-center space-x-2">
          <Link href="/" className="hover:text-green-700 transition-colors">Главная</Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-green-700 transition-colors">Каталог</Link>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-[200px] sm:max-w-none">{product.name}</span>
        </nav>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Col 1: Product Image */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden aspect-square flex items-center justify-center shadow-sm p-4">
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          {/* Col 2: Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-green-700 uppercase tracking-widest">{product.category}</span>
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 leading-tight">{product.name}</h1>
              <p className="text-sm text-gray-400 font-medium">Артикул: {product.sku || 'HOZ-MOCK'}</p>
            </div>

            {/* Price Box */}
            <Card hoverEffect={false} className="bg-gray-50/50 p-6 space-y-4 border border-gray-100">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-500 font-medium">Цена</span>
                <span className="text-3xl font-black text-gray-900">{formatPrice(product.price)}</span>
              </div>

              {/* Deposit notice */}
              <div className="flex justify-between items-center bg-orange-50 border border-orange-200/50 p-4 rounded-xl text-orange-950">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Сумма залога (30%)</span>
                  <span className="text-xs text-orange-700 font-medium">Оплачивается при заказе</span>
                </div>
                <span className="text-xl font-black text-orange-700">{formatPrice(depositAmount)}</span>
              </div>

              <div className="text-xs text-gray-400 bg-white border border-gray-100 rounded-xl p-3">
                ⚠️ Товар поставляется после оплаты залога. Обмену и возврату не подлежит.
              </div>
            </Card>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-gray-900">Описание товара</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description || 'Детальное описание этого товара в данный момент заполняется контент-менеджерами. Продукт прошел строгую проверку качества и готов к использованию.'}
              </p>
            </div>

            {/* Properties table */}
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <h3 className="text-base font-bold text-gray-900">Характеристики</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm max-w-md">
                <span className="text-gray-400">Бренд</span>
                <span className="text-gray-900 font-medium">{product.brand || 'HOZWORK'}</span>
                <span className="text-gray-400">Вес в упаковке</span>
                <span className="text-gray-900 font-medium">{product.weight ? `${product.weight} кг` : '—'}</span>
                <span className="text-gray-400">Наличие на складе</span>
                <span className="text-gray-900 font-medium">{product.stock > 0 ? `${product.stock} шт.` : 'Под заказ'}</span>
              </div>
            </div>

            {/* Action buttons */}
            <ProductDetailActions product={product} />
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <section className="space-y-6 pt-10 border-t border-gray-100">
            <h2 className="text-xl font-black text-gray-900">С этим товаром также покупают</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((rec) => (
                <ProductCard key={rec.id} product={rec} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
