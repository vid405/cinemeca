/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bebas Neue"', 'Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#070e1a',
          900: '#0b1424',
          850: '#0f1a2e',
          800: '#132038',
          700: '#1a2a47',
          600: '#22345a',
          500: '#2f4570',
          400: '#5b6f96',
          300: '#8d9dbd',
          200: '#b9c4da',
        },
        hit: '#2ecc71',
        near: '#fbb12b',
      },
      keyframes: {
        'flip-in': {
          '0%': { opacity: '0', transform: 'perspective(600px) rotateX(-90deg)' },
          '100%': { opacity: '1', transform: 'perspective(600px) rotateX(0deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'flip-in': 'flip-in 0.5s ease-out both',
        'fade-up': 'fade-up 0.4s ease-out both',
        'pop-in': 'pop-in 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
