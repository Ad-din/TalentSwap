/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F3F5F4',
        ink: '#14201D',
        line: '#D8DDDA',
        // "teach" is what you offer - deep teal, grounded.
        teach: {
          DEFAULT: '#0F5C56',
          dark: '#0A3F3B',
          tint: '#DCEAE7',
        },
        // "learn" is what you seek - warm tangerine, energetic.
        learn: {
          DEFAULT: '#E8703A',
          dark: '#C4551F',
          tint: '#FBE3D3',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};
