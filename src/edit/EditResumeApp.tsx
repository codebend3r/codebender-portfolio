import { useCallback, useEffect, useState } from "react"

import { Awards } from "@components/Awards"
import { Education } from "@components/Education"
import { Header } from "@components/Header"
import { Languages } from "@components/Languages"
import { Showcase } from "@components/Showcase"
import { Summary } from "@components/Summary"
import { TechnicalSkills } from "@components/TechnicalSkills"
import { WorkExperience } from "@components/WorkExperience"

import resume from "@data/resume.json"

import { EditProvider } from "@edit/EditContext"
import styles from "@edit/EditResumeApp.module.css"
import { VariationsPanel } from "@edit/VariationsPanel"

import { useStore } from "@state/useStore"
import { useVariations } from "@state/useVariations"

import appStyles from "@app/App.module.css"

function toData(state: ResumeStore): Data {
  return Object.fromEntries(
    Object.entries(state).filter(([, v]) => typeof v !== "function")
  ) as Data
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "resume"
  )
}

export default function EditResumeApp() {
  const { variations, activeId } = useVariations()
  const active = variations.find((v) => v.id === activeId)
  const initialData = active ? active.data : (resume as Data)

  // Key on the selection so switching variations remounts the session,
  // resetting its dirty flag without calling setState inside an effect.
  return (
    <EditSession
      key={activeId ?? "__base__"}
      activeId={activeId}
      activeName={active?.name ?? null}
      initialData={initialData}
    />
  )
}

function EditSession({
  activeId,
  activeName,
  initialData,
}: {
  activeId: string | null
  activeName: string | null
  initialData: Data
}) {
  const { createVariation, saveActive } = useVariations()
  const [dirty, setDirty] = useState(false)

  const editing = activeId !== null

  useEffect(() => {
    useStore.getState().loadData(initialData)
  }, [initialData])

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  const markDirty = useCallback(() => setDirty(true), [])

  const onSave = useCallback(() => {
    saveActive(toData(useStore.getState()))
    setDirty(false)
  }, [saveActive])

  const onNew = useCallback(
    (name: string) => {
      createVariation(name, toData(useStore.getState()))
    },
    [createVariation]
  )

  const onGenerate = useCallback(async () => {
    const { generateResumePdf, downloadBlob } = await import("@pdf")
    const blob = await generateResumePdf(useStore.getState())
    const filename = activeName
      ? `cj_rivas_${slugify(activeName)}.pdf`
      : "cj_rivas_senior_frontend_engineer.pdf"
    downloadBlob(blob, filename)
  }, [activeName])

  return (
    <div className={styles.page}>
      <VariationsPanel
        dirty={dirty}
        onSave={onSave}
        onGenerate={onGenerate}
        onNew={onNew}
      />
      <EditProvider editing={editing} markDirty={markDirty}>
        <div
          id="resume-root"
          className={`${appStyles.resumeRoot}${editing ? " resume-editing" : ""}`}
        >
          <Header />
          <div className={`${appStyles.container} ${styles.container}`}>
            <main className={appStyles.main}>
              <Summary />
              <TechnicalSkills index={1} eyebrow="Stack" />
              <WorkExperience index={2} eyebrow="Experience" />
              <Showcase index={3} eyebrow="Selected Work" />
              <div className={appStyles.subgrid}>
                <Awards index={4} eyebrow="Recognition" />
                <Languages index={5} eyebrow="Languages" />
                <Education index={6} eyebrow="Education" />
              </div>
            </main>
          </div>
        </div>
      </EditProvider>
    </div>
  )
}
