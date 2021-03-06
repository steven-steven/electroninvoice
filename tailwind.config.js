module.exports = {
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    fontFamily: {
      display: ['Gilroy', 'sans-serif'],
      body: ['Graphik', 'sans-serif'],
      serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
    },
    borderWidth: {
      default: '1px',
      '0': '0',
      '2': '2px',
      '4': '4px',
    },
    extend: {
      colors: {
        cyan: '#9cdbff',
        sidebarText: '#6C6C6C',
      },
      margin: {
        '96': '24rem',
        '128': '32rem',
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['disabled'],
      opacity: ['disabled'],
    },
  },
  plugins: [],
};
