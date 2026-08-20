import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#EDEAD9',
        paperDim: '#E4E0CC',
        card: '#FBFAF4',
        ink: '#182420',
        inkSoft: '#3C463E',
        pine: '#1F3B33',
        pineDeep: '#132621',
        brass: '#B8863B',
        brassLight: '#D9AE6B',
        brick: '#B14328',
        line: '#CFC9AE',
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(24,36,32,0.06), 0 8px 20px -8px rgba(24,36,32,0.18)',
        cardHover: '0 2px 4px rgba(24,36,32,0.08), 0 18px 32px -12px rgba(24,36,32,0.28)',
        stamp: '0 1px 3px rgba(24,36,32,0.35)',
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        scanline: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        scanline: 'scanline 1.6s ease-in-out infinite alternate',
        riseIn: 'riseIn 0.5s cubic-bezier(.2,.7,.3,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
