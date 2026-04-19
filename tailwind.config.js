/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ["'Press Start 2P'", 'cursive'],
      },
      colors: {
        empire: {
          darkest: '#0f1e09',
          dark: '#1a3010',
          base: '#2d5016',
          mid: '#1f4012',
          light: '#4a7c1f',
          lighter: '#5a8c2f',
          gold: '#ffd700',
          goldDark: '#c7a565',
          stone: '#8b7355',
          stoneDark: '#5a4a3a',
        },
      },
    },
  },
  plugins: [],
};
