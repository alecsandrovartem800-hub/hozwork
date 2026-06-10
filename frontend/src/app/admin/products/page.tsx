'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [depositPercent, setDepositPercent] = useState('30');
  const [category, setCategory] = useState('Чистящие средства');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState('100');
  const [brand, setBrand] = useState('');
  const [weight, setWeight] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Для админов загрузим напрямую из Supabase все товары (активные и неактивные)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      toast.error('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setDepositPercent('30');
    setCategory('Чистящие средства');
    setSku('');
    setImageUrl('');
    setStock('100');
    setBrand('');
    setWeight('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setDepositPercent(product.deposit_percent.toString());
    setCategory(product.category || 'Чистящие средства');
    setSku(product.sku || '');
    setImageUrl(product.image_url || '');
    setStock(product.stock.toString());
    setBrand(product.brand || '');
    setWeight(product.weight ? product.weight.toString() : '');
    setIsActive(product.is_active);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !sku.trim()) {
      toast.error('Пожалуйста, заполните обязательные поля (Название, Цена, Артикул)');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Сессия не найдена');

      const productPayload: Partial<Product> = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        deposit_percent: parseFloat(depositPercent),
        category: category,
        sku: sku.trim(),
        image_url: imageUrl.trim(),
        stock: parseInt(stock, 10),
        brand: brand.trim(),
        weight: weight ? parseFloat(weight) : undefined,
        is_active: isActive,
      };

      if (editingProduct) {
        // Update
        await api.products.update(editingProduct.id, productPayload, token);
        toast.success('Товар успешно обновлен');
      } else {
        // Create
        await api.products.create(productPayload, token);
        toast.success('Товар успешно создан');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Ошибка сохранения товара:', error);
      toast.error(error.message || 'Ошибка сохранения товара');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить товар "${name}"?`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Сессия не найдена');

      await api.products.delete(id, token);
      toast.success('Товар успешно удален');
      fetchProducts();
    } catch (error: any) {
      console.error('Ошибка удаления товара:', error);
      toast.error(error.message || 'Ошибка удаления товара');
    }
  };

  const categories = [
    'Чистящие средства',
    'Перчатки',
    'Мешки для мусора',
    'Инвентарь',
    'Бумажная продукция',
    'Дезинфекция',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Управление товарами</h1>
          <p className="text-sm text-gray-500">Добавление, редактирование и удаление товаров из каталога</p>
        </div>
        <Button onClick={openAddModal} variant="primary" className="font-bold cursor-pointer">
          ➕ Добавить товар
        </Button>
      </div>

      {/* Products list Table */}
      <Card hoverEffect={false} className="p-0 overflow-hidden border border-gray-100 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Каталог товаров пуст.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Артикул</th>
                  <th className="px-6 py-4">Товар</th>
                  <th className="px-6 py-4">Категория</th>
                  <th className="px-6 py-4 text-right">Цена</th>
                  <th className="px-6 py-4 text-right">Залог (%)</th>
                  <th className="px-6 py-4 text-center">Остаток</th>
                  <th className="px-6 py-4 text-center">Статус</th>
                  <th className="px-6 py-4 text-center">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-400">{p.sku || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={p.image_url || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=150'}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-100"
                        />
                        <span className="font-bold text-gray-900 line-clamp-1">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{p.category}</td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">{formatPrice(p.price)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-orange-600">
                      {formatPrice(Math.round(p.price * p.deposit_percent / 100))} ({p.deposit_percent}%)
                    </td>
                    <td className="px-6 py-4 text-center font-medium">{p.stock} шт.</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={p.is_active ? 'success' : 'danger'}>
                        {p.is_active ? 'Активен' : 'Скрыт'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="text-gray-400 hover:text-green-700 p-1.5 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit/Add Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 font-sans">
          <Input
            label="Название товара*"
            id="prod-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Перчатки латексные особо прочные"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Цена (₽)*"
              type="number"
              id="prod-price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1290"
              required
            />
            <Input
              label="Залог (%)*"
              type="number"
              id="prod-deposit"
              value={depositPercent}
              onChange={(e) => setDepositPercent(e.target.value)}
              placeholder="30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="prod-category" className="text-sm font-medium text-gray-700">Категория</label>
              <select
                id="prod-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Input
              label="Артикул (SKU)*"
              id="prod-sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="GLV-LAT-XL"
              required
            />
          </div>

          <Input
            label="Ссылка на изображение"
            id="prod-image"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Остаток*"
              type="number"
              id="prod-stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="100"
              required
            />
            <Input
              label="Бренд"
              id="prod-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="HozBrand"
            />
            <Input
              label="Вес (кг)"
              type="number"
              id="prod-weight"
              step="0.01"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.15"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="prod-desc" className="text-sm font-medium text-gray-700">Описание</label>
            <textarea
              id="prod-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Детальное описание товара..."
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 h-24"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="prod-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-green-700 focus:ring-green-700/20 border-gray-300"
            />
            <label htmlFor="prod-active" className="text-sm text-gray-700 font-medium select-none cursor-pointer">
              Показывать товар в каталоге
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              onClick={() => setIsModalOpen(false)}
              variant="ghost"
              className="cursor-pointer"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              variant="primary"
              className="font-bold cursor-pointer"
            >
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
