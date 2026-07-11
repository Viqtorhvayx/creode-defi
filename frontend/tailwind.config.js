/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        surface: "#101010",
        terracotta: {
          DEFAULT: "#E07A5F",
          muted: "#8C4F3F",
        },
        cyan: {
          DEFAULT: "#81B29A",
          muted: "#4F6F5F",
        },
        sage: {
          DEFAULT: "#B4C4B4",
          muted: "#788778",
        },
      },
      fontFamily: {
        industrial: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        'pulse-once': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.05)' },
        },
        'draw': {
          'to': { strokeDashoffset: '0' }
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(1.1)', opacity: '0' },
        }
      },
      animation: {
        'pulse-once': 'pulse-once 0.5s ease-in-out',
        'draw': 'draw 0.3s ease-in-out forwards',
        'fade-in-up': 'fade-in-up 0.2s ease-out forwards',
        'pulse-ring': 'pulse-ring 0.6s cubic-bezier(0.215, 0.61, 0.355, 1) forwards'
      }
    },
  },
  plugins: [],
}
