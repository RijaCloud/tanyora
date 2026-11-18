import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f1",
          100: "#ffdada",
          500: "#f04444",
          600: "#ea2828",
          700: "#c91f1f",
          900: "#651010",
        },
        ink: "#190a0a",
        cream: "#fff3d2",
        navy: "#111135",
        lavender: "#d9c8ff",
      }
    },
  },
  plugins: [],
};

export default config;
