/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        cv: {
          // Primary sage family (sitewide buttons, headings, accents)
          green: '#6f8270',
          'sage-accent': '#819882',
          ink: '#3d4a3d',
          shell: '#ecf0eb',
          'shell-light': '#f3f6f3',
          canvas: '#eef2ee',
          sage: '#dde6dc',
          sky: '#a8c4c8',
          muted: '#8a9690',
          grey: '#657265',
          'grey-ui': '#757f75',
          'grey-light': '#aeb8ae',
          placeholder: '#b8c4b8',
          page: '#f2f6f2',
          cream: '#fafbf9',
          charcoal: '#353d36',
          'sage-soft': '#e8f0e8',
          'footer-bg': '#e9ece9',
          'cta-bg': '#e7ebe7',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 12px 40px rgba(111, 130, 112, 0.12), 0 2px 12px rgba(0, 0, 0, 0.04)',
        contact: '0 14px 36px rgba(82, 98, 82, 0.1), 0 2px 10px rgba(0, 0, 0, 0.04)',
      },
      backgroundImage: {
        'cv-green-gradient':
          'linear-gradient(165deg, #fafbf9 0%, #eef4ef 38%, #d8e7d9 68%, #a3bea3 100%)',
      },
    },
  },
  plugins: [],
};
