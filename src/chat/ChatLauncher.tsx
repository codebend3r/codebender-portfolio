import { Suspense, lazy, useId, useRef, useState } from "react"

import styles from "./ChatLauncher.module.css"

// Only the launcher pill is in the public bundle; the panel (and everything
// it pulls in — TimelineFigure, parseAnswer, useChat) loads on first open.
const ChatPanel = lazy(() => import("./ChatPanel"))

function RobotIcon() {
  return (
    <svg
      className={styles.avatar}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="8" width="16" height="11" rx="2.5" />
      <path d="M12 8V4" />
      <circle cx="12" cy="3" r="1" />
      <circle cx="9" cy="13" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.3" fill="currentColor" stroke="none" />
      <path d="M9 17h6" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
    </svg>
  )
}

// Rendered only behind the VITE_CHAT_ENABLED kill switch (see the recruiter
// chat design spec's "Abuse and spend controls"). Mounts ChatPanel lazily on
// first open, then keeps it mounted (just hidden by the closed <dialog>) so
// the conversation survives close/reopen for the rest of the page view.
export function ChatLauncher() {
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false)
  const [open, setOpen] = useState(false)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const dialogId = useId()

  if (import.meta.env.VITE_CHAT_ENABLED !== "true") return null

  const handleOpen = () => {
    setHasOpenedOnce(true)
    setOpen(true)
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={styles.launcher}
        hidden={open}
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={handleOpen}
      >
        <RobotIcon />
        Ask about CJ
      </button>
      {hasOpenedOnce && (
        <Suspense fallback={null}>
          <ChatPanel
            id={dialogId}
            open={open}
            onClose={() => setOpen(false)}
            returnFocusRef={launcherRef}
          />
        </Suspense>
      )}
    </>
  )
}
