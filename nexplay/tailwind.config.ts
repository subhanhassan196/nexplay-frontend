import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        surface: {
          DEFAULT: "#121212",
          light: "#1A1A1E",
          border: "#232328",
        },
        primary: {
          DEFAULT: "#7C3AED",
          hover: "#8B5CF6",
          muted: "#5B21B6",
          50: "#F5F3FF",
          500: "#7C3AED",
          900: "#4C1D95",
        },
        secondary: {
          DEFAULT: "#06B6D4",
          hover: "#22D3EE",
          muted: "#0E7490",
        },
        accent: {
          DEFAULT: "#F59E0B",
          hover: "#FBBF24",
        },
        success: "#22C55E",
        danger: "#EF4444",
        muted: {
          DEFAULT: "#A1A1AA",
          foreground: "#71717A",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "nexplay-gradient": "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
        "nexplay-radial": "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.25) 0%, rgba(9,9,11,0) 60%)",
        "glass-shine": "linear-gradient(120deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)",
      },
      boxShadow: {
        "glow-primary": "0 0 24px 0 rgba(124,58,237,0.45)",
        "glow-secondary": "0 0 24px 0 rgba(6,182,212,0.45)",
        "glow-accent": "0 0 24px 0 rgba(245,158,11,0.45)",
        glass: "0 8px 32px 0 rgba(0,0,0,0.55)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "gradient-x": "gradientX 8s ease infinite",
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        gradientX: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      screens: {
        xs: "420px",
      },
      maxWidth: {
        "8xl": "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
