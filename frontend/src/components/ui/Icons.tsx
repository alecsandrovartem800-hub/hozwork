import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export const HookahIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Steam/Дым над чашей */}
    <path d="M10 1.5c.3.5-.3 1 .2 1.5M12 1c.3.5-.3 1 .2 1.5M14 1.5c.3.5-.3 1 .2 1.5" opacity="0.7" />
    {/* Bowl / Чаша кальяна */}
    <path d="M9 4.5h6v1.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 6V4.5z" />
    <line x1="8.5" y1="4.5" x2="15.5" y2="4.5" />
    {/* Tray / Блюдце */}
    <path d="M5 8.5h14l-1 2H6l-1-2z" />
    <path d="M7 8.5h10" opacity="0.5" />
    {/* Shaft / Шахта с декоративными элементами (двойной контур) */}
    <line x1="11.2" y1="10.5" x2="11.2" y2="17" />
    <line x1="12.8" y1="10.5" x2="12.8" y2="17" />
    <circle cx="12" cy="12.5" r="1.8" />
    <circle cx="12" cy="15" r="1.2" />
    {/* Base / Колба */}
    <path d="M12 17c-2.5 0-4.5 1-4.5 3.5a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1c0-2.5-2-3.5-4.5-3.5z" />
    <path d="M8.5 20c1 0 1.5-.5 3.5-.5s2.5.5 3.5.5" opacity="0.6" strokeWidth="0.8" /> {/* Уровень воды */}
    {/* Hose port & hose / Шланг */}
    <path d="M7.5 18.5H5.5A1.5 1.5 0 0 1 4 17V8c0-1.5 1-2.5 2-2.5s2 1 2 2.5v4" />
    <path d="M16.5 18.5h1.8a1.7 1.7 0 0 0 1.7-1.7V9" />
    {/* Mouthpiece / Мундштук */}
    <path d="M20 9V4.5" />
    <line x1="19.2" y1="4.5" x2="20.8" y2="4.5" />
  </svg>
);

export const LeafIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Double stroke outer boundary / Двойной лист */}
    <path d="M12.5 20.5A7.5 7.5 0 0 1 11 5.5C17.5 4.5 19 8 19 11c0 4.5-3 8-6.5 9.5z" />
    <path d="M11.5 19.3a6.5 6.5 0 0 1-1-12.3c5.3-.8 6.5 2 6.5 4.5 0 3.7-2.3 6.7-5.5 7.8z" opacity="0.5" />
    {/* Central stem / Центральный стебель */}
    <path d="M10.5 21.5c3.2-3.2 7.4-6.4 8.5-11.5" />
    {/* Veins / Прожилки */}
    <path d="M14.5 14.5c1.5-1 3-2 3.5-3.5" />
    <path d="M11.5 17.5c1.5-1 3.5-2 4-3.5" />
    <path d="M9 13.5c1.2-.8 2.2-1.5 2.7-2.5" opacity="0.7" />
  </svg>
);

export const MusicIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
    {/* Decorative double stroke */}
    <path d="M9 7l12-2" opacity="0.5" strokeWidth="0.8" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Main star (double outline) */}
    <path d="M10 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
    <path d="M10 4.5l1.2 3.3 3.3 1.2-3.3 1.2-1.2 3.3-1.2-3.3-3.3-1.2 3.3-1.2 1.2-3.3z" opacity="0.4" strokeWidth="0.8" />
    {/* Secondary star 1 */}
    <path d="M18 13l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z" />
    {/* Secondary star 2 */}
    <path d="M5 14l0.8 1.8 1.8 0.8-1.8 0.8-0.8 1.8-0.8-1.8-1.8-0.8 1.8-0.8 0.8-1.8z" />
  </svg>
);

export const LiquidWaterIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 21.5a6.5 6.5 0 0 0 6.5-6.5c0-4-6.5-12-6.5-12S5.5 11 5.5 15a6.5 6.5 0 0 0 6.5 6.5z" />
    <path d="M12 19.5a4.5 4.5 0 0 0 4.5-4.5c0-2.5-4.5-8.5-4.5-8.5S7.5 12.5 7.5 15a4.5 4.5 0 0 0 4.5 4.5z" opacity="0.5" />
  </svg>
);

export const LiquidMilkIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Milk bottle shape */}
    <path d="M7 4h10l1.5 3v13.5H5.5V7L7 4z" />
    <path d="M8.5 5h7l1 2h-9l1-2z" opacity="0.6" />
    <line x1="5.5" y1="8" x2="18.5" y2="8" />
    <path d="M8 13.5c2 0 2 1.5 4 1.5s2-1.5 4-1.5" />
    <path d="M8 16.5c2 0 2 1.5 4 1.5s2-1.5 4-1.5" opacity="0.5" />
  </svg>
);

export const LiquidJuiceIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="13.5" r="7.5" />
    <circle cx="12" cy="13.5" r="6.2" opacity="0.5" strokeWidth="0.8" />
    <path d="M15 6.5l3-4.5h2" />
    <path d="M12 13.5l2.6-6.5" />
    <line x1="12" y1="7.3" x2="12" y2="19.7" opacity="0.6" />
    <line x1="6" y1="13.5" x2="18" y2="13.5" opacity="0.6" />
    <line x1="7.8" y1="9.3" x2="16.2" y2="17.7" opacity="0.4" />
    <line x1="7.8" y1="17.7" x2="16.2" y2="9.3" opacity="0.4" />
  </svg>
);

export const LiquidWineIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 14.5a4.5 4.5 0 0 0 4.5-4.5V4.5H7.5V10a4.5 4.5 0 0 0 4.5 4.5z" />
    <path d="M8.5 8.5h7c-.5 2-2 3-3.5 3s-3-1-3.5-3z" fill="none" opacity="0.6" />
    <line x1="12" y1="14.5" x2="12" y2="20.5" />
    <path d="M8.5 20.5h7" />
    <path d="M9.5 19.5h5" opacity="0.5" />
  </svg>
);

export const LiquidIceIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.2" />
    <path d="M3.5 7.5h7.5M7.5 3.5v7.5" opacity="0.4" />
    <rect x="12.5" y="12.5" width="7.5" height="7.5" rx="1.2" />
    <path d="M12.5 16.5h7.5M16.5 12.5v7.5" opacity="0.4" />
    <rect x="12.5" y="3.5" width="7.5" height="7.5" rx="1.2" />
    <path d="M12.5 7.5h7.5M16.5 3.5v7.5" opacity="0.4" />
  </svg>
);

export const LiquidEnergyIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="12" r="8.2" opacity="0.4" strokeWidth="0.8" />
    <polygon points="13.5 6.5 8 13.5 12.5 13.5 10.5 17.5 16 10.5 11.5 10.5 13.5 6.5" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="12" r="8" opacity="0.4" strokeWidth="0.8" />
    <polyline points="12 5.5 12 12 15.5 14" />
  </svg>
);

export const WalletIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19.5 12.5V8.5H5.5A1.5 1.5 0 0 1 4 7c0-1 .8-1.5 1.5-1.5h13V8.5" />
    <path d="M4.2 7V17c0 1.5 1 2.5 2.3 2.5h13V15.5" />
    <path d="M16.5 12.5a1.5 1.5 0 0 0-1.5 1.5v1.5a1.5 1.5 0 0 0 1.5 1.5h4v-4.5h-4z" />
  </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16.5 20.5v-1.5a3.5 3.5 0 0 0-3.5-3.5h-7a3.5 3.5 0 0 0-3.5 3.5v1.5" />
    <circle cx="9.5" cy="7.5" r="3.5" />
    <path d="M9.5 10.5a3 3 0 0 0 0-6" opacity="0.4" strokeWidth="0.8" />
    <path d="M21.5 20.5v-1.5a3.5 3.5 0 0 0-2.8-3.4" opacity="0.7" />
    <path d="M15.5 4.3a3.5 3.5 0 0 1 0 6.4" opacity="0.7" />
  </svg>
);

export const CrownIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.5 4.5l2.5 10.5h14l2.5-10.5-5 5.5-4.5-6-4.5 6-5-5.5z" />
    <path d="M3.5 18.5h17v-1.5h-17v1.5z" />
    <line x1="5.5" y1="15" x2="18.5" y2="15" opacity="0.6" />
  </svg>
);

export const PenIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11.5 19.5h8.5" />
    <path d="M15.5 3.5a1.8 1.8 0 0 1 2.5 2.5L6.5 17.5l-3.5 1 1-3.5L15.5 3.5z" />
    <line x1="14.5" y1="4.5" x2="16.5" y2="6.5" opacity="0.6" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="19.5 6.5 9 17 4.5 12.5" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5.5" x2="12" y2="18.5" />
    <line x1="5.5" y1="12" x2="18.5" y2="12" />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.5 20.5H5.5a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2h4M10 4.5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h4" opacity="0.5" />
    <polyline points="15.5 16.5 20.5 11.5 15.5 6.5" />
    <line x1="20.5" y1="11.5" x2="9.5" y2="11.5" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="4.5" y1="12" x2="19.5" y2="12" />
    <polyline points="12.5 5 19.5 12 12.5 19" />
  </svg>
);

export const OrderIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M13.5 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8.5L13.5 2.5z" />
    <path d="M13.5 3v5.5H19" opacity="0.6" />
    <line x1="15.5" y1="13.5" x2="8.5" y2="13.5" />
    <line x1="15.5" y1="17.5" x2="8.5" y2="17.5" />
    <line x1="10.5" y1="9.5" x2="8.5" y2="9.5" opacity="0.6" strokeWidth="0.8" />
  </svg>
);

export const WarningIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.2 3.8l-8.4 14.2a2 2 0 0 0 1.7 3H20.5a2 2 0 0 0 1.7-3L13.8 3.8a2 2 0 0 0-3.6 0z" />
    <path d="M10.8 5.2l-7.7 13a1 1 0 0 0 .8 1.5h16.2a1 1 0 0 0 .8-1.5l-7.7-13a1 1 0 0 0-1.8 0z" opacity="0.5" strokeWidth="0.8" />
    <line x1="12" y1="9.5" x2="12" y2="13.5" />
    <circle cx="12" cy="17" r="0.8" fill="currentColor" />
  </svg>
);
