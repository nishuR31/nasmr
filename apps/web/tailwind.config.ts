/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0eeff',
          100: '#e3e0ff',
          200: '#cbc5ff',
          300: '#a99dff',
          400: '#8570ff',
          500: '#6C63FF', // primary
          600: '#5a4fe0',
          700: '#4a3fbf',
          800: '#3d339f',
          900: '#2e2578',
        },
        civic: {
          water:       '#3b9eff',
          road:        '#f59e0b',
          electricity: '#8b5cf6',
          sanitation:  '#ef4444',
          healthcare:  '#10b981',
          education:   '#06b6d4',
          transport:   '#f97316',
          other:       '#6b7280',
        },
        dark: {
          bg:      '#0a0a0f',
          surface: '#111118',
          card:    '#18181f',
          border:  '#2a2a35',
          muted:   '#3a3a48',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'count-up': 'count-up 1s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          from: { boxShadow: '0 0 20px rgba(108, 99, 255, 0.3)' },
          to:   { boxShadow: '0 0 40px rgba(108, 99, 255, 0.6)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
