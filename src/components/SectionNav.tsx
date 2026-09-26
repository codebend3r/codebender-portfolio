import { useEffect, useState } from "react"

import styles from "@components/SectionNav.module.css"

type NavItem = { id: string; label: string; num?: string }

// Mirrors the sections mounted in App.tsx; `num` matches each section's chip.
const ITEMS: NavItem[] = [
  { id: "summary", label: "Summary" },
  { id: "technical-skills", label: "Stack", num: "01" },
  { id: "work-experience", label: "Experience", num: "02" },
  { id: "codebender", label: "Codebender Inc.", num: "03" },
  { id: "selected-work", label: "Client Work", num: "04" },
  { id: "awards", label: "Recognition", num: "05" },
  { id: "languages", label: "Languages", num: "06" },
  { id: "education", label: "Education", num: "07" },
]

export function SectionNav() {
  const [active, setActive] = useState<string>(ITEMS[0].id)

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-25% 0px -70% 0px", threshold: 0 }
    )
    for (const item of ITEMS) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  const onJump = (event: React.MouseEvent, id: string) => {
    event.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
    setActive(id)
  }

  return (
    <nav className={styles.nav} aria-label="Section navigation">
      <ul className={styles.list}>
        {ITEMS.map((item) => {
          const isActive = active === item.id
          return (
            <li key={item.id}>
              <a
                className={styles.item}
                href={`#${item.id}`}
                aria-label={item.label}
                aria-current={isActive ? "true" : undefined}
                onClick={(event) => onJump(event, item.id)}
              >
                <span className={styles.label}>{item.label}</span>
                {item.num ? (
                  <span className={styles.num}>{item.num}</span>
                ) : (
                  <span className={styles.dot} aria-hidden />
                )}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
