/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f172a',
        'dark-card': '#1e293b',
        'dark-border': '#334155',
        'accent-blue': '#60a5fa',
        'accent-purple': '#a78bfa',
        'success': '#10b981',
        'warning': '#f59e0b',
        'error': '#ef4444'
      }
    },
  },
  plugins: [],
}