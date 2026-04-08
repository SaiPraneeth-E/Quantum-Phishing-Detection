/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        safe: '#10b981',
        phishing: '#ef4444',
        cyber: '#06b6d4',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
