import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        border: 'var(--border)',
        green: 'var(--green)',
        blue: 'var(--blue)',
        red: 'var(--red)',
        orange: 'var(--orange)',
        yellow: 'var(--yellow)',
        muted: 'var(--text-muted)',
        // Legacy aliases
        midnight: 'var(--bg)',
        primary: {
          400: 'var(--blue)',
          500: 'var(--blue)',
          600: 'var(--blue)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
        thai: ['Noto Sans Thai', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
