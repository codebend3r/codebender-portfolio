import { useCallback, useEffect, useState } from "react"

import { AppHeader } from "@components/AppHeader"
import { Awards } from "@components/Awards"
import { Codebender } from "@components/Codebender"
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

import { applySky } from "@sky"

import { useStore } from "@state/useStore"
import { useTheme } from "@state/useTheme"

import { type DocumentFormat, documentFileName } from "@utils/documentFileName"

import styles from "@app/App.module.css"

export default function App() {
  const [generatingFormat, setGeneratingFormat] =
    useState<DocumentFormat | null>(null)
  const themeChoice = useTheme((state) => state.choice)

  // Repaint the backdrop and data-theme tokens whenever the choice changes;
  // Entry.tsx ran the first applySky before mount.
  useEffect(() => {
    applySky(themeChoice)
  }, [themeChoice])

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
            <WorkExperience index={2} eyebrow="Experience" />
            <Codebender index={3} eyebrow="Side Projects · Since 2011" />
            <Showcase index={4} eyebrow="Selected Client Work" />

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
