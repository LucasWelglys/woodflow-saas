import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          light: "#8D6E63",
          mid: "#5D4037",
          dark: "#2D241E",
        },
        caixa: {
          verde: "#2E7D32",
        },
        alerta: {
          laranja: "#EF6C00",
        },
        erro: {
          vermelho: "#C62828",
        }
      },
    },
  },
  plugins: [],
};
export default config;
