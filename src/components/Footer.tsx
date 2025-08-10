import { useStore } from "@state/useStore"

export function Footer() {
  const { name } = useStore()

  return (
    <footer className="footer">
      <small>
        © {new Date().getFullYear()} {name}. Built with Vite + React.
      </small>
    </footer>
  )
}
