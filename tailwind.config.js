/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        infragest: {
          primary: "#10b981",
          "primary-content": "#ffffff",
          secondary: "#059669",
          "secondary-content": "#ffffff",
          accent: "#14b8a6",
          "accent-content": "#ffffff",
          neutral: "#1f2937",
          "neutral-content": "#f9fafb",
          "base-100": "#ffffff",
          "base-200": "#f0fdf4",
          "base-300": "#dcfce7",
          "base-content": "#064e3b",
          info: "#06b6d4",
          "info-content": "#ffffff",
          success: "#22c55e",
          "success-content": "#ffffff",
          warning: "#f59e0b",
          "warning-content": "#ffffff",
          error: "#dc2626",
          "error-content": "#ffffff",
        },
      },
      "light",
      "dark",
    ],
  },
};
