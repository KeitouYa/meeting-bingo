/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // PRD §6.6 design tokens — single source of truth for all components
        square: {
          default: '#ffffff',
          'default-text': '#1f2937',
          filled: '#dbeafe',        // pale blue-100; requires dark text
          'filled-text': '#1f2937', // dark gray — WCAG AA on #dbeafe (~8:1)
          'auto-filled': '#bfdbfe', // blue-200; slightly more saturated than manual fill
          'auto-filled-text': '#1f2937',
          free: '#f3f4f6',          // gray-100
          'free-text': '#4b5563',   // gray-600; ~5.9:1 on #f3f4f6 passes WCAG AA
          winning: '#15803d',       // green-700; white text ~5.1:1 passes WCAG AA
          'winning-text': '#ffffff',
        },
        brand: {
          primary: '#2563eb',       // blue-600
          accent: '#7c3aed',        // violet-600 for listening indicator (not red)
        },
      },
    },
  },
  plugins: [],
}
