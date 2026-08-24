/** @type {import('tailwindcss').Config} */

// ============================================================
// Tailwind Configuration
// ============================================================
// Custom "dm" (Dunder Mifflin) color palette, echoing the
// show's real logo — navy blue globe, warm gold/red accent —
// kept corporate and understated rather than cartoonish.
// ============================================================

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dm: {
          navy: '#1B2A4A',
          navyLight: '#2C3E5F',
          gold: '#C9A63C',
          goldLight: '#E0C468',
          gray: '#F4F5F7',
          border: '#DDE1E6',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};