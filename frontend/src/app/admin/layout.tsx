'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Дашборд', icon: '📊' },
  { href: '/admin/orders', label: 'Заказы', icon: '📦' },
  { href: '/admin/clients', label: 'Клиенты', icon: '👥' },
  { href: '/admin/tobacco', label: 'Табаки', icon: '🍃' },
  { href: '/admin/atmosphere', label: 'Атмосфера', icon: '🎵' },
  { href: '/admin/smart', label: 'Smart', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed top-0 left-0 bottom-0 z-40 glass-strong" style={{ borderRight: '1px solid var(--border)' }}>
        <div className="p-5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-xl">🌿</span>
          <span className="text-sm font-bold text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
            SPORT LOUNGE
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ background: 'rgba(212,165,116,0.15)', color: 'var(--gold)', fontSize: '0.65rem' }}>
            ADMIN
          </span>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="no-underline flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300"
                style={{
                  background: isActive ? 'rgba(212,165,116,0.12)' : 'transparent',
                  color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                  borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                }}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <Link href="/" className="no-underline flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            ← На сайт
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-strong flex items-center justify-between px-4 h-14" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span>🌿</span>
          <span className="text-sm font-bold text-gold-gradient">ADMIN</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 border-none cursor-pointer" style={{ background: 'transparent', color: 'var(--text-primary)' }}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute top-14 left-0 bottom-0 w-64 glass-strong animate-slide-up" style={{ borderRight: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <nav className="p-3 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className="no-underline flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: isActive ? 'rgba(212,165,116,0.12)' : 'transparent',
                      color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                    }}>
                    <span className="text-lg">{item.icon}</span> {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong flex justify-around py-2" style={{ borderTop: '1px solid var(--border)' }}>
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="no-underline flex flex-col items-center gap-0.5 px-2 py-1"
              style={{ color: isActive ? 'var(--gold)' : 'var(--text-muted)', fontSize: '0.65rem' }}>
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
