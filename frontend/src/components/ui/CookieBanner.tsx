'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user already accepted cookie
    const accepted = localStorage.getItem('sport_lounge_cookie_accepted');
    if (accepted === 'true') return;

    // Check if smart feature "cookie_banner" is enabled
    api.getSmartFeatures()
      .then((features) => {
        const bannerFeature = features.find(f => f.feature_key === 'cookie_banner');
        if (bannerFeature?.is_enabled) {
          setVisible(true);
        }
      })
      .catch((err) => {
        console.error('Error fetching smart features for CookieBanner:', err);
      });
  }, []);

  const handleAccept = () => {
    localStorage.setItem('sport_lounge_cookie_accepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-sm z-50 animate-slide-up">
      <div className="card p-5 glass shadow-2xl" style={{ border: '1px solid rgba(212,165,116,0.2)' }}>
        <div className="flex items-start gap-3">
          <span className="text-xl">🍪</span>
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--gold-light)' }}>Мы используем cookies</h4>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              Продолжая использовать наш сайт, вы соглашаетесь с политикой конфиденциальности и обработкой файлов cookie.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleAccept}
                className="text-xs px-3.5 py-1.5 rounded-lg border-none cursor-pointer btn-gold font-medium"
              >
                Принять
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
