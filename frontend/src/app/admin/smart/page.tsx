'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { SmartFeature } from '@/types';
import { SettingsIcon, UsersIcon, ClockIcon, OrderIcon, WarningIcon, MusicIcon, SparklesIcon, WalletIcon } from '@/components/ui/Icons';

const FEATURE_ICONS: Record<string, (color: string) => React.ReactNode> = {
  auto_assign: (color) => <UsersIcon size={20} color={color} />,
  auto_cancel: (color) => <ClockIcon size={20} color={color} />,
  auto_restock: (color) => <WarningIcon size={20} color={color} />,
  hide_empty: (color) => <SparklesIcon size={20} color={color} />,
  queue_estimation: (color) => <ClockIcon size={20} color={color} />,
  telegram_orders: (color) => <OrderIcon size={20} color={color} />,
  telegram_support: (color) => <OrderIcon size={20} color={color} />,
  kpi_snapshots: (color) => <WalletIcon size={20} color={color} />,
  loyalty: (color) => <SettingsIcon size={20} color={color} />,
  referrals: (color) => <SettingsIcon size={20} color={color} />,
  ai_mixologist: (color) => <SparklesIcon size={20} color={color} />,
  cookie_banner: (color) => <SettingsIcon size={20} color={color} />,
  push_notifications: (color) => <SettingsIcon size={20} color={color} />,
};

export default function AdminSmartPage() {
  const [features, setFeatures] = useState<SmartFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null);

  useEffect(() => {
    api.getSmartFeatures()
      .then(setFeatures)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (key: string, enabled: boolean) => {
    setFeatures((prev) => prev.map((f) => f.feature_key === key ? { ...f, is_enabled: enabled } : f));
    try {
      await api.toggleFeature(key, enabled);
    } catch (e: any) {
      setFeatures((prev) => prev.map((f) => f.feature_key === key ? { ...f, is_enabled: !enabled } : f));
      alert(e.message);
    }
  };

  const handleConfigChange = async (key: string, configKey: string, value: any) => {
    const feature = features.find((f) => f.feature_key === key);
    if (!feature) return;
    const newConfig = { ...feature.config, [configKey]: value };
    setFeatures((prev) => prev.map((f) => f.feature_key === key ? { ...f, config: newConfig } : f));
    try {
      await api.updateFeatureConfig(key, newConfig);
    } catch (e: any) { console.error(e); }
  };

  if (loading) return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>⚙️ Smart Features</h1>
      <div className="flex flex-col gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-gold-gradient" style={{ fontFamily: "'Playfair Display', serif" }}>
        ⚙️ Smart Features
      </h1>
      <p className="mb-8 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        Управление автоматизацией и логикой спорт-лаунжа
      </p>

      <div className="flex flex-col gap-4 stagger-children">
        {features.map((feature) => {
          const isActive = feature.is_enabled;
          const accentColor = isActive ? 'var(--gold)' : 'var(--text-muted)';
          
          return (
            <div key={feature.feature_key} className="card p-6 transition-all duration-500 shadow-premium"
              style={{
                borderLeft: `3px solid ${isActive ? 'var(--gold)' : 'var(--border)'}`,
                borderTop: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                boxShadow: isActive ? '0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 20px -5px rgba(217, 178, 130, 0.05)' : 'none',
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="p-2.5 rounded-xl border" style={{ background: 'rgba(255,255,255,0.01)', borderColor: isActive ? 'rgba(217,178,130,0.15)' : 'var(--border)' }}>
                    {FEATURE_ICONS[feature.feature_key] ? FEATURE_ICONS[feature.feature_key](accentColor) : <SettingsIcon size={20} color={accentColor} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {feature.label}
                    </h3>
                    {feature.description && (
                      <p className="text-xs mt-1 font-light" style={{ color: 'var(--text-muted)' }}>{feature.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Config expand button */}
                  {Object.keys(feature.config || {}).length > 0 && (
                    <button
                      onClick={() => setExpandedConfig(expandedConfig === feature.feature_key ? null : feature.feature_key)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer font-bold transition-all"
                      style={{ background: 'rgba(255,255,255,0.01)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                      настройка
                    </button>
                  )}

                  {/* Toggle */}
                  <div
                    className={`toggle ${isActive ? 'active' : ''}`}
                    onClick={() => handleToggle(feature.feature_key, !feature.is_enabled)}
                  />
                </div>
              </div>

              {/* Config section */}
              {expandedConfig === feature.feature_key && Object.keys(feature.config || {}).length > 0 && (
                <div className="mt-5 pt-4 flex flex-wrap gap-4" style={{ borderTop: '1px solid var(--border)' }}>
                  {Object.entries(feature.config).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {key === 'timeout_minutes' ? 'Таймаут (мин)' : key === 'avg_prep_minutes' ? 'Среднее время (мин)' : key}:
                      </label>
                      <input
                        className="input text-xs font-bold text-center"
                        type="number"
                        value={String(value)}
                        onChange={(e) => handleConfigChange(feature.feature_key, key, parseInt(e.target.value) || value)}
                        style={{ width: 80, padding: '8px' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
