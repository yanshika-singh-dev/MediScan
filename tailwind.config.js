/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F6F7F5",
        ink: {
          900: "#10221F",
          700: "#243B36",
          500: "#5C6E68",
          300: "#8FA098",
        },
        teal: {
          700: "#0E5C56",
          600: "#146760",
          500: "#1C8C82",
          100: "#DCEBE8",
        },
        line: "#D8DED9",
        amber: {
          700: "#8F5A24",
          600: "#B8722E",
          100: "#F5E6D3",
        },
        rose: {
          700: "#A83E36",
          100: "#F3DEDB",
        },
        moss: {
          700: "#3D6142",
          600: "#4C7A52",
          100: "#E1EBE0",
        },
      },
      fontFamily: {
        serif: ['"Newsreader"', "serif"],
        sans: ['"Inter"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
}