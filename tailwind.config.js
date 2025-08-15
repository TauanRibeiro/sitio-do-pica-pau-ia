/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        sitio: {
          primary: '#FFD700', // dourado
          secondary: '#228B22', // verde
          accent: '#FF6347', // tomate
          brown: '#8B4513',
          bg: '#12131a'
        }
      },
      borderRadius: {
        '2xl': '1.25rem'
      },
      boxShadow: {
        glass: '0 10px 30px rgba(0,0,0,0.25)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  darkMode: 'class',
  plugins: []
}
