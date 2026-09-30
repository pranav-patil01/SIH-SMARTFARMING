/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/ui/**/*.{js,ts,jsx,tsx,mdx}',
    './src/three/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // AgriSense brand palette
        'agri-green': '#1B7F4B',
        'agri-deep': '#0F4D2E',
        'agri-water': '#2F80ED',
        'agri-amber': '#F2B33D',
        'agri-alert': '#D64545',
        'agri-cream': '#F5F0E8',
        'agri-dark': '#0A1A0F',
        'agri-panel': 'rgba(15,40,20,0.85)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        devanagari: ['var(--font-noto)', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
