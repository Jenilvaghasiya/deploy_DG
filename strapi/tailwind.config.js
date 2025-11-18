/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/admin/**/*.{js,jsx,ts,tsx}",   // Admin panel React files
    "./src/components/**/*.{js,jsx,ts,tsx}", // Your custom components
        './src/\*\*/\*.{js,jsx,ts,tsx}',

    './admin/src/\*\*/\*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
