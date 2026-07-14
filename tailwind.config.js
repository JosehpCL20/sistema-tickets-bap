/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores personalizados Banco de Alimentos Perú
        'bap': {
          green: '#80c398',
          'green-dark': '#6ab088',
          'green-hover': '#72b58d',
          yellow: '#fbe066',
          'yellow-hover': '#f0d55a',
          red: '#ea4c5b',
          'red-hover': '#d93a4a',
        }
      }
    },
  },
  plugins: [],
}