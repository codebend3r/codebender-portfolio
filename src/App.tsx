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

import { css } from "@styled-system/css"

import "@styles/index.css"

const hoverButtonStyles = css({
  display: "grid",
  width: "100%",
  position: "sticky",
  marginLeft: "auto",
  top: "16px",
  padding: "16px",
  zIndex: 10,
  justifyContent: "end",
  "@media print": { display: "none" },
})

const downloadButtonStyles = css({
  appearance: "none",
  border: "2px solid token(colors.accent)",
  alignItems: "center",
  cursor: "pointer",
  gap: "8px",
  background: "bg",
  color: "accent",
  padding: "8px 16px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "20px",
  transition:
    "background-color 0.2s ease, box-shadow 0.4s ease, opacity 0.2s ease",
  "&:hover:not(:disabled)": {
    animation: "glowPulse 0.5s infinite alternate",
  },
  "&:disabled": {
    cursor: "progress",
    opacity: 0.7,
  },
})

const resumeRootStyles = css({
  position: "relative",
  zIndex: 1,
  background: "bg",
})

const containerStyles = css({
  position: "relative",
  zIndex: 1,
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "32px 20px 60px",
})

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
      <div className={hoverButtonStyles}>
        <button
          className={downloadButtonStyles}
          onClick={onDownload}
          disabled={isGenerating}
          aria-busy={isGenerating}
        >
          {isGenerating ? "Generating…" : "Download PDF"}
        </button>
      </div>
      <div id="resume-root" className={resumeRootStyles} ref={resumeRef}>
        <div className={containerStyles}>
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
