/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#F6F8F3",
          card: "#FFFFFF",
          text: "#172A21",
          muted: "#647067",
          border: "#DDE5DA",
          primary: "#3F6B57",
          "primary-hover": "#345A49",
          surface: "#EEF5EC",
          success: "#059669",
          warning: "#D97706",
          danger: "#DC2626",
          header: {
            bg: "#6F927D",
            text: "#FFFFFF",
            inactive: "#EEF5EC",
            accent: "#E6F0E8",
            cta: "#F8FAF5",
            "cta-hover": "#EAF4EC",
            "cta-text-hover": "#2F5D46",
          },
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(23,42,33,0.04), 0 8px 24px rgba(23,42,33,0.06)",
        "soft-hover": "0 2px 4px rgba(23,42,33,0.06), 0 12px 32px rgba(23,42,33,0.08)",
        glass: "0 1px 2px rgba(23,42,33,0.04), 0 8px 24px rgba(23,42,33,0.06)",
        "glass-hover": "0 2px 4px rgba(23,42,33,0.06), 0 12px 32px rgba(23,42,33,0.08)",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
