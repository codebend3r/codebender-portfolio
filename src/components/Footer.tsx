import { useStore } from "@state/useStore"

import styles from "./Footer.module.css"

export function Footer() {
  const name = useStore((s) => s.name)
  const github = useStore((s) => s.contact.github)
  const githubLabel = github.replace(/^https?:\/\//, "")
  return (
    <footer className={styles.footer}>
      <small>Built with React + Typescript + Vite</small>
      <small>© {new Date().getFullYear()}. Codebender Inc.</small>
      <small className={styles.credit}>
        {name} ·{" "}
        <a href={github} target="_blank" rel="noopener noreferrer">
          {githubLabel}
        </a>
      </small>
    </footer>
  )
}
