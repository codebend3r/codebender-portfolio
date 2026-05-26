import { useStore } from "@state/useStore"

import Logo from "@assets/logo.svg"

import styles from "./Header.module.css"

export function Header() {
  const { name, title, contact } = useStore()

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img src={Logo} alt="Logo" className={styles.logo} />
        <div>
          <h1>{name}</h1>
          <p className={styles.subtitle}>{title}</p>
        </div>
      </div>
      <div className={styles.contact}>
        <a href={`mailto:${contact.email}`}>{contact.email}</a>
        <span>•</span>
        <a href={`tel:${contact.phone}`}>{contact.phone}</a>
        <span>•</span>
        <span>{contact.location}</span>
        <span>•</span>
        <a href={contact.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </header>
  )
}
