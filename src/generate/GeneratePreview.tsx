import { useEffect } from "react"

import { Awards } from "@components/Awards"
import { Education } from "@components/Education"
import { Header } from "@components/Header"
import { Languages } from "@components/Languages"
import { Showcase } from "@components/Showcase"
import { Summary } from "@components/Summary"
import { TechnicalSkills } from "@components/TechnicalSkills"
import { WorkExperience } from "@components/WorkExperience"

import styles from "@generate/GeneratePreview.module.css"

import { useStore } from "@state/useStore"

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

  return (
    <section className={styles.preview}>
      <div className={styles.controls}>
        <label className={styles.nameLabel}>
          Variation name
          <input
            aria-label="Variation name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </label>
        <button type="button" onClick={onConfirm}>
          Save & edit
        </button>
        <button type="button" onClick={onDiscard}>
          Discard
        </button>
      </div>
      <div className={styles.resume}>
        <Header />
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
    </section>
  )
}
