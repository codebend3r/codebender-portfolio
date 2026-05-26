import { Header } from "@components/Header"
import { WeatherClock } from "@components/WeatherClock"

import styles from "./AppHeader.module.css"

type Props = {
  onDownload: () => void
  isGenerating: boolean
}

export function AppHeader({ onDownload, isGenerating }: Props) {
  return (
    <header className={styles.bar}>
      <div className={styles.utility}>
        <WeatherClock />
        <button
          className={styles.downloadButton}
          onClick={onDownload}
          disabled={isGenerating}
          aria-busy={isGenerating}
        >
          {isGenerating ? "Generating…" : "Download PDF"}
        </button>
      </div>
      <Header />
    </header>
  )
}
