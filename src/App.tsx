import { useCallback, useRef, useState } from "react"

import html2pdf from "html2pdf.js"

import { Awards } from "@components/Awards"
import { Education } from "@components/Education"
import { Footer } from "@components/Footer"
import { Header } from "@components/Header"
import { Languages } from "@components/Languages"
import { Sky } from "@components/Sky"
import { Summary } from "@components/Summary"
import { TechnicalSkills } from "@components/TechnicalSkills"
import { Weather } from "@components/Weather"
import { WorkExperience } from "@components/WorkExperience"

import { waitForAssets } from "@utils/print-utils"

import styles from "./App.module.css"

import "@styles/index.css"

export default function App() {
  const resumeRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const onDownload = useCallback(async () => {
    const el = resumeRef.current
    if (!el || isGenerating) return

    setIsGenerating(true)
    try {
      await waitForAssets(el)

      const widthPx = Math.max(el.scrollWidth, el.clientWidth)
      const heightPx = Math.max(el.scrollHeight, el.clientHeight)

      const opt = {
        filename: "cj_rivas_senior_frontend_engineer.pdf",
        margin: 0,
        image: { type: "png" },
        html2canvas: {
          scale: Math.min(window.devicePixelRatio || 2, 2),
          useCORS: true,
          backgroundColor: "#0b0e14",
          windowWidth: widthPx,
          windowHeight: heightPx,
        },
        jsPDF: {
          unit: "px",
          format: [widthPx, heightPx],
          orientation: widthPx > heightPx ? "landscape" : "portrait",
          putOnlyUsedFonts: true,
          compress: true,
          hotfixes: ["px_scaling"],
        },
        pagebreak: { mode: ["css", "legacy"] },
      }

      await html2pdf().set(opt).from(el).save()
    } catch (err) {
      console.error("PDF generation failed:", err)
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating])

  return (
    <>
      <Sky />
      <Weather />
      <div className={styles.hoverButton}>
        <button
          className={styles.downloadButton}
          onClick={onDownload}
          disabled={isGenerating}
          aria-busy={isGenerating}
        >
          {isGenerating ? "Generating…" : "Download PDF"}
        </button>
      </div>
      <div id="resume-root" className={styles.resumeRoot} ref={resumeRef}>
        <div className={styles.container}>
          <Header />

          <main>
            <Summary />
            <TechnicalSkills />
            <WorkExperience />

            <div>
              <Awards />
              <Languages />
              <Education />
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </>
  )
}
