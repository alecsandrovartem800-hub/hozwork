'use client';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden smoke-bg">
          {/* Animated background */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(212,165,116,0.08) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(212,165,116,0.05) 0%, transparent 40%), radial-gradient(ellipse at 80% 60%, rgba(184,137,92,0.04) 0%, transparent 35%), var(--bg-primary)',
          }} />

          {/* Floating smoke particles */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: `${60 + i * 40}px`,
              height: `${60 + i * 40}px`,
              background: `radial-gradient(circle, rgba(212,165,116,${0.03 + i * 0.01}) 0%, transparent 70%)`,
              left: `${10 + i * 15}%`,
              bottom: `${10 + i * 10}%`,
              animation: `smokeDrift ${6 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }} />
          ))}

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <div className="animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <span className="text-6xl mb-6 block animate-float">🌿</span>
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-6 text-gold-gradient animate-fade-in"
                style={{ fontFamily: "'Playfair Display', serif", animationDelay: '0.4s', animationFillMode: 'both', lineHeight: 1.1 }}>
              SPORT LOUNGE
            </h1>

            <p className="text-xl sm:text-2xl mb-4 animate-fade-in"
               style={{ color: 'var(--text-secondary)', animationDelay: '0.6s', animationFillMode: 'both', fontWeight: 300 }}>
              Премиум кальянная
            </p>

            <p className="text-base sm:text-lg mb-10 max-w-2xl mx-auto animate-fade-in"
               style={{ color: 'var(--text-muted)', animationDelay: '0.8s', animationFillMode: 'both', lineHeight: 1.8 }}>
              Авторские миксы из лучших табаков мира, уютная атмосфера и безупречный сервис.
              Каждый кальян — это произведение искусства.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in"
                 style={{ animationDelay: '1s', animationFillMode: 'both' }}>
              <Link href="/order" className="no-underline btn-gold text-lg px-10 py-4 animate-glow">
                Заказать кальян
              </Link>
              <Link href="/menu" className="no-underline btn-outline text-lg px-10 py-4">
                Посмотреть меню
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse-slow">
            <div style={{ width: 24, height: 40, borderRadius: 12, border: '2px solid var(--gold-dark)', display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
              <div style={{ width: 3, height: 8, borderRadius: 2, background: 'var(--gold)', animation: 'slideDown 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 relative" style={{ background: 'var(--bg-card)' }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gold-gradient"
                style={{ fontFamily: "'Playfair Display', serif" }}>
              Почему выбирают нас
            </h2>
            <p className="text-center mb-16" style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 4rem' }}>
              Мы создаём атмосферу, в которой каждый чувствует себя особенным
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
              {[
                { icon: '🍃', title: 'Премиум табаки', desc: '30+ вкусов от ведущих мировых брендов: Darkside, Tangiers, Fumari, Must Have и другие' },
                { icon: '🎵', title: 'Уютная атмосфера', desc: 'Лаунж музыка, приглушённый свет и ароматерапия — каждая деталь продумана до мелочей' },
                { icon: '⚡', title: 'Быстрый сервис', desc: 'Умная система очередей и автоматическое распределение заказов между мастерами' },
              ].map((feature, i) => (
                <div key={i} className="card p-8 text-center group cursor-default">
                  <span className="text-5xl block mb-5 transition-transform duration-300 group-hover:scale-110">
                    {feature.icon}
                  </span>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--gold-light)', fontFamily: "'Playfair Display', serif" }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-gold-gradient"
                style={{ fontFamily: "'Playfair Display', serif" }}>
              Как это работает
            </h2>

            <div className="flex flex-col gap-8 stagger-children">
              {[
                { step: '01', title: 'Выберите вкусы', desc: 'Составьте уникальный микс из доступных табаков или доверьтесь мастеру' },
                { step: '02', title: 'Выберите жидкость', desc: 'Вода, молоко, сок, вино или лёд — каждая база раскрывает вкус по-своему' },
                { step: '03', title: 'Отправьте заказ', desc: 'Мастер получит ваш заказ мгновенно и приступит к приготовлению' },
                { step: '04', title: 'Отслеживайте', desc: 'Следите за статусом заказа в реальном времени — от создания до подачи' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-6 card p-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold"
                       style={{ background: 'rgba(212,165,116,0.15)', color: 'var(--gold)' }}>
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 relative smoke-bg" style={{ background: 'var(--bg-card)' }}>
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gold-gradient"
                style={{ fontFamily: "'Playfair Display', serif" }}>
              Готовы попробовать?
            </h2>
            <p className="mb-8" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Закажите кальян прямо сейчас и мы начнём готовить его для вас
            </p>
            <Link href="/order" className="no-underline btn-gold text-lg px-12 py-4">
              Заказать кальян →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
