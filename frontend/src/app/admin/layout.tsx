'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { ToastContainer } from '@/components/ui/Toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Проверка прав администратора
    if (!user || !isAdmin) {
      router.push('/');
    } else {
      setChecking(false);
    }
  }, [user, isAdmin, router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-semibold font-sans">Проверка прав администратора...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Дашборд', path: '/admin/dashboard', icon: '📊' },
    { name: 'Товары (CRUD)', path: '/admin/products', icon: '📦' },
    { name: 'Заказы', path: '/admin/orders', icon: '📋' },
    { name: 'Чаты', path: '/admin/chats', icon: '💬' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Toast container for admin actions notifications */}
      <ToastContainer />

      {/* Admin Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col flex-shrink-0">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 bg-gray-950 border-b border-gray-800">
          <Link href="/" className="text-xl font-black text-green-500 tracking-wider">
            HOZWORK ADMIN
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-green-700 text-white shadow shadow-green-700/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 bg-gray-950 border-t border-gray-800 text-xs flex items-center justify-between">
          <span className="text-gray-500">Вошли как: {user?.email}</span>
          <Link href="/account" className="text-green-500 hover:underline">
            Выйти
          </Link>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="text-lg font-bold text-gray-800">Панель управления</h2>
          <Link href="/" className="text-sm font-semibold text-green-700 hover:underline">
            Вернуться на сайт &rarr;
          </Link>
        </header>

        {/* Content area */}
        <div className="flex-grow p-8 overflow-y-auto bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
}
