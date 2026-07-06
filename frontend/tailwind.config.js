/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0b0d12',
        panel: '#12151c',
        border: '#232733',
        accent: '#5b8cff',
        hot: '#ff5c5c',
        warm: '#ffb84d',
        cold: '#7d8597',
      },
    },
  },
  plugins: [],
};
