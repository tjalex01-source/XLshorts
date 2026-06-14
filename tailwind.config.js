/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        accent: '#e8a020',
        'accent-dark': '#d4911a',
        surface: '#141414',
        card: '#1a1a1a',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease forwards',
      },
      backgroundOpacity: {
        8: '0.08',
      },
    },
  },
  plugins: [],
};
