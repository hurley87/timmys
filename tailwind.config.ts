import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tim Hortons-inspired brand colors
        timmys: {
          red: "#C8102E", // Tim Hortons official red (Pantone 186 C)
          "red-dark": "#A00D25",
          "red-light": "#E01A3A",
          white: "#FFFFFF", // Pure white for backgrounds and text
          "white-off": "#F9F9F9", // Off-white for subtle backgrounds
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        script: ["var(--font-dancing-script)", "cursive"],
        display: ["var(--font-dancing-script)", "cursive"],
      },
      borderRadius: {
        "timmys": "12px",
        "timmys-lg": "16px",
        "timmys-xl": "20px",
      },
    },
  },
};

export default config;
