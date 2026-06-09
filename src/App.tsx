import { useCallback, useState } from "react"

import { AppHeader } from "@components/AppHeader"
import { Awards } from "@components/Awards"
import { Education } from "@components/Education"
import { Footer } from "@components/Footer"
import { Languages } from "@components/Languages"
import { SectionNav } from "@components/SectionNav"
import { Showcase } from "@components/Showcase"
import { Sky } from "@components/Sky"
import { Summary } from "@components/Summary"
import { TechnicalSkills } from "@components/TechnicalSkills"
import { Weather } from "@components/Weather"
import { WorkExperience } from "@components/WorkExperience"

import { useStore } from "@state/useStore"

import styles from "@app/App.module.css"

export default function App() {
  const [isGenerating, setIsGenerating] = useState(false)

  const onDownload = useCallback(async () => {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      const { generateResumePdf, downloadBlob } = await import("@pdf")
      const data = useStore.getState()
      const blob = await generateResumePdf(data)
      downloadBlob(blob, "cj_rivas_senior_frontend_engineer.pdf")
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
      <SectionNav />
      <div id="resume-root" className={styles.resumeRoot}>
        <AppHeader onDownload={onDownload} isGenerating={isGenerating} />

        <div className={styles.container}>
          <main className={styles.main}>
            <Summary />
            <TechnicalSkills index={1} eyebrow="Stack" />
            <WorkExperience index={2} eyebrow="Experience" />
            <Showcase index={3} eyebrow="Selected Work" />

            <div className={styles.subgrid}>
              <Awards index={4} eyebrow="Recognition" />
              <Languages index={5} eyebrow="Languages" />
              <Education index={6} eyebrow="Education" />
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </>
  )
}
