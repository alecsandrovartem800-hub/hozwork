'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';
  const { user } = useAuthStore();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(redirect);
    }
  }, [user, redirect, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;
      
      toast.success('Вы успешно вошли в систему');
      router.push(redirect);
    } catch (err: any) {
      console.error('Ошибка входа:', err);
      setErrorMsg(err.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback',
        },
      });

      if (error) throw error;

      toast.success('Регистрация прошла успешно! Проверьте почту для подтверждения.');
      // Очищаем форму и переключаем на вход
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setActiveTab('login');
    } catch (err: any) {
      console.error('Ошибка регистрации:', err);
      setErrorMsg(err.message || 'Ошибка регистрации. Попробуйте другой email.');
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow flex items-center justify-center py-16 px-4 bg-gray-50/50">
        <div className="w-full max-w-md">
          <Card hoverEffect={false} className="shadow-lg border border-gray-100 p-8 space-y-6">
            {/* Tabs Headers */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg('');
                }}
                className={cn(
                  'flex-1 text-center pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer',
                  activeTab === 'login'
                    ? 'border-green-700 text-green-700'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                )}
              >
                Вход
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg('');
                }}
                className={cn(
                  'flex-1 text-center pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer',
                  activeTab === 'register'
                    ? 'border-green-700 text-green-700'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                )}
              >
                Регистрация
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium leading-relaxed">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Form */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Электронная почта"
                  type="email"
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.ru"
                  required
                />
                <Input
                  label="Пароль"
                  type="password"
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Button type="submit" isLoading={loading} variant="primary" fullWidth className="py-2.5 font-bold cursor-pointer">
                  Войти
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Электронная почта"
                  type="email"
                  id="register-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.ru"
                  required
                />
                <Input
                  label="Пароль"
                  type="password"
                  id="register-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  required
                />
                <Input
                  label="Подтверждение пароля"
                  type="password"
                  id="register-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  required
                />
                <Button type="submit" isLoading={loading} variant="primary" fullWidth className="py-2.5 font-bold cursor-pointer">
                  Зарегистрироваться
                </Button>
              </form>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
