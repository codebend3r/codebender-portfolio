import { Section } from "@components/Section"
import styles from "@components/Showcase.module.css"

import { useEditing } from "@edit/EditContext"
import { EditableText } from "@edit/EditableText"
import { SortableItem, SortableList } from "@edit/SortableList"

import { useStore } from "@state/useStore"

export function Showcase({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { showcase } = useStore()
  const { editing } = useEditing()
  const store = useStore.getState()

  return (
    <Section title="Selected Work" index={index} eyebrow={eyebrow}>
      <SortableList
        count={showcase.length}
        onReorder={(from, to) => store.reorder(["showcase"], from, to)}
      >
        <ul className={styles.grid}>
          {showcase.map((item, i) =>
            editing ? (
              <SortableItem key={i} index={i} label={`showcase ${i + 1}`}>
                {(handle) => (
                  <div className={styles.card}>
                    <span className={styles.frame} aria-hidden>
                      <span className={styles.dots}>
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                        <span className={styles.dot} />
                      </span>
                      <span className={styles.domain}>
                        <EditableText
                          value={item.domain}
                          path={["showcase", i, "domain"]}
                          ariaLabel={`Showcase ${i + 1} domain`}
                        />
                      </span>
                    </span>
                    <span className={styles.shot}>
                      <img src={item.image} alt={`${item.name} website`} />
                    </span>
                    <span className={styles.body}>
                      <span className={styles.titleRow}>
                        {handle}
                        <h3 className={styles.name}>
                          <EditableText
                            value={item.name}
                            path={["showcase", i, "name"]}
                            ariaLabel={`Showcase ${i + 1} name`}
                          />
                        </h3>
                        <span className={styles.period}>
                          <EditableText
                            value={item.period}
                            path={["showcase", i, "period"]}
                            ariaLabel={`Showcase ${i + 1} period`}
                          />
                        </span>
                      </span>
                      <span className={styles.role}>
                        <EditableText
                          value={item.role}
                          path={["showcase", i, "role"]}
                          ariaLabel={`Showcase ${i + 1} role`}
                        />
                      </span>
                      <span className={styles.description}>
                        <EditableText
                          value={item.description}
                          path={["showcase", i, "description"]}
                          multiline
                          ariaLabel={`Showcase ${i + 1} description`}
                        />
                      </span>
                      <SortableList
                        count={item.tags.length}
                        onReorder={(from, to) =>
                          store.reorder(["showcase", i, "tags"], from, to)
                        }
                      >
                        <span className={styles.tags}>
                          {item.tags.map((tag, t) => (
                            <SortableItem
                              key={t}
                              index={t}
                              label={`tag ${t + 1}`}
                              as="span"
                              className={styles.tag}
                              dragWholeItem
                            >
                              {() => tag}
                            </SortableItem>
                          ))}
                        </span>
                      </SortableList>
                    </span>
                  </div>
                )}
              </SortableItem>
            ) : (
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
                    <span className={styles.description}>
                      {item.description}
                    </span>
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
            )
          )}
        </ul>
      </SortableList>
    </Section>
  )
}
