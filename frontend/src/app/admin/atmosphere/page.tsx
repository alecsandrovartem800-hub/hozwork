'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { AtmosphereSetting } from '@/types';

export default function AdminAtmospherePage() {
  const [settings, setSettings] = useState<AtmosphereSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAtmosphere()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = async (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => s.setting_key === key ? { ...s, setting_value: value } : s));
    try {
      await api.updateAtmosphere(key, value);
    } catch (e: any) { console.error(e); }
  };

  const genreEmojis: Record<string, string> = {
    lounge: '🎶', jazz: '🎷', deep_house: '🎧', chill: '🌊', 'r&b': '🎤', ambient: '🌙',
  };
  const lightEmojis: Record<string, string> = {
    warm: '🌅', cool: '❄️', neon: '💜', candle: '🕯', rgb_party: '🌈', minimal: '⚪',
  };
  const aromaEmojis: Record<string, string> = {
    vanilla: '🍦', lavender: '💜', citrus: '🍊', ocean: '🌊', forest: '🌲', none: '❌',
  };

  if (loading) return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>🎵 Атмосфера</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
        🎵 Управление атмосферой
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        {settings.map((setting) => (
          <div key={setting.id} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{setting.label}</h3>
                {setting.description && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{setting.description}</p>
                )}
              </div>
            </div>

            {/* Select */}
            {setting.setting_type === 'select' && (
              <div className="flex flex-wrap gap-2">
                {(typeof setting.options === 'string' ? JSON.parse(setting.options) : setting.options || []).map((opt: string) => {
                  const emoji = genreEmojis[opt] || lightEmojis[opt] || aromaEmojis[opt] || '';
                  return (
                    <button key={opt} onClick={() => handleChange(setting.setting_key, opt)}
                      className="px-3 py-2 rounded-lg text-xs font-medium border-none cursor-pointer transition-all"
                      style={{
                        background: setting.setting_value === opt ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                        color: setting.setting_value === opt ? '#0a0a0a' : 'var(--text-secondary)',
                        border: `1px solid ${setting.setting_value === opt ? 'var(--gold)' : 'var(--border)'}`,
                      }}>
                      {emoji} {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Number (slider) */}
            {setting.setting_type === 'number' && (() => {
              const opts = typeof setting.options === 'string' ? JSON.parse(setting.options || '{}') : setting.options || {};
              return (
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{opts.min || 0}</span>
                  <input
                    type="range"
                    min={opts.min || 0}
                    max={opts.max || 100}
                    value={setting.setting_value}
                    onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                    className="flex-1"
                    style={{ accentColor: 'var(--gold)' }}
                  />
                  <span className="text-sm font-medium w-10 text-right" style={{ color: 'var(--gold)' }}>
                    {setting.setting_value}{setting.setting_key.includes('temp') ? '°' : '%'}
                  </span>
                </div>
              );
            })()}

            {/* Boolean */}
            {setting.setting_type === 'boolean' && (
              <div
                className={`toggle ${setting.setting_value === 'true' ? 'active' : ''}`}
                onClick={() => handleChange(setting.setting_key, setting.setting_value === 'true' ? 'false' : 'true')}
              />
            )}

            {/* Text */}
            {setting.setting_type === 'text' && (
              <textarea
                className="input text-sm"
                value={setting.setting_value}
                onChange={(e) => handleChange(setting.setting_key, e.target.value)}
                rows={2}
                style={{ resize: 'vertical' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
