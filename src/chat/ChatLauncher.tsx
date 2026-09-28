import { Suspense, lazy, useId, useRef, useState } from "react"

import { RobotAvatar } from "./icons"

import styles from "./ChatLauncher.module.css"

// Only the launcher pill is in the public bundle; the panel (and everything
// it pulls in — TimelineFigure, parseAnswer, useChat) loads on first open.
const ChatPanel = lazy(() => import("./ChatPanel"))

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
        <RobotAvatar className={styles.avatar} />
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
