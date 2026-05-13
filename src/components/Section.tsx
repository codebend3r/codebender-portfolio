import React from "react"

import { css } from "@styled-system/css"

const sectionStyles = css({
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
  border: "1px solid token(colors.border)",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "20px",
  "& h2": {
    margin: "0 0 12px",
    fontSize: "20px",
  },
})

export function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className={sectionStyles}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}
