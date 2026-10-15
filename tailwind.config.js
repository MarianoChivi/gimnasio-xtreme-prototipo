/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'] },
      colors: {
        brand: { 50: '#e8f6f2', 100: '#c9ebe2', 200: '#97d8c6', 300: '#5fc1a6', 400: '#2fa98a', 500: '#16a085', 600: '#128a72', 700: '#0f705d', 800: '#0d594b', 900: '#0b4a3f' },
        ink: { 50: '#f3f5f8', 100: '#e6eaf0', 200: '#cbd3de', 300: '#9aa8ba', 400: '#6b7c92', 500: '#4b5d74', 600: '#34495e', 700: '#2c3e50', 800: '#22313f', 900: '#18232e' },
        warn: { 50: '#fdf3e7', 500: '#e67e22', 600: '#cf6d17' },
        danger: { 50: '#fbecea', 500: '#c0392b', 600: '#a93226' },
      },
      boxShadow: { card: '0 1px 2px rgba(24,35,46,.06), 0 4px 16px rgba(24,35,46,.05)' },
    },
  },
  plugins: [],
}
