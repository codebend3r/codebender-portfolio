import styles from "./Footer.module.css"

export function Footer() {
  return (
    <footer className={styles.footer}>
      <small>Built with React + Typescript + Vite</small>
      <small>© {new Date().getFullYear()}. Codebender Inc.</small>
    </footer>
  )
}
