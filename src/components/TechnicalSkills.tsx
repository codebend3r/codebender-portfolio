import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

import { skillDescriptions } from "@data/skillDescriptions"

import { css } from "@styled-system/css"

const pillListStyles = css({
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
})

const pillStyles = css({
  position: "relative",
  background: "panel",
  border: "1px solid token(colors.border)",
  padding: "8px 12px",
  borderRadius: "999px",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "default",
  transition:
    "transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 220ms ease, border-color 220ms ease, background 220ms ease",
  _hover: {
    transform: "translateY(-3px) scale(1.06)",
    borderColor: "accent",
    background: "linear-gradient(135deg, token(colors.panel), #1a2238)",
    boxShadow:
      "0 6px 18px rgba(122, 162, 247, 0.25), 0 0 0 1px token(colors.accent)",
    "& > [data-skill-tooltip]": {
      opacity: 1,
      visibility: "visible",
      transform: "translateX(-50%) translateY(0)",
    },
  },
})

const tooltipStyles = css({
  position: "absolute",
  bottom: "calc(100% + 10px)",
  left: "50%",
  transform: "translateX(-50%) translateY(6px)",
  width: "260px",
  maxWidth: "80vw",
  background: "#0d1220",
  color: "text",
  border: "1px solid token(colors.accent)",
  padding: "10px 12px",
  borderRadius: "10px",
  fontSize: "12px",
  fontWeight: 400,
  lineHeight: 1.5,
  textAlign: "left",
  opacity: 0,
  visibility: "hidden",
  pointerEvents: "none",
  transition:
    "opacity 200ms ease, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), visibility 200ms",
  zIndex: 20,
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
  _after: {
    content: '""',
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    border: "6px solid transparent",
    borderTopColor: "token(colors.accent)",
  },
})

const fallbackDescription =
  "A core technology used across modern frontend engineering."

export function TechnicalSkills() {
  const { technical_skills } = useStore()

  return (
    <Section title="Technical Skills">
      <ul className={pillListStyles}>
        {technical_skills.map((s) => {
          const description = skillDescriptions[s] ?? fallbackDescription
          return (
            <li
              key={s}
              className={pillStyles}
              aria-label={`${s}: ${description}`}
            >
              {s}
              <span data-skill-tooltip role="tooltip" className={tooltipStyles}>
                {description}
              </span>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
