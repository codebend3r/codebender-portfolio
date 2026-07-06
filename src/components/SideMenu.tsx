import { useEffect, useState } from "react"

import styles from "@components/SideMenu.module.css"

import { cloudConfigured } from "@state/supabase"
import { useAuth } from "@state/useAuth"

import { routeFor } from "@utils/routeFor"

const LINKS = [
  { href: "/", label: "Home", route: "app" },
  { href: "/edit-resume", label: "Edit Resume", route: "edit" },
  { href: "/generate", label: "Generate", route: "generate" },
] as const

// Owner navigation, mounted on every route. Invisible to anonymous
// visitors; renders a fixed toggle plus a left drawer when signed in.
export function SideMenu() {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  if (!cloudConfigured || session === null) return null

  const current = routeFor(window.location.pathname)

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <>
          <div className={styles.backdrop} aria-hidden="true" />
          <nav className={styles.menu} aria-label="Site">
            <span className={styles.heading}>Menu</span>
            <ul className={styles.links}>
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    className={styles.link}
                    href={link.href}
                    aria-current={current === link.route ? "page" : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={styles.signOut}
              onClick={() => void useAuth.getState().signOut()}
            >
              Sign out
            </button>
          </nav>
        </>
      )}
    </>
  )
}
