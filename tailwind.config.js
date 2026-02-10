/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#07c160',
        income: '#ffcc00',
        expense: '#ff4d4f',
        info: '#1890ff',
      },
    },
  },
  plugins: [],
}

