import Logo from "../assets/logo.svg"
import type { Data } from "../types"

export function Header({ d }: { d: Data }) {
  return (
    <header className="header">
      <div className="brand">
        <img src={Logo} alt="Logo" className="logo" />
        <div>
          <h1>{d.name}</h1>
          <p className="subtitle">{d.title}</p>
        </div>
      </div>
      <div className="contact">
        <a href={`mailto:${d.contact.email}`}>{d.contact.email}</a>
        <span>•</span>
        <a href={`tel:${d.contact.phone}`}>{d.contact.phone}</a>
        <span>•</span>
        <span>{d.contact.location}</span>
        <span>•</span>
        <a href={d.contact.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </header>
  )
}
