import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#1E4D2B",
          "green-dark": "#143820",
          "green-mid": "#2F6B3A",
          gold: "#C99A2E",
          "gold-light": "#E9D8A6",
          cream: "#F6F1E4",
          "cream-2": "#EFE8D6",
          "cream-3": "#ECE5D3",
          sage: "#667064",
          ink: "#1D2A1F",
        },
      },
      fontFamily: {
        heading: ["Bricolage Grotesque", "sans-serif"],
        sans: ["Figtree", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
