// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "sans-serif",
        ],
        display: ["SF Pro Display", "Inter", "system-ui", "sans-serif"],
      },

      // ✅ Use your CSS variables as Tailwind colors
      colors: {
        app: {
          bg: "var(--app-bg)",
          surface: "var(--app-surface)",
          surfaceSubtle: "var(--app-surface-subtle)",
          borderSubtle: "var(--app-border-subtle)",
          borderStrong: "var(--app-border-strong)",
          text: "var(--app-text-main)",
          muted: "var(--app-text-muted)",
          accent: "var(--app-accent)",
          accentSoft: "var(--app-accent-soft)",
        },
        // keep your palettes if you want
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#22c55e",
          600: "#16a34a",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5f5",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 24px 60px rgba(15,23,42,0.55)",
        soft: "0 12px 30px rgba(15,23,42,0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
