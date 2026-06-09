import { StyleSheet } from "@react-pdf/renderer"

import { tokens } from "@pdf/tokens"

export const styles = StyleSheet.create({
  page: {
    backgroundColor: tokens.colors.bg,
    color: tokens.colors.text,
    fontFamily: tokens.font.family,
    fontSize: tokens.fontSize.body,
    paddingTop: tokens.spacing.xxl,
    paddingBottom: tokens.spacing.xxl,
    paddingHorizontal: tokens.spacing.xxl + tokens.spacing.md,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: tokens.spacing.lg,
  },
  name: {
    fontSize: tokens.fontSize.h1,
    fontWeight: 700,
    color: tokens.colors.text,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: tokens.fontSize.h3,
    fontWeight: 500,
    color: tokens.colors.accent,
    marginTop: tokens.spacing.xs,
  },
  contact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.md,
    fontSize: tokens.fontSize.small,
    color: tokens.colors.muted,
  },
  contactItem: {
    color: tokens.colors.muted,
  },
  contactLink: {
    color: tokens.colors.muted,
    textDecoration: "none",
  },
  section: {
    marginTop: tokens.spacing.lg,
  },
  sectionHeading: {
    fontSize: tokens.fontSize.h2,
    fontWeight: 700,
    color: tokens.colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingBottom: tokens.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    marginBottom: tokens.spacing.md,
  },
  summary: {
    color: tokens.colors.text,
  },
  skillsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.xs,
  },
  skillPill: {
    fontSize: tokens.fontSize.small,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: 4,
    color: tokens.colors.muted,
  },
  experience: {
    marginBottom: tokens.spacing.md,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: tokens.spacing.xs,
  },
  role: {
    fontSize: tokens.fontSize.h3,
    fontWeight: 600,
    color: tokens.colors.text,
  },
  period: {
    fontSize: tokens.fontSize.small,
    color: tokens.colors.muted,
  },
  company: {
    fontSize: tokens.fontSize.body,
    fontWeight: 500,
    color: tokens.colors.accent,
    marginBottom: tokens.spacing.xs,
  },
  achievement: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bullet: {
    width: tokens.spacing.md,
  },
  achievementText: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.lg,
    marginTop: tokens.spacing.lg,
  },
  metaColumn: {
    flex: 1,
    minWidth: 150,
  },
  metaItem: {
    marginBottom: tokens.spacing.xs,
  },
  metaPrimary: {
    fontSize: tokens.fontSize.body,
    fontWeight: 600,
    color: tokens.colors.text,
  },
  metaSecondary: {
    fontSize: tokens.fontSize.small,
    color: tokens.colors.muted,
  },
})
