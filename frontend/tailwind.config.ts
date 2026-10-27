import type { Config } from 'tailwindcss';

// Cores vêm de variáveis CSS (globals.css): tema claro/escuro trocando só as variáveis.
const token = (nome: string) => `hsl(var(--${nome}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        line: token('line'),
        fg: token('fg'),
        muted: token('muted'),
        brand: { DEFAULT: token('brand'), fg: token('brand-fg'), soft: token('brand-soft') },
        success: { DEFAULT: token('success'), soft: token('success-soft') },
        warning: { DEFAULT: token('warning'), soft: token('warning-soft') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      boxShadow: {
        card: '0 1px 2px hsl(var(--shadow) / 0.06), 0 1px 3px hsl(var(--shadow) / 0.08)',
        pop: '0 12px 32px -8px hsl(var(--shadow) / 0.25)',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
        'pop-in': { from: { opacity: '0', transform: 'scale(.97)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-in': 'fade-in .18s ease-out', 'pop-in': 'pop-in .16s ease-out' },
    },
  },
  plugins: [],
};
export default config;
