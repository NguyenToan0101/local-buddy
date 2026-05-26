/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        primary: {
          DEFAULT: '#FF7A45',
          dark: '#E66330',
          light: '#FF956B',
          soft: '#FFEAE1',
        },
        secondary: {
          DEFAULT: '#2D1E17',
          light: '#4A372E',
          soft: '#A39994',
        },
        surface: {
          DEFAULT: '#F9FAFB',
          dark: '#F3F4F6',
          white: '#FFFFFF',
        },
        accent: {
          green: '#10B981',
          blue: '#3B82F6',
          red: '#EF4444',
          orange: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        '5xl': '3rem',
        'full': '9999px',
      },
      boxShadow: {
        'premium': '0 20px 40px -15px rgba(45, 30, 23, 0.05)',
        'premium-hover': '0 30px 60px -20px rgba(45, 30, 23, 0.1)',
        'primary-glow': '0 10px 20px -5px rgba(255, 122, 69, 0.3)',
      }
    },
  },
  plugins: [],
}
