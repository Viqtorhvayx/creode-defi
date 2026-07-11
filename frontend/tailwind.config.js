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
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'ping-once': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(1.15)', opacity: '0' },
        }
      },
      animation: {
        'pulse-once': 'pulse-once 1s ease-in-out 1',
        'ping-once': 'ping-once 600ms cubic-bezier(0, 0, 0.2, 1) 1',
      },
    },
  },
  plugins: [],
}
