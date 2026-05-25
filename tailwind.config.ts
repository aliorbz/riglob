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
        background: "#030303",
        foreground: "#f3f4f6",
        cyber: {
          dark: "#050507",
          gray: "#0d0d11",
          card: "rgba(10, 10, 14, 0.75)",
          border: "rgba(0, 255, 102, 0.2)",
          green: "#00ff66",
          greenHover: "#33ff88",
        }
      },
      boxShadow: {
        'neon-green': '0 0 15px rgba(0, 255, 102, 0.4)',
        'neon-green-strong': '0 0 25px rgba(0, 255, 102, 0.7)',
        'neon-purple': '0 0 15px rgba(168, 85, 247, 0.4)',
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.4)',
        'neon-amber': '0 0 15px rgba(251, 191, 36, 0.4)',
        'neon-pink': '0 0 15px rgba(255, 0, 127, 0.4)',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' }
        },
        borderGlow: {
          '0%, 100%': { 'border-color': 'rgba(0, 255, 102, 0.2)' },
          '50%': { 'border-color': 'rgba(0, 255, 102, 0.6)' }
        }
      },
      animation: {
        gradientShift: 'gradientShift 3s ease infinite',
        borderGlow: 'borderGlow 3s ease-in-out infinite'
      }
    },
  },
  plugins: [],
};
export default config;
