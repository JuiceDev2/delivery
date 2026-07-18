import type { Config } from "tailwindcss";

// Paleta "Zona Valles": verde agave de marca, piedra volcánica como fondo neutro,
// musgo para texto secundario y barro (terracota) como acento de énfasis/alerta.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        agave: {
          DEFAULT: "#2F6B4F",
          osc: "#234F3A",
          claro: "#E4EFE8",
        },
        piedra: {
          DEFAULT: "#F6F2EA",
          osc: "#DED4C2",
        },
        musgo: "#5B6355",
        barro: {
          DEFAULT: "#C1622D",
          osc: "#9C4C22",
        },
        cielo: "#2F6B8F",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        suave: "0 1px 2px rgba(35, 30, 20, 0.06), 0 8px 20px -12px rgba(35, 30, 20, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
