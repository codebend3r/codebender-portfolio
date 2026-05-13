import { css } from "@styled-system/css"

const footerStyles = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "16px",
  margin: 0,
  color: "muted",
  textAlign: "center",
})

export function Footer() {
  return (
    <footer className={footerStyles}>
      <small>Built with React + Typescript + Vite</small>
      <small>© {new Date().getFullYear()}. Codebender Inc.</small>
    </footer>
  )
}
