'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { SmartFeature } from '@/types';

const FEATURE_ICONS: Record<string, string> = {
  auto_assign: '🤖',
  auto_cancel: '⏰',
  auto_restock: '📦',
  hide_empty: '👁️',
  queue_estimation: '⏱️',
  telegram_orders: '📱',
  telegram_support: '💬',
  kpi_snapshots: '📊',
  loyalty: '💎',
  referrals: '🔗',
  ai_mixologist: '🤖',
  cookie_banner: '🍪',
  push_notifications: '🔔',
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
      <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        Управляйте автоматизацией — включайте и выключайте умные функции
      </p>

      <div className="flex flex-col gap-4 stagger-children">
        {features.map((feature) => (
          <div key={feature.feature_key} className="card p-5 transition-all duration-500"
            style={{
              borderLeft: `3px solid ${feature.is_enabled ? 'var(--success)' : 'var(--border)'}`,
              boxShadow: feature.is_enabled ? '0 0 20px rgba(74,222,128,0.05)' : 'none',
            }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{FEATURE_ICONS[feature.feature_key] || '⚡'}</span>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: feature.is_enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {feature.label}
                  </h3>
                  {feature.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{feature.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Config expand button */}
                {Object.keys(feature.config || {}).length > 0 && (
                  <button
                    onClick={() => setExpandedConfig(expandedConfig === feature.feature_key ? null : feature.feature_key)}
                    className="text-xs px-2 py-1 rounded border-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>
                    ⚙
                  </button>
                )}

                {/* Toggle */}
                <div
                  className={`toggle ${feature.is_enabled ? 'active' : ''}`}
                  onClick={() => handleToggle(feature.feature_key, !feature.is_enabled)}
                />
              </div>
            </div>

            {/* Config section */}
            {expandedConfig === feature.feature_key && Object.keys(feature.config || {}).length > 0 && (
              <div className="mt-4 pt-4 flex flex-wrap gap-4" style={{ borderTop: '1px solid var(--border)' }}>
                {Object.entries(feature.config).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {key === 'timeout_minutes' ? 'Таймаут (мин)' : key === 'avg_prep_minutes' ? 'Среднее время (мин)' : key}:
                    </label>
                    <input
                      className="input text-sm"
                      type="number"
                      value={String(value)}
                      onChange={(e) => handleConfigChange(feature.feature_key, key, parseInt(e.target.value) || value)}
                      style={{ width: 80 }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
