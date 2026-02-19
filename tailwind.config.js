/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./playground/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        success: '#52C41A',
        warning: '#F59E0B',
        error: '#EF4444',
        background: '#F9FAFB',
      }
    },
  },
  plugins: [],
}
