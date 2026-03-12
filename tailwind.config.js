/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ec: {
          bg: 'var(--ec-bg)',
          sidebar: 'var(--ec-sidebar)',
          card: 'var(--ec-card)',
          'card-hover': 'var(--ec-card-hover)',
          border: 'var(--ec-border)',
          div: 'var(--ec-div)',
          t1: 'var(--ec-t1)',
          t2: 'var(--ec-t2)',
          t3: 'var(--ec-t3)',
          t4: 'var(--ec-t4)',
          t5: 'var(--ec-t5)',
          em: 'var(--ec-em)',
          'em-dark': 'var(--ec-em-dark)',
          'em-faint': 'var(--ec-em-faint)',
          'em-bg': 'var(--ec-em-bg)',
          'em-border': 'var(--ec-em-border)',
          warn: 'var(--ec-warn)',
          'warn-light': 'var(--ec-warn-light)',
          'warn-faint': 'var(--ec-warn-faint)',
          'warn-bg': 'var(--ec-warn-bg)',
          'warn-border': 'var(--ec-warn-border)',
          crit: 'var(--ec-crit)',
          'crit-light': 'var(--ec-crit-light)',
          'crit-faint': 'var(--ec-crit-faint)',
          'crit-bg': 'var(--ec-crit-bg)',
          'crit-border': 'var(--ec-crit-border)',
          info: 'var(--ec-info)',
          'info-light': 'var(--ec-info-light)',
          'info-bg': 'var(--ec-info-bg)',
          'info-border': 'var(--ec-info-border)',
          high: 'var(--ec-crit)',
          medium: 'var(--ec-warn)',
          low: 'var(--ec-em)',
          z6: 'var(--ec-z6)',
          z9: '#18181b',
        },
      },
      backgroundImage: {
        'ec-grad-em':     'var(--ec-grad-em)',
        'ec-grad-warn':   'var(--ec-grad-warn)',
        'ec-grad-crit':   'var(--ec-grad-crit)',
        'ec-grad-info':   'var(--ec-grad-info)',
        'ec-grad-blue':   'var(--ec-grad-blue)',
        'ec-grad-muted':  'var(--ec-grad-muted)',
        'ec-grad-hero':   'var(--ec-grad-hero)',
        'ec-grad-teal':   'var(--ec-grad-teal)',
        'ec-grad-purple': 'var(--ec-grad-purple)',
        // Mesh page backgrounds
        'mesh-light': 'radial-gradient(ellipse at 20% 0%, rgba(16,185,129,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(99,91,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(0,115,230,0.05) 0%, transparent 50%)',
        'mesh-dark': 'radial-gradient(ellipse at 20% 0%, rgba(16,185,129,0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(99,91,255,0.07) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(0,115,230,0.05) 0%, transparent 50%)',
        // Hero banner
        'hero-banner': 'linear-gradient(135deg, #0a2540 0%, #0f3d2b 45%, #1a1a4e 100%)',
        // Sidebar logo area
        'sidebar-logo': 'linear-gradient(135deg, #0f2d1e 0%, #1a3a4a 100%)',
        // Emerald button gradient
        'btn-primary': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        // Page header (inner pages)
        'page-header': 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(99,91,255,0.05) 100%)',
        // Active nav highlight
        'nav-active': 'linear-gradient(90deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)',
        // Brand logo pill
        'logo-pill': 'linear-gradient(135deg, #10b981, #059669)',
        // User avatar
        'avatar-em': 'linear-gradient(135deg, var(--ec-em), var(--ec-em-dark))',
        // Glow blobs (decorative)
        'glow-em': 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 60%)',
        'glow-purple': 'radial-gradient(circle, rgba(99,91,255,0.2) 0%, transparent 60%)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'DM Mono',
          'JetBrains Mono',
          'SF Mono',
          'monospace',
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
