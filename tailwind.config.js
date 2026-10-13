/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0b0f',
          900: '#121218',
          800: '#1b1b24',
          700: '#262632',
          600: '#34344a',
        },
      },
      keyframes: {
        'flip-in': {
          '0%': { opacity: '0', transform: 'perspective(600px) rotateX(-90deg)' },
          '100%': { opacity: '1', transform: 'perspective(600px) rotateX(0deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'flip-in': 'flip-in 0.45s ease-out both',
        'fade-up': 'fade-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
