import { Section } from "@components/Section"
import styles from "@components/Showcase.module.css"

import { useStore } from "@state/useStore"

export function Showcase({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { showcase } = useStore()

  return (
    <Section title="Selected Work" index={index} eyebrow={eyebrow}>
      <ul className={styles.grid}>
        {showcase.map((item) => (
          <li key={item.url}>
            <a
              className={styles.card}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.frame} aria-hidden>
                <span className={styles.dots}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </span>
                <span className={styles.domain}>{item.domain}</span>
              </span>
              <span className={styles.shot}>
                <img
                  src={item.image}
                  alt={`${item.name} website`}
                  loading="lazy"
                />
              </span>
              <span className={styles.body}>
                <span className={styles.titleRow}>
                  <h3 className={styles.name}>{item.name}</h3>
                  <span className={styles.period}>{item.period}</span>
                </span>
                <span className={styles.role}>{item.role}</span>
                <span className={styles.description}>{item.description}</span>
                <span className={styles.tags}>
                  {item.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}
