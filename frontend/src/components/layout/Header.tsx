'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { HookahIcon } from '@/components/ui/Icons';

const NAV_ITEMS = [
  { href: '/', label: 'Главная' },
  { href: '/menu', label: 'Меню' },
  { href: '/create', label: 'Заказать' },
  { href: '/track', label: 'Отследить' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.user_metadata?.avatar_url) {
        setAvatar(session.user.user_metadata.avatar_url);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.user_metadata?.avatar_url) {
        setAvatar(session.user.user_metadata.avatar_url);
      } else {
        setAvatar(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 no-underline group">
            <HookahIcon size={26} color="var(--gold)" className="transition-transform duration-500 group-hover:rotate-12" />
            <span className="text-lg font-semibold tracking-[0.25em] text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
              SPORT LOUNGE
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="no-underline px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300"
                style={{
                  color: pathname === item.href ? 'var(--gold)' : 'var(--text-secondary)',
                  background: pathname === item.href ? 'rgba(217, 178, 130, 0.06)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
            
            {session ? (
              <Link href="/profile" className="flex items-center gap-2 no-underline px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ml-4"
                style={{
                  color: pathname === '/profile' ? 'var(--gold)' : 'var(--text-secondary)',
                  background: pathname === '/profile' ? 'rgba(217, 178, 130, 0.06)' : 'transparent',
                  border: '1px solid rgba(217, 178, 130, 0.15)'
                }}>
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-5 h-5 rounded-full border" style={{ borderColor: 'var(--border)' }} />
                ) : (
                  <span>👤</span>
                )}
                Профиль
              </Link>
            ) : (
              <Link href="/login" className="no-underline ml-4 btn-gold btn-sm px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider" style={{ color: '#060608' }}>
                Войти
              </Link>
            )}

            <Link href="/admin" className="no-underline ml-2 btn-outline btn-sm px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>
              Админ
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg"
            style={{ color: 'var(--text-primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
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
                className="no-underline px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                style={{
                  color: pathname === item.href ? 'var(--gold)' : 'var(--text-secondary)',
                  background: pathname === item.href ? 'rgba(217, 178, 130, 0.06)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
            
            {session ? (
              <Link href="/profile" onClick={() => setIsOpen(false)} className="no-underline px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all text-center"
                style={{
                  color: 'var(--gold)',
                  background: 'rgba(217, 178, 130, 0.06)',
                  border: '1px solid rgba(217, 178, 130, 0.15)'
                }}>
                Профиль
              </Link>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="no-underline btn-gold text-center py-3 rounded-lg text-xs font-semibold uppercase tracking-wider" style={{ color: '#060608' }}>
                Войти
              </Link>
            )}

            <Link href="/admin" onClick={() => setIsOpen(false)} className="no-underline btn-outline btn-sm text-center mt-2 text-xs font-semibold uppercase tracking-wider">
              Админ-панель
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
