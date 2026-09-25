export const tokens = {
  colors: {
    bg: "#ffffff",
    text: "#1b2733",
    muted: "#5c6b7a",
    accent: "#35576b",
    accentDeep: "#2c4a5c",
    onAccent: "#ffffff",
    onAccentMuted: "#c4d2dc",
    border: "#d6dce2",
    // Faint wash of `employment["part-time"]` behind the side-work track.
    sideTint: "#f6f3fa",
    rule: "#c9d2da",
    // One colour per employment value so document exporters render every
    // schedule/arrangement combination as the same colour pair.
    employment: {
      "full-time": "#2f6da0",
      "part-time": "#7a5ea6",
      contract: "#a8681f",
      permanent: "#3d7a4f",
    },
  },
  fontSize: {
    micro: 8,
    small: 8.5,
    body: 9.5,
    h3: 11,
    h2: 11.5,
    h1: 24,
    subtitle: 12.5,
  },
  spacing: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
  },
  // Unitless line-heights, as a multiple of the font size. react-pdf applies
  // them directly; ResumeDocx converts them for Word's font-relative "auto"
  // line rule. Both exporters must read them from here — a line-height that
  // lives in only one of the two is how the PDF and DOCX drift apart.
  lineHeight: {
    body: 1.45,
    name: 1.1,
    title: 1.2,
    summary: 1.4,
    achievement: 1.3,
  },
  // Point measurements that are neither spacing nor type sizes, shared by
  // the PDF and DOCX renderers for the same reason as `lineHeight`.
  metrics: {
    contactIcon: 11,
    pillPaddingY: 3,
    timelineIndent: 22,
    bulletIndent: 10,
    companyGap: 3,
  },
  page: {
    paddingTop: 36,
    paddingBottom: 44,
    paddingHorizontal: 40,
  },
  font: {
    // Serif carries the display voice (name, roles, companies); sans the
    // reading voice (body text, labels). Same Adobe superfamily, so the
    // two are designed to pair.
    family: "Source Serif 4",
    sans: "Source Sans 3",
  },
} as const
