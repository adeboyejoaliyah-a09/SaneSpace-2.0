import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--tw-primary) / <alpha-value>)',
        'primary-light': 'rgb(var(--tw-primary-light) / <alpha-value>)',
        'primary-mid': 'rgb(var(--tw-primary-mid) / <alpha-value>)',
        dark: 'rgb(var(--tw-dark) / <alpha-value>)',
        'gray-text': 'rgb(var(--tw-gray-text) / <alpha-value>)',
        'bg-base': 'rgb(var(--tw-bg-base) / <alpha-value>)',
        accent: 'rgb(var(--tw-accent) / <alpha-value>)',
        surface: 'rgb(var(--tw-surface) / <alpha-value>)',
        border: 'rgb(var(--tw-border) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Bricolage Grotesque', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
