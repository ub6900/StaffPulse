export type ThemeStyle = 'vibrant_prism' | 'slate' | 'emerald_indigo' | 'warm_amber' | 'corporate_blue';

export interface ThemeConfig {
  name: string;
  bgApp: string;
  primaryBg: string;
  primaryHover: string;
  primaryText: string;
  primaryBorder: string;
  lightBg: string;
  badgeBg: string;
  ringColor: string;
}

export function getThemeConfig(theme?: ThemeStyle): ThemeConfig {
  switch (theme) {
    case 'vibrant_prism':
    default:
      return {
        name: 'Vibrant Prism Gradient',
        bgApp: 'bg-gradient-to-br from-indigo-100/60 via-purple-50/70 to-pink-100/60 text-slate-900',
        primaryBg: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20',
        primaryHover: 'hover:opacity-90',
        primaryText: 'text-purple-700',
        primaryBorder: 'border-purple-200',
        lightBg: 'bg-gradient-to-r from-indigo-50/80 to-purple-50/80',
        badgeBg: 'bg-gradient-to-r from-indigo-100 to-purple-100 text-purple-900 font-semibold',
        ringColor: 'focus:ring-purple-500',
      };
    case 'emerald_indigo':
      return {
        name: 'Emerald & Indigo SaaS',
        bgApp: 'bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-indigo-50/60 text-slate-900',
        primaryBg: 'bg-emerald-600 text-white',
        primaryHover: 'hover:bg-emerald-700',
        primaryText: 'text-emerald-700',
        primaryBorder: 'border-emerald-200',
        lightBg: 'bg-emerald-50',
        badgeBg: 'bg-emerald-100 text-emerald-800',
        ringColor: 'focus:ring-emerald-500',
      };
    case 'warm_amber':
      return {
        name: 'Executive Warm Amber',
        bgApp: 'bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-yellow-50/60 text-slate-900',
        primaryBg: 'bg-amber-600 text-white',
        primaryHover: 'hover:bg-amber-700',
        primaryText: 'text-amber-800',
        primaryBorder: 'border-amber-200',
        lightBg: 'bg-amber-50',
        badgeBg: 'bg-amber-100 text-amber-900',
        ringColor: 'focus:ring-amber-500',
      };
    case 'corporate_blue':
      return {
        name: 'Corporate Deep Blue',
        bgApp: 'bg-gradient-to-br from-blue-50/60 via-sky-50/40 to-indigo-50/60 text-slate-900',
        primaryBg: 'bg-blue-600 text-white',
        primaryHover: 'hover:bg-blue-700',
        primaryText: 'text-blue-800',
        primaryBorder: 'border-blue-200',
        lightBg: 'bg-blue-50',
        badgeBg: 'bg-blue-100 text-blue-900',
        ringColor: 'focus:ring-blue-500',
      };
    case 'slate':
      return {
        name: 'Modern Minimal Slate',
        bgApp: 'bg-slate-100/70 text-slate-900',
        primaryBg: 'bg-slate-900 text-white',
        primaryHover: 'hover:bg-slate-800',
        primaryText: 'text-indigo-600',
        primaryBorder: 'border-slate-200',
        lightBg: 'bg-slate-100',
        badgeBg: 'bg-slate-200 text-slate-800',
        ringColor: 'focus:ring-indigo-500',
      };
  }
}
