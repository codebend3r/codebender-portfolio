import styles from "@components/Codebender.module.css"
import sectionStyles from "@components/Section.module.css"

import { codebenderIntro, codebenderPillars } from "@data/codebender"

import { useStore } from "@state/useStore"

import { isSideProjectShowcase } from "@utils/showcase"

// The Codebender Inc. section: the side-project practice, set apart from
// employment with its own amber identity. Pillars describe how the
// practice works; the cards below are the shipped side projects.
export function Codebender({
  index,
  eyebrow,
}: {
  index: number
  eyebrow: string
}) {
  const { showcase } = useStore()
  const projects = showcase.filter(isSideProjectShowcase)

  return (
    <section
      id="codebender"
      className={`${sectionStyles.section} ${styles.cbSection}`}
    >
      <span className={`${sectionStyles.chip} ${styles.cbChip}`}>
        <span
          className={`${sectionStyles.chipDot} ${styles.cbChipDot}`}
          aria-hidden
        />
        {String(index).padStart(2, "0")} · {eyebrow}
      </span>
      <header className={styles.intro}>
        <h2 className={styles.title}>Codebender Inc.</h2>
        <p className={styles.tagline}>{codebenderIntro}</p>
      </header>
      <ul className={styles.pillars}>
        {codebenderPillars.map((pillar, i) => (
          <li key={pillar.title} className={styles.pillar}>
            <span className={styles.pillarNum}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={styles.pillarTitle}>{pillar.title}</span>
            <span className={styles.pillarBody}>{pillar.body}</span>
          </li>
        ))}
      </ul>
      <ul className={styles.projects}>
        {projects.map((item) => (
          <li key={item.url} className={styles.project}>
            <a
              className={styles.shot}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${item.name} — live site`}
            >
              <img
                src={item.image}
                alt={`${item.name} screenshot`}
                loading="lazy"
              />
            </a>
            <span className={styles.projectHead}>
              <h3 className={styles.projectName}>{item.name}</h3>
              <span className={styles.projectLinks}>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  Live ↗
                </a>
                {!!item.repo && (
                  <a href={item.repo} target="_blank" rel="noopener noreferrer">
                    Code ↗
                  </a>
                )}
              </span>
            </span>
            <p className={styles.projectDescription}>{item.description}</p>
            <span className={styles.projectTags}>
              {item.tags.map((tag) => (
                <span key={tag} className={styles.projectTag}>
                  {tag}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
