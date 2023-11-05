/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}', 'node_modules/preline/dist/*.js'],
  plugins: [require('preline/plugin'), require('@tailwindcss/forms')]
}

