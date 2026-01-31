/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B1E5B',  // Xanh đậm (Header/Footer)
          light: '#00AEEF', // Xanh sáng (Button/Accent)
          gray: '#F4F7FA',  // Nền xám nhạt
        }
      }
    },
  },
  plugins: [],
}

