import { useEffect, useMemo } from "react"

import { Awards } from "@components/Awards"
import { DiffProvider } from "@components/DiffContext"
import { Education } from "@components/Education"
import { Header } from "@components/Header"
import { Languages } from "@components/Languages"
import { Showcase } from "@components/Showcase"
import { Summary } from "@components/Summary"
import { TechnicalSkills } from "@components/TechnicalSkills"
import { WorkExperience } from "@components/WorkExperience"

import { resumeData as baseResume } from "@data/resumeData"

import styles from "@generate/GeneratePreview.module.css"

import { useStore } from "@state/useStore"

import { diffResume } from "@utils/resumeDiff"

type GeneratePreviewProps = {
  data: Data
  name: string
  onNameChange: (name: string) => void
  onConfirm: () => void
  onDiscard: () => void
}

export function GeneratePreview({
  data,
  name,
  onNameChange,
  onConfirm,
  onDiscard,
}: GeneratePreviewProps) {
  const loadData = useStore((s) => s.loadData)

  useEffect(() => {
    loadData(structuredClone(data))
  }, [data, loadData])

  const diff = useMemo(
    () => diffResume({ base: baseResume, generated: data }),
    [data]
  )

  return (
    <section className={styles.preview}>
      <div className={styles.controls}>
        <label className={styles.nameLabel}>
          Variation name
          <input
            aria-label="Variation name"
            className={styles.nameInput}
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </label>
        <button type="button" className={styles.confirm} onClick={onConfirm}>
          Save & edit
        </button>
        <button type="button" className={styles.discard} onClick={onDiscard}>
          Discard
        </button>
      </div>
      <p className={styles.legend}>
        <span className={styles.legendSwatch} aria-hidden="true" />
        Highlighted lines were changed from the base resume — review them before
        saving.
      </p>
      <DiffProvider value={diff}>
        <div className={styles.resume}>
          <Header stacked />
          <Summary />
          <TechnicalSkills index={1} eyebrow="Stack" />
          <WorkExperience index={2} eyebrow="Experience" />
          <Showcase index={3} eyebrow="Selected Work" />
          <div className={styles.subgrid}>
            <Awards index={4} eyebrow="Recognition" />
            <Languages index={5} eyebrow="Languages" />
            <Education index={6} eyebrow="Education" />
          </div>
        </div>
      </DiffProvider>
    </section>
  )
}
