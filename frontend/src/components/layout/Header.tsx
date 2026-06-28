'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Главная' },
  { href: '/menu', label: 'Меню' },
  { href: '/order', label: 'Заказать' },
  { href: '/track', label: 'Отследить' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
              SPORT LOUNGE
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="no-underline px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                style={{
                  color: pathname === item.href ? 'var(--gold)' : 'var(--text-secondary)',
                  background: pathname === item.href ? 'rgba(212,165,116,0.1)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/admin" className="no-underline ml-4 btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>
              Админ
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg"
            style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden glass-strong animate-slide-up" style={{ borderTop: '1px solid var(--border)' }}>
          <nav className="px-4 py-4 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="no-underline px-4 py-3 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: pathname === item.href ? 'var(--gold)' : 'var(--text-secondary)',
                  background: pathname === item.href ? 'rgba(212,165,116,0.1)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/admin" onClick={() => setIsOpen(false)} className="no-underline btn-outline btn-sm text-center mt-2">
              Админ-панель
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
