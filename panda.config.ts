import { defineConfig, defineGlobalStyles } from "@pandacss/dev"

const globalCss = defineGlobalStyles({
  "*": { boxSizing: "border-box" },
  "html, body, #root": { height: "100%" },
  body: {
    margin: 0,
    fontFamily:
      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"',
    background: "{colors.bg}",
    color: "{colors.text}",
    lineHeight: "1.55",
  },
  a: {
    color: "{colors.accent}",
    textDecoration: "none",
    "&:hover": { textDecoration: "underline" },
  },
  "@media print": {
    ".no-print": { display: "none !important" },
  },
})

export default defineConfig({
  preflight: false,
  jsxFramework: "react",
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  outdir: "styled-system",
  globalCss,
  globalVars: {
    "--cloud-drift": "0vw",
  },
  theme: {
    extend: {
      tokens: {
        colors: {
          bg: { value: "#0b0e14" },
          panel: { value: "#111622" },
          text: { value: "#e6ebf5" },
          muted: { value: "#9aa4b2" },
          accent: { value: "#7aa2f7" },
          accent2: { value: "#c678dd" },
          border: { value: "#1b2233" },
        },
      },
      keyframes: {
        cloudDrift: {
          "0%": { transform: "translate3d(0, 0, 0)" },
          "100%": { transform: "translate3d(var(--cloud-drift, 0), 0, 0)" },
        },
        rainFall: {
          "0%": { transform: "translate3d(0, -10vh, 0)" },
          "100%": { transform: "translate3d(2vw, 115vh, 0)" },
        },
        snowFall: {
          "0%": { transform: "translate3d(0, -5vh, 0)" },
          "50%": { transform: "translate3d(4vw, 55vh, 0)" },
          "100%": { transform: "translate3d(-2vw, 110vh, 0)" },
        },
        glowPulse: {
          "0%": {
            boxShadow:
              "0 0 5px var(--colors-accent), 0 0 10px var(--colors-accent), 0 0 15px var(--colors-accent)",
          },
          "100%": {
            boxShadow:
              "0 0 15px var(--colors-accent2), 0 0 30px var(--colors-accent2), 0 0 45px var(--colors-accent2)",
          },
        },
      },
    },
  },
})
