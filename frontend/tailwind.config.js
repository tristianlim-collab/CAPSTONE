import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#F97316",
          dark: "#EA580C",
          success: "#22C55E",
          danger: "#EF4444",
          warning: "#F59E0B",
          info: "#3B82F6",
          purple: "#8B5CF6",
        },
        surface: {
          page: "#F1F5F9",
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
        sidebar: {
          bg: "#1E1B4B",
          text: "#C7D2FE",
          active: "#4F46E5",
        },
        reporter: {
          bg: "#0F172A",
          card: "#1E293B",
          border: "#334155",
          text: "#F8FAFC",
          muted: "#94A3B8",
          accent: "#F97316",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 4px 12px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [forms],
};
