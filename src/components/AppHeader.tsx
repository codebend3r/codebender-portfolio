import styles from "@components/AppHeader.module.css"
import { Header } from "@components/Header"
import { ThemeToggle } from "@components/ThemeToggle"
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
      width="16"
      height="16"
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

const FORMAT_LABEL: Record<DocumentFormat, string> = {
  pdf: "PDF CV",
  docx: "Word CV",
}

export function AppHeader({ onDownload, generatingFormat }: Props) {
  const isGenerating = generatingFormat !== null

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.utility}>
          <WeatherClock />
          <div className={styles.actions}>
            <ThemeToggle />
            {(["pdf", "docx"] satisfies DocumentFormat[]).map((format) => (
              <button
                key={format}
                className={styles.downloadButton}
                onClick={() => onDownload(format)}
                disabled={isGenerating}
                aria-busy={generatingFormat === format}
                aria-label={`Download ${FORMAT_LABEL[format]}`}
              >
                <DownloadIcon />
                {FORMAT_LABEL[format]}
              </button>
            ))}
          </div>
        </div>
        <Header />
      </div>
    </header>
  )
}
