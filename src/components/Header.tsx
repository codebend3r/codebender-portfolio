import { useStore } from "@state/useStore"

import Logo from "../assets/logo.svg"

export function Header() {
  const { name, title, contact } = useStore()

  return (
    <header className="header">
      <div className="brand">
        <img src={Logo} alt="Logo" className="logo" />
        <div>
          <h1>{name}</h1>
          <p className="subtitle">{title}</p>
        </div>
      </div>
      <div className="contact">
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
