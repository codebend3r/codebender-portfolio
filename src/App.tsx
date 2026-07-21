import { useCallback, useState } from "react"

import { AppHeader } from "@components/AppHeader"
import { Awards } from "@components/Awards"
import { Education } from "@components/Education"
import { Footer } from "@components/Footer"
import { Languages } from "@components/Languages"
import { SectionNav } from "@components/SectionNav"
import { Showcase } from "@components/Showcase"
import { Sky } from "@components/Sky"
import { SoftSkills } from "@components/SoftSkills"
import { Summary } from "@components/Summary"
import { TechnicalSkills } from "@components/TechnicalSkills"
import { Weather } from "@components/Weather"
import { WorkExperience } from "@components/WorkExperience"

import { useStore } from "@state/useStore"

import { type DocumentFormat, documentFileName } from "@utils/documentFileName"

import styles from "@app/App.module.css"

export default function App() {
  const [generatingFormat, setGeneratingFormat] =
    useState<DocumentFormat | null>(null)

  const onDownload = useCallback(
    async (format: DocumentFormat) => {
      if (generatingFormat) return
      setGeneratingFormat(format)
      try {
        const data = useStore.getState()
        const filename = documentFileName({
          name: data.name,
          label: data.title,
          extension: format,
        })
        if (format === "docx") {
          const { generateResumeDocx, downloadBlob } = await import("@docx")
          downloadBlob(await generateResumeDocx(data), filename)
        } else {
          const { generateResumePdf, downloadBlob } = await import("@pdf")
          downloadBlob(await generateResumePdf(data), filename)
        }
      } catch (err) {
        console.error("Document generation failed:", err)
      } finally {
        setGeneratingFormat(null)
      }
    },
    [generatingFormat]
  )

  return (
    <>
      <Sky />
      <Weather />
      <SectionNav />
      <div id="resume-root" className={styles.resumeRoot}>
        <AppHeader
          onDownload={onDownload}
          generatingFormat={generatingFormat}
        />

        <div className={styles.container}>
          <main className={styles.main}>
            <Summary />
            <TechnicalSkills index={1} eyebrow="Stack" />
            <SoftSkills index={2} eyebrow="Soft Skills" />
            <WorkExperience index={3} eyebrow="Experience" />
            <Showcase index={4} eyebrow="Selected Work" />

            <div className={styles.subgrid}>
              <Awards index={5} eyebrow="Recognition" />
              <Languages index={6} eyebrow="Languages" />
              <Education index={7} eyebrow="Education" />
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </>
  )
}
