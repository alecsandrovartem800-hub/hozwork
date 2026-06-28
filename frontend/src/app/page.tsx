'use client';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { HookahIcon, LeafIcon, MusicIcon, ClockIcon } from '@/components/ui/Icons';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden smoke-bg">
          {/* Animated background */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(217,178,130,0.06) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(217,178,130,0.04) 0%, transparent 45%), radial-gradient(ellipse at 80% 60%, rgba(184,137,92,0.03) 0%, transparent 40%), var(--bg-primary)',
          }} />

          {/* Floating smoke particles */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: `${60 + i * 40}px`,
              height: `${60 + i * 40}px`,
              background: `radial-gradient(circle, rgba(217,178,130,${0.02 + i * 0.005}) 0%, transparent 70%)`,
              left: `${10 + i * 15}%`,
              bottom: `${10 + i * 10}%`,
              animation: `smokeDrift ${7 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }} />
          ))}

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <div className="animate-fade-in flex justify-center mb-8" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <HookahIcon size={72} color="var(--gold)" className="animate-float" />
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-6 text-gold-gradient tracking-[0.1em] animate-fade-in"
                style={{ fontFamily: "'Playfair Display', serif", animationDelay: '0.4s', animationFillMode: 'both', lineHeight: 1.1 }}>
              SPORT LOUNGE
            </h1>

            <p className="text-sm sm:text-base mb-6 animate-fade-in uppercase tracking-[0.3em]"
               style={{ color: 'var(--text-secondary)', animationDelay: '0.6s', animationFillMode: 'both', fontWeight: 500 }}>
              Премиальное кальянное пространство
            </p>

            <p className="text-base sm:text-lg mb-12 max-w-2xl mx-auto animate-fade-in"
               style={{ color: 'var(--text-secondary)', animationDelay: '0.8s', animationFillMode: 'both', lineHeight: 1.8, fontWeight: 300 }}>
              Эксклюзивные авторские миксы от лучших мастеров, изысканная атмосфера уединения и безупречный премиальный сервис. Каждая деталь продумана для вашего идеального отдыха.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center animate-fade-in"
                 style={{ animationDelay: '1s', animationFillMode: 'both' }}>
              <Link href="/create" className="no-underline btn-gold text-xs font-semibold px-10 py-4 animate-glow">
                Заказать кальян
              </Link>
              <Link href="/menu" className="no-underline btn-outline text-xs font-semibold px-10 py-4">
                Посмотреть меню
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-pulse-slow">
            <div style={{ width: 22, height: 38, borderRadius: 11, border: '1px solid rgba(217,178,130,0.3)', display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
              <div style={{ width: 2, height: 6, borderRadius: 1, background: 'var(--gold)', animation: 'slideDown 1.8s ease-in-out infinite' }} />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-28 px-4 relative" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gold-gradient"
                style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.01em' }}>
              Философия SPORT LOUNGE
            </h2>
            <p className="text-center mb-20 text-sm uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 5rem' }}>
              Искусство расслабления в деталях
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
              {[
                { icon: <LeafIcon size={40} color="var(--gold)" />, title: 'Эксклюзивная коллекция', desc: 'Уникальные бренды табака со всего мира. Тонкий подбор крепости и жаростойкости под каждого гостя.' },
                { icon: <MusicIcon size={40} color="var(--gold)" />, title: 'Атмосфера гармонии', desc: 'Авторский звуковой ландшафт, мягкий приглушенный неон и тонкая ароматерапия для полного расслабления.' },
                { icon: <ClockIcon size={40} color="var(--gold)" />, title: 'Безупречный сервис', desc: 'Интеллектуальная система распределения заказов обеспечивает минимальное время ожидания.' },
              ].map((feature, i) => (
                <div key={i} className="card p-10 text-center group cursor-default shadow-premium shadow-premium-hover" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex justify-center mb-6 transition-transform duration-500 group-hover:scale-110">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gold-light)', fontFamily: "'Playfair Display', serif" }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9rem', fontWeight: 300 }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-28 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gold-gradient"
                style={{ fontFamily: "'Playfair Display', serif" }}>
              Ритуал создания
            </h2>
            <p className="text-center mb-20 text-sm uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
              Четыре шага к вашему идеальному кальяну
            </p>

            <div className="flex flex-col gap-8 stagger-children">
              {[
                { step: 'I', title: 'Палитра вкуса', desc: 'Создайте свой собственный микс из премиальных табаков в удобном конструкторе или активируйте ИИ-миксолога.' },
                { step: 'II', title: 'Основа чаши', desc: 'Выберите жидкость для колбы: классическая вода, нежное молоко, сок, вино или бодрящий лед.' },
                { step: 'III', title: 'Мгновенная передача', desc: 'Заказ моментально попадает к свободному мастеру, который тут же приступает к ритуалу приготовления.' },
                { step: 'IV', title: 'Контроль подачи', desc: 'Отслеживайте этапы готовности кальяна на интерактивной шкале в реальном времени.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-8 card p-8 shadow-premium" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-sm font-semibold tracking-[0.1em]"
                       style={{ background: 'rgba(217,178,130,0.05)', color: 'var(--gold)', border: '1px solid var(--border)' }}>
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, fontWeight: 300 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 relative smoke-bg" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gold-gradient"
                style={{ fontFamily: "'Playfair Display', serif" }}>
              Начните ритуал
            </h2>
            <p className="mb-10 text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)', fontWeight: 300 }}>
              Сделайте заказ онлайн, и мастер начнет приготовление кальяна, соответствующего вашему настроению
            </p>
            <Link href="/create" className="no-underline btn-gold text-xs font-semibold px-12 py-4 animate-glow">
              Заказать кальян
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
