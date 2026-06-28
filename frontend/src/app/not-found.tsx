import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden smoke-bg">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(212,165,116,0.06) 0%, transparent 50%)',
      }} />

      {/* Smoke particles */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: `${80 + i * 50}px`,
          height: `${80 + i * 50}px`,
          background: `radial-gradient(circle, rgba(212,165,116,${0.04}) 0%, transparent 70%)`,
          left: `${20 + i * 20}%`,
          bottom: '20%',
          animation: `smokeDrift ${7 + i * 2}s ease-in-out infinite`,
          animationDelay: `${i}s`,
        }} />
      ))}

      <div className="relative z-10 text-center px-4">
        <span className="text-8xl block mb-6 animate-float">🌿</span>
        <h1 className="text-7xl font-bold mb-4 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
          404
        </h1>
        <p className="text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
          Страница не найдена
        </p>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
          Кажется, дым рассеялся и страница исчезла
        </p>
        <Link href="/" className="no-underline btn-gold text-lg px-8 py-3">
          На главную
        </Link>
      </div>
    </main>
  );
}
