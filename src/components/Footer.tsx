import type { Data } from '../types'

export function Footer({ d }: { d: Data }) {
  return (
    <footer className="footer">
      <small>
        © {new Date().getFullYear()} {d.name}. Built with Vite + React.
      </small>
    </footer>
  )
}
