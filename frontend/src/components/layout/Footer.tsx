'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌿</span>
              <span className="text-xl font-bold text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
                SPORT LOUNGE
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7' }}>
              Премиум кальянная с авторскими миксами и неповторимой атмосферой. Мы создаём моменты, которые запоминаются.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--gold)' }}>
              Навигация
            </h4>
            <div className="flex flex-col gap-2">
              {[
                { href: '/', label: 'Главная' },
                { href: '/menu', label: 'Меню' },
                { href: '/order', label: 'Заказать кальян' },
                { href: '/track', label: 'Отследить заказ' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="no-underline text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--gold)' }}>
              Контакты
            </h4>
            <div className="flex flex-col gap-3" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <div className="flex items-center gap-2">
                <span>🕐</span> <span>Ежедневно: 12:00 — 02:00</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📍</span> <span>г. Москва</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📱</span> <span>Telegram: @sportlounge</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 text-center" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} SPORT LOUNGE. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
