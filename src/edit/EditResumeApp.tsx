import { useCallback, useEffect, useState } from "react"

import { Awards } from "@components/Awards"
import { Education } from "@components/Education"
import { Header } from "@components/Header"
import { Languages } from "@components/Languages"
import { Showcase } from "@components/Showcase"
import { SoftSkills } from "@components/SoftSkills"
import { Summary } from "@components/Summary"
import { TechnicalSkills } from "@components/TechnicalSkills"
import { WorkExperience } from "@components/WorkExperience"

import { resumeData } from "@data/resumeData"

import { EditProvider } from "@edit/EditContext"
import styles from "@edit/EditResumeApp.module.css"
import { VariationsPanel } from "@edit/VariationsPanel"

import { useStore } from "@state/useStore"
import { useSync } from "@state/useSync"
import { useVariations } from "@state/useVariations"

import { type DocumentFormat, documentFileName } from "@utils/documentFileName"
import { toData } from "@utils/toData"

import appStyles from "@app/App.module.css"

export default function EditResumeApp() {
  const { variations, activeId } = useVariations()
  const active = variations.find((v) => v.id === activeId)
  const initialData = active?.data ?? resumeData

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
    // No-op while signed out; pushes the saved variation when signed in.
    void useSync.getState().syncNow()
  }, [saveActive])

  const onNew = useCallback(
    (name: string) => {
      createVariation(name, toData(useStore.getState()))
      void useSync.getState().syncNow()
    },
    [createVariation]
  )

  const onGenerate = useCallback(
    async (format: DocumentFormat) => {
      const data = useStore.getState()
      const filename = documentFileName({
        name: data.name,
        label: activeName || data.title,
        extension: format,
      })
      if (format === "docx") {
        const { generateResumeDocx, downloadBlob } = await import("@docx")
        downloadBlob(await generateResumeDocx(data), filename)
        return
      }
      const { generateResumePdf, downloadBlob } = await import("@pdf")
      downloadBlob(await generateResumePdf(data), filename)
    },
    [activeName]
  )

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
          <Header stacked />
          <div className={`${appStyles.container} ${styles.container}`}>
            <main className={appStyles.main}>
              <Summary />
              <TechnicalSkills index={1} eyebrow="Stack" />
              <SoftSkills index={2} eyebrow="Soft Skills" />
              <WorkExperience index={3} eyebrow="Experience" />
              <Showcase index={4} eyebrow="Selected Work" />
              <div className={appStyles.subgrid}>
                <Awards index={5} eyebrow="Recognition" />
                <Languages index={6} eyebrow="Languages" />
                <Education index={7} eyebrow="Education" />
              </div>
            </main>
          </div>
        </div>
      </EditProvider>
    </div>
  )
}
