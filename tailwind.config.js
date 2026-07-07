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
          DEFAULT: '#10b981', // emerald-500
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#374151', // gray-700
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#f3f4f6', // gray-100
          foreground: '#6b7280', // gray-500
        },
        accent: {
          DEFAULT: '#059669', // emerald-600
          foreground: '#ffffff',
        },
      }
    },
  },
  plugins: [],
}

