import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Filters } from '@/components/catalog/Filters';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Pagination } from '@/components/catalog/Pagination';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const category = (resolvedParams.category as string) || '';
  const search = (resolvedParams.search as string) || '';
  const sort = (resolvedParams.sort as string) || 'created_at';
  const page = parseInt((resolvedParams.page as string) || '1', 10);
  const pageSize = 12;

  let products = [];
  let totalCount = 0;
  
  try {
    const supabase = await createClient();
    
    // Начало сборки запроса
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Фильтры
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Сортировка
    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else if (sort === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Пагинация
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    
    if (error) throw error;
    products = data || [];
    totalCount = count || 0;
  } catch (error) {
    console.error('Ошибка загрузки каталога товаров:', error);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Page title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900">Каталог товаров</h1>
          <p className="text-sm text-gray-500">Найдено {totalCount} наименований товаров</p>
        </div>

        {/* Content body */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Filters column */}
          <div className="lg:col-span-1">
            <Filters />
          </div>

          {/* Grid column */}
          <div className="lg:col-span-3 space-y-8">
            <ProductGrid products={products} />
            <Pagination currentPage={page} totalPages={totalPages} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
