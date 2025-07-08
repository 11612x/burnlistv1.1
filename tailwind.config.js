/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
      colors: {
        greenProfit: '#0de309',
        redLoss: '#e31507',
        black: '#000000',
        white: '#ffffff',
      },
    },
  },
  plugins: [],
}
