import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#b8dbff",
          300: "#7abfff",
          400: "#3a9fff",
          500: "#0b7dda",
          600: "#0063b8",
          700: "#004f96",
          800: "#00437d",
          900: "#003868",
        },
        surface: {
          0: "#ffffff",
          50: "#fafbfc",
          100: "#f4f5f7",
          200: "#ebecf0",
          300: "#dfe1e6",
        },
        status: {
          critical: "#dc2626",
          "critical-bg": "#fef2f2",
          warning: "#d97706",
          "warning-bg": "#fffbeb",
          stable: "#0b7dda",
          "stable-bg": "#eff6ff",
          ready: "#16a34a",
          "ready-bg": "#f0fdf4",
          inactive: "#9ca3af",
          "inactive-bg": "#f9fafb",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        "card-hover":
          "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        soft: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        "inner-border": "inset 0 0 0 1px rgba(0, 0, 0, 0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "pageEnter 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
