/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ec: {
          bg: '#0a0a0a',
          sidebar: '#070707',
          card: 'rgba(255,255,255,0.025)',
          'card-hover': 'rgba(255,255,255,0.045)',
          border: 'rgba(255,255,255,0.06)',
          div: 'rgba(255,255,255,0.04)',
          t1: '#e4e4e7',
          t2: 'rgba(255,255,255,0.5)',
          t3: 'rgba(255,255,255,0.25)',
          t4: 'rgba(255,255,255,0.15)',
          t5: 'rgba(255,255,255,0.08)',
          em: '#10b981',
          'em-dark': '#059669',
          'em-faint': 'rgba(16,185,129,0.06)',
          warn: '#f59e0b',
          'warn-light': '#fcd34d',
          'warn-faint': 'rgba(245,158,11,0.08)',
          crit: '#ef4444',
          'crit-light': '#fca5a5',
          'crit-faint': 'rgba(239,68,68,0.06)',
          info: '#6366f1',
          'info-light': '#a5b4fc',
          high: '#ef4444',
          medium: '#f59e0b',
          low: '#10b981',
          z6: '#52525b',
          z9: '#18181b',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'sans-serif',
        ],
      },
      animation: {
        'ec-pulse': 'ecPulse 2s ease-in-out infinite',
        'ec-fadeup': 'ecFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'ec-ring': 'ecRingFill 1s cubic-bezier(0.4,0,0.2,1) both',
        'ec-breath': 'ecBreath 3s ease-in-out infinite',
        'ec-check': 'ecCheckPop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        'ec-draw': 'ecDraw 1.2s ease-in-out both',
        'ec-confetti': 'ecConfetti 1.2s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'ec-flash': 'ecFlash 0.8s ease-out',
        'ec-slidedown': 'ecSlideDown 0.2s ease-out',
        'ec-bellshake': 'ecBellShake 0.5s ease-in-out',
      },
      keyframes: {
        ecPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        ecFadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        ecRingFill: {
          from: { 'stroke-dashoffset': 'var(--ec-circ)' },
          to: { 'stroke-dashoffset': 'var(--ec-off)' },
        },
        ecBreath: {
          '0%, 100%': { 'box-shadow': '0 0 16px rgba(239,68,68,0.03)' },
          '50%': { 'box-shadow': '0 0 24px rgba(239,68,68,0.1)' },
        },
        ecCheckPop: {
          '0%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        ecDraw: {
          to: { 'stroke-dashoffset': '0' },
        },
        ecConfetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-120px) rotate(720deg)', opacity: '0' },
        },
        ecFlash: {
          '0%': { opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        ecSlideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        ecBellShake: {
          '0%, 100%': { transform: 'rotate(0)' },
          '20%': { transform: 'rotate(12deg)' },
          '40%': { transform: 'rotate(-10deg)' },
          '60%': { transform: 'rotate(6deg)' },
          '80%': { transform: 'rotate(-3deg)' },
        },
      },
    },
  },
  plugins: [],
}
