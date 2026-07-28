import { StyleSheet } from "@react-pdf/renderer"
import { tokens } from "@theme/tokens"

export const styles = StyleSheet.create({
  page: {
    backgroundColor: tokens.colors.bg,
    color: tokens.colors.text,
    fontFamily: tokens.font.sans,
    fontSize: tokens.fontSize.body,
    paddingTop: tokens.page.paddingTop,
    paddingBottom: tokens.page.paddingBottom,
    paddingHorizontal: tokens.page.paddingHorizontal,
    lineHeight: 1.45,
  },

  // Header
  header: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacing.xs,
  },
  name: {
    fontFamily: tokens.font.family,
    fontSize: tokens.fontSize.h1,
    fontWeight: 700,
    color: tokens.colors.text,
    lineHeight: 1.1,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: tokens.fontSize.subtitle,
    fontWeight: 400,
    color: tokens.colors.accent,
    lineHeight: 1.2,
  },
  summary: {
    fontSize: tokens.fontSize.body,
    color: tokens.colors.text,
    lineHeight: 1.4,
    marginTop: tokens.spacing.xs,
  },

  // Full-bleed contact bar
  contactBar: {
    marginTop: tokens.spacing.lg,
    marginHorizontal: -tokens.page.paddingHorizontal,
    paddingHorizontal: tokens.page.paddingHorizontal,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.accentDeep,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    columnGap: tokens.spacing.md,
    rowGap: tokens.spacing.xs,
  },
  contactItem: {
    fontSize: tokens.fontSize.small,
    color: tokens.colors.onAccent,
    textDecoration: "none",
  },
  contactLink: {
    fontSize: tokens.fontSize.small,
    color: tokens.colors.onAccent,
    textDecoration: "underline",
  },
  contactIcon: {
    width: 11,
    height: 11,
  },
  // Two clusters — direct contact methods, web/social icons — pushed to
  // opposite ends of the bar by the parent's space-between.
  contactGroup: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: tokens.spacing.md,
  },
  contactLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
  contactSep: {
    fontSize: tokens.fontSize.small,
    color: tokens.colors.onAccentMuted,
  },

  // Sections
  section: {
    marginTop: tokens.spacing.lg,
  },
  sectionHeading: {
    fontSize: tokens.fontSize.h2,
    fontWeight: 700,
    color: tokens.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    paddingBottom: tokens.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.rule,
    marginBottom: tokens.spacing.md,
  },

  // Skills
  skillsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.xs,
  },
  skillPill: {
    fontSize: tokens.fontSize.small,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: tokens.colors.accentDeep,
    color: tokens.colors.onAccent,
  },

  // Experience
  experience: {
    position: "relative",
    paddingLeft: 22,
    marginBottom: tokens.spacing.lg,
  },
  timelineDash: {
    position: "absolute",
    left: 0,
    top: 6,
    width: 12,
    height: 2,
    backgroundColor: tokens.colors.accent,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: tokens.spacing.md,
  },
  role: {
    fontFamily: tokens.font.family,
    fontSize: tokens.fontSize.h3,
    fontWeight: 700,
    color: tokens.colors.text,
  },
  period: {
    fontSize: tokens.fontSize.small,
    fontStyle: "italic",
    color: tokens.colors.muted,
  },
  companyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: tokens.spacing.md,
    marginBottom: 3,
  },
  company: {
    fontFamily: tokens.font.family,
    fontSize: tokens.fontSize.body,
    fontWeight: 600,
    color: tokens.colors.accent,
  },
  employment: {
    fontSize: tokens.fontSize.small,
    fontStyle: "italic",
    color: tokens.colors.muted,
  },
  achievement: {
    fontSize: tokens.fontSize.body,
    paddingLeft: 10,
    textIndent: -10,
    lineHeight: 1.3,
    marginBottom: 2,
  },
  bullet: {
    color: tokens.colors.accent,
  },

  // Meta (awards / languages / education)
  metaRow: {
    flexDirection: "row",
    gap: tokens.spacing.xl,
    marginTop: tokens.spacing.xl,
  },
  metaColumn: {
    flex: 1,
    minWidth: 150,
  },
  metaItem: {
    marginBottom: tokens.spacing.sm,
  },
  metaPrimary: {
    fontFamily: tokens.font.family,
    fontSize: tokens.fontSize.body,
    fontWeight: 700,
    color: tokens.colors.text,
  },
  metaSecondary: {
    fontSize: tokens.fontSize.small,
    color: tokens.colors.muted,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: tokens.spacing.xl,
    left: tokens.page.paddingHorizontal,
    right: tokens.page.paddingHorizontal,
    textAlign: "right",
    fontSize: tokens.fontSize.micro,
    fontStyle: "italic",
    color: tokens.colors.muted,
  },
})
