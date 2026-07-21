import styles from "@components/AppHeader.module.css"
import { Header } from "@components/Header"
import { WeatherClock } from "@components/WeatherClock"

import { type DocumentFormat } from "@utils/documentFileName"

type Props = {
  onDownload: (format: DocumentFormat) => void
  generatingFormat: DocumentFormat | null
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

export function AppHeader({ onDownload, generatingFormat }: Props) {
  const isGenerating = generatingFormat !== null

  return (
    <>
      <header className={styles.bar}>
        <div className={styles.inner}>
          <div className={styles.utility}>
            <WeatherClock />
          </div>
          <Header />
        </div>
      </header>
      <div className={styles.downloadGroup}>
        <button
          className={styles.downloadButton}
          onClick={() => onDownload("pdf")}
          disabled={isGenerating}
          aria-busy={generatingFormat === "pdf"}
        >
          <DownloadIcon />
          {generatingFormat === "pdf" ? "Generating…" : "Download PDF CV"}
        </button>
        <button
          className={styles.downloadButton}
          onClick={() => onDownload("docx")}
          disabled={isGenerating}
          aria-busy={generatingFormat === "docx"}
        >
          <DownloadIcon />
          {generatingFormat === "docx" ? "Generating…" : "Download Word CV"}
        </button>
      </div>
    </>
  )
}
