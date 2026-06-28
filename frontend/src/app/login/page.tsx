'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';
import { HookahIcon } from '@/components/ui/Icons';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If user is already logged in, redirect to profile
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/profile');
      }
    });
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile/`,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message || 'Ошибка входа');
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full filter blur-[150px] opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)' }} />

        <div className="max-w-md w-full px-4 relative z-10 animate-fade-in">
          <div className="card p-8 text-center relative overflow-hidden" style={{ border: '1px solid rgba(212,165,116,0.15)' }}>
            <div className="flex justify-center mb-6">
              <HookahIcon size={44} color="var(--gold)" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
              SPORT LOUNGE
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              Вход в личный кабинет премиум кальянной
            </p>

            {error && (
              <div className="p-3 mb-6 rounded-xl text-xs text-left" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold border-none cursor-pointer transition-all duration-300 btn-gold animate-glow"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 rounded-full border-2 border-solid border-current border-t-transparent mr-2" />
                  Перенаправление к Google...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.772-6.19-6.19 0-3.42 2.78-6.19 6.19-6.19 1.54 0 2.946.567 4.027 1.498L20.9 4.88C18.66 2.94 15.68 1.8 12.24 1.8 6.44 1.8 1.8 6.44 1.8 12.24s4.64 10.44 10.44 10.44c6.11 0 10.16-4.29 10.16-10.33 0-.69-.06-1.35-.18-2.065h-9.98z" />
                  </svg>
                  Войти через Google
                </>
              )}
            </button>

            <div className="mt-8 text-xs" style={{ color: 'var(--text-muted)' }}>
              Авторизуясь на сайте, вы соглашаетесь с условиями обслуживания и политикой использования файлов cookie.
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
