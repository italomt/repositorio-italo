/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['media'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // iOS systemGroupedBackground / systemBackground
        bg: 'var(--bg)',
        groupedbg: 'var(--grouped-bg)',
        card: 'var(--card)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        muted2: 'var(--muted2)',
        border: 'var(--border)',
        separator: 'var(--separator)',
        fill: 'var(--fill)',

        // iOS system colors
        primary: 'var(--blue)',
        blue: 'var(--blue)',
        green: 'var(--green)',
        orange: 'var(--orange)',
        red: 'var(--red)',
        purple: 'var(--purple)',
        pink: 'var(--pink)',
        teal: 'var(--teal)',
        yellow: 'var(--yellow)',
        indigo: 'var(--indigo)',

        accent: 'var(--orange)',
        success: 'var(--green)',
        danger: 'var(--red)',
      },
      fontFamily: {
        sans: [
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        display: [
          '"Nunito"',
          '"Inter"',
          'system-ui',
          'sans-serif',
        ],
        mono: ['"SF Mono"', '"SFMono-Regular"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        ios: '14px',
        'ios-lg': '20px',
        'ios-xl': '28px',
      },
      boxShadow: {
        ios: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.08)',
        'ios-lg': '0 4px 16px rgba(0,0,0,0.06), 0 16px 40px -16px rgba(0,0,0,0.12)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        ios: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
}
