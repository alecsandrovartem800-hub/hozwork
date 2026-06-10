'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 1. Получаем текущую сессию
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Получаем профиль из таблицы user_profiles
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData);
          } else {
            // Если профиль не найден (например, только зарегистрировался),
            // создадим временный клиентский профиль
            setProfile({
              id: session.user.id,
              email: session.user.email || '',
              role: 'client',
              created_at: new Date().toISOString()
            });
          }
        } else {
          logout();
        }
      } catch (error) {
        console.error('Ошибка инициализации авторизации:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Подписываемся на изменения состояния авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileData) {
            setProfile(profileData);
          } else {
            setProfile({
              id: session.user.id,
              email: session.user.email || '',
              role: 'client',
              created_at: new Date().toISOString()
            });
          }
        } else {
          logout();
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, logout, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium font-sans">Загрузка HOZWORK...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
