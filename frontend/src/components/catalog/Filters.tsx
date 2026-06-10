'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// Список стандартных категорий товаров
const CATEGORIES = [
  'Чистящие средства',
  'Перчатки',
  'Мешки для мусора',
  'Инвентарь',
  'Бумажная продукция',
  'Дезинфекция',
];

export function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state initialized from URL searchParams
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'created_at');
  
  // Sync state if URL changes (e.g. from header search)
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategory(searchParams.get('category') || '');
    setSort(searchParams.get('sort') || 'created_at');
  }, [searchParams]);

  const handleApply = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    params.set('page', '1'); // Сбрасываем на 1 страницу при фильтрации
    
    router.push(`/catalog?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setSort('created_at');
    router.push('/catalog');
  };

  return (
    <Card hoverEffect={false} className="space-y-6">
      {/* Search Field */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-800">Поиск</label>
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Название или артикул..."
          className="text-sm"
        />
      </div>

      {/* Sort Select */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-800">Сортировка</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700"
        >
          <option value="created_at">Новинки</option>
          <option value="price_asc">По цене ↑</option>
          <option value="price_desc">По цене ↓</option>
          <option value="name">По названию</option>
        </select>
      </div>

      {/* Categories Checkboxes */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-gray-800">Категории</label>
        <div className="flex flex-col space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center space-x-2.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={category === cat}
                onChange={() => setCategory(category === cat ? '' : cat)}
                className="w-4 h-4 rounded text-green-700 focus:ring-green-700/20 border-gray-300 cursor-pointer"
              />
              <span className={category === cat ? 'font-semibold text-green-700' : ''}>{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-2 pt-2 border-t border-gray-100">
        <Button onClick={handleApply} variant="primary" fullWidth className="cursor-pointer">
          Применить
        </Button>
        <Button onClick={handleReset} variant="ghost" fullWidth className="cursor-pointer">
          Сбросить
        </Button>
      </div>
    </Card>
  );
}
