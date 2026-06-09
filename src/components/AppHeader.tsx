import { useEffect, useRef, useState } from "react"

import styles from "@components/AppHeader.module.css"
import { Header } from "@components/Header"
import { WeatherClock } from "@components/WeatherClock"

type Props = {
  onDownload: () => void
  isGenerating: boolean
}

function DownloadIcon() {
  return (
    <svg
      className={styles.downloadIcon}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  )
}

export function AppHeader({ onDownload, isGenerating }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <header className={styles.bar} data-stuck={stuck}>
        <div className={styles.inner}>
          <div className={styles.utility}>
            <WeatherClock />
            <button
              className={styles.downloadButton}
              onClick={onDownload}
              disabled={isGenerating}
              aria-busy={isGenerating}
            >
              <DownloadIcon />
              {isGenerating ? "Generating…" : "Download CV"}
            </button>
          </div>
          <Header />
        </div>
      </header>
    </>
  )
}
