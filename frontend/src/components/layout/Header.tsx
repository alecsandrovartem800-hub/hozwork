'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const getTotals = useCartStore((state) => state.getTotals);
  const { itemCount } = getTotals();
  const { user, isAdmin, logout } = useAuthStore();
  const supabase = createClient();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-black text-green-700 tracking-wider font-sans">
              HOZWORK
            </Link>
          </div>

          {/* Catalog Link */}
          <nav className="hidden md:flex space-x-8 ml-8">
            <Link href="/catalog" className="text-gray-600 hover:text-green-700 font-medium transition-colors">
              Каталог
            </Link>
          </nav>

          {/* Search bar */}
          <div className="flex-1 max-w-md mx-8 hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск хозяйственных товаров..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition-colors"
              />
              <button type="submit" className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Navigation right */}
          <div className="flex items-center space-x-4">
            {/* Admin page link */}
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="hidden md:inline-flex items-center px-3.5 py-1.5 border border-green-700 text-sm font-semibold rounded-xl text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
              >
                Админ-панель
              </Link>
            )}

            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-green-700 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-green-700 rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Profile / Auth */}
            {user ? (
              <div className="flex items-center space-x-3">
                <Link href="/account" className="text-sm font-medium text-gray-700 hover:text-green-700 transition-colors hidden sm:block">
                  {user.email}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-semibold text-gray-500 hover:text-red-600 border border-gray-200 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 shadow-sm transition-colors"
              >
                Войти
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-green-700 focus:outline-none cursor-pointer"
            >
              <svg className="h-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-2 pt-2 pb-4 space-y-1 bg-white border-t border-gray-100">
          <div className="px-4 py-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700"
              />
              <button type="submit" className="absolute left-3 top-2.5 text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
          <Link
            href="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-2 text-base font-medium text-gray-600 hover:text-green-700 hover:bg-gray-50 rounded-xl"
          >
            Каталог
          </Link>
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-base font-medium text-green-700 hover:bg-green-50 rounded-xl"
            >
              Админ-панель
            </Link>
          )}
          {user && (
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-base font-medium text-gray-600 hover:text-green-700 hover:bg-gray-50 rounded-xl"
            >
              Личный кабинет ({user.email})
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
