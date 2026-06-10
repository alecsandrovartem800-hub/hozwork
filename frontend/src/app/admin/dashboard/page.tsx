'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

// Импортируем Plotly динамически, так как он использует window/document и падает при SSR
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full flex items-center justify-center bg-gray-50 border border-gray-100 rounded-2xl animate-pulse">
      <span className="text-sm text-gray-400 font-medium">Рендеринг графика...</span>
    </div>
  ),
});

export default function AdminDashboardPage() {
  const [kpi, setKpi] = useState({
    orders_count: 0,
    total_revenue: 0,
    avg_check: 0,
    conversion_rate: 0,
  });
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error('Сессия не найдена');

        const response = await api.analytics.dashboard(token);
        
        setKpi(response.kpi);
        setCharts(response.charts);
      } catch (error) {
        console.error('Ошибка загрузки аналитики:', error);
        toast.error('Не удалось загрузить данные аналитики бэкенда');
        
        // Фолбэк на mock данные, если бэкенд не отвечает или не запущен
        setKpi({
          orders_count: 42,
          total_revenue: 145000,
          avg_check: 3450,
          conversion_rate: 9.8,
        });

        // Создаем mock графики для Plotly
        setCharts({
          sales_line: {
            data: [{
              x: ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07'],
              y: [12000, 15000, 8000, 22000, 19000, 25000, 31000],
              type: 'scatter',
              mode: 'lines+markers',
              marker: { color: '#2e7d32' },
              line: { color: '#2e7d32', width: 3 }
            }],
            layout: { title: 'Продажи за неделю (₽)', height: 320, autosize: true, margin: { l: 40, r: 20, t: 40, b: 30 } }
          },
          category_bar: {
            data: [{
              x: ['Чистящие средства', 'Перчатки', 'Мешки', 'Инвентарь', 'Дезинфекция'],
              y: [45000, 23000, 18000, 32000, 27000],
              type: 'bar',
              marker: { color: '#4CAF50' }
            }],
            layout: { title: 'Продажи по категориям', height: 320, autosize: true, margin: { l: 40, r: 20, t: 40, b: 30 } }
          },
          conversion_funnel: {
            data: [{
              type: 'funnel',
              y: ['Просмотры', 'Корзина', 'Оплата залога'],
              x: [1200, 420, 42],
              connector: { line: { color: 'white', width: 2 } }
            }],
            layout: { title: 'Воронка конверсии', height: 320, autosize: true, margin: { l: 100, r: 20, t: 40, b: 30 } }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 font-sans">Дашборд аналитики</h1>
        <p className="text-sm text-gray-500">Общие показатели и научный анализ данных HOZWORK</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hoverEffect={false} className="p-6 space-y-2">
          <span className="text-sm font-semibold text-gray-400">Заказов оформлено</span>
          <p className="text-3xl font-black text-gray-900">{kpi.orders_count}</p>
        </Card>
        
        <Card hoverEffect={false} className="p-6 space-y-2">
          <span className="text-sm font-semibold text-gray-400">Общая выручка</span>
          <p className="text-3xl font-black text-green-700">{formatPrice(kpi.total_revenue)}</p>
        </Card>
        
        <Card hoverEffect={false} className="p-6 space-y-2">
          <span className="text-sm font-semibold text-gray-400">Средний чек</span>
          <p className="text-3xl font-black text-gray-900">{formatPrice(kpi.avg_check)}</p>
        </Card>
        
        <Card hoverEffect={false} className="p-6 space-y-2">
          <span className="text-sm font-semibold text-gray-400">Конверсия</span>
          <p className="text-3xl font-black text-orange-600">{kpi.conversion_rate}%</p>
        </Card>
      </div>

      {/* Plotly Charts Grid */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales trend */}
          <Card hoverEffect={false} className="p-6">
            <Plot
              data={charts.sales_line.data}
              layout={{
                ...charts.sales_line.layout,
                autosize: true,
                style: { width: '100%' },
              }}
              useResizeHandler={true}
              className="w-full"
            />
          </Card>

          {/* Categories sales */}
          <Card hoverEffect={false} className="p-6">
            <Plot
              data={charts.category_bar.data}
              layout={{
                ...charts.category_bar.layout,
                autosize: true,
                style: { width: '100%' },
              }}
              useResizeHandler={true}
              className="w-full"
            />
          </Card>

          {/* Conversion funnel */}
          <Card hoverEffect={false} className="p-6 lg:col-span-2">
            <Plot
              data={charts.conversion_funnel.data}
              layout={{
                ...charts.conversion_funnel.layout,
                autosize: true,
                style: { width: '100%' },
              }}
              useResizeHandler={true}
              className="w-full"
            />
          </Card>
        </div>
      )}
    </div>
  );
}
