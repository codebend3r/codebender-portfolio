import { Header } from "@components/Header"
import { WeatherClock } from "@components/WeatherClock"

import styles from "./AppHeader.module.css"

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
  return (
    <header className={styles.bar}>
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
  )
}
