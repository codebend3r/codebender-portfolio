import { useStore } from "@state/useStore"

import Logo from "@assets/logo.svg"

import { css } from "@styled-system/css"

const headerStyles = css({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  borderBottom: "1px solid token(colors.border)",
  paddingBottom: "20px",
  marginBottom: "28px",
  "@media (max-width: 700px)": {
    flexDirection: "column",
    alignItems: "flex-start",
  },
})

const brandStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "16px",
  "& h1": {
    fontSize: "28px",
    margin: 0,
    fontWeight: 800,
    letterSpacing: "0.2px",
  },
})

const logoStyles = css({
  width: "56px",
  height: "56px",
})

const subtitleStyles = css({
  margin: "2px 0 0",
  color: "muted",
  fontWeight: 600,
})

const contactStyles = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  alignItems: "center",
  color: "muted",
})

export function Header() {
  const { name, title, contact } = useStore()

  return (
    <header className={headerStyles}>
      <div className={brandStyles}>
        <img src={Logo} alt="Logo" className={logoStyles} />
        <div>
          <h1>{name}</h1>
          <p className={subtitleStyles}>{title}</p>
        </div>
      </div>
      <div className={contactStyles}>
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
