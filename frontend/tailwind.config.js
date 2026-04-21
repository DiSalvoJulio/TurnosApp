/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        surface: '#F8FAFC',
        textMain: '#0F172A',
        textMuted: '#64748B'
      },
      fontSize: {
        'base': '1.05rem', 
        'lg': '1.15rem',
      }
    },
  },
  plugins: [],
}
