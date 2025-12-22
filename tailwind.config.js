/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          cyan: '#b3e8f0',
          orange: '#ffc299',
          yellow: '#ffeaa7',
        },
        accent1: '#b3e8f0',
        accent2: '#ffc299',
        accent3: '#ffeaa7',
      },
      fontSize: {
        'base': '1.125rem', // 18px instead of 16px
        'lg': '1.25rem',    // 20px instead of 18px
        'xl': '1.5rem',     // 24px instead of 20px
        '2xl': '1.875rem',  // 30px instead of 24px
        '3xl': '2.25rem',   // 36px instead of 30px
        '4xl': '3rem',      // 48px instead of 36px
      },
    },
  },
  plugins: [],
}

