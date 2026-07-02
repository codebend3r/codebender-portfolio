import styles from "@components/Footer.module.css"

import { useStore } from "@state/useStore"

import { stripProtocol } from "@utils/contact"

export function Footer() {
  const name = useStore((s) => s.name)
  const contact = useStore((s) => s.contact)
  const github = contact.find((c) => c.value.includes("github.com"))?.value
  const githubLabel = github && stripProtocol(github)
  return (
    <footer className={styles.footer}>
      <small className={styles.stack}>
        Built with React + Typescript + Vite
      </small>
      <small className={styles.year}>
        {" "}
        © {new Date().getFullYear()}. Codebender Inc.
      </small>
      <small className={styles.credit}>
        {name}
        {github && (
          <>
            {" · "}
            <a href={github} target="_blank" rel="noopener noreferrer">
              {githubLabel}
            </a>
          </>
        )}
      </small>
    </footer>
  )
}
