/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glass: "0 4px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.85)",
        "glass-hover": "0 8px 32px rgba(0,0,0,0.11), inset 0 1px 0 rgba(255,255,255,0.9)",
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
