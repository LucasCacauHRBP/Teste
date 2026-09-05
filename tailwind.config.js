/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        choc: {
          DEFAULT: '#3E2723',
          light: '#6D4C41',
          dark: '#2B1B12',
        },
        caramel: '#C68B3C',
        beige: '#F5EFE6',
        alert: '#A6392F',
        good: '#3F7D45',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body: ['Calibri', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(43,27,18,0.12), 0 1px 2px rgba(43,27,18,0.08)',
      },
    },
  },
  plugins: [],
}
