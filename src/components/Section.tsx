import React from "react"

import styles from "@components/Section.module.css"

export function Section({
  title,
  index,
  eyebrow,
  children,
}: {
  title: string
  index?: number
  eyebrow?: string
  children: React.ReactNode
}) {
  const hasChip = index !== undefined && eyebrow !== undefined
  const id = title.toLowerCase().replace(/\s+/g, "-")
  return (
    <section id={id} className={styles.section}>
      {hasChip && (
        <span className={styles.chip}>
          <span className={styles.chipDot} aria-hidden />
          {String(index).padStart(2, "0")} · {eyebrow}
        </span>
      )}
      <h2 className={styles.srTitle}>{title}</h2>
      {children}
    </section>
  )
}
