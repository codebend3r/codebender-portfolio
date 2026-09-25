import { Section } from "@components/Section"
import styles from "@components/Showcase.module.css"

import { EditableText } from "@edit/EditableText"
import { useEditing } from "@edit/EditContext"
import { SortableItem, SortableList } from "@edit/SortableList"
import sortStyles from "@edit/SortableList.module.css"

import { useStore } from "@state/useStore"

import { isSideProjectShowcase } from "@utils/showcase"

export function Showcase({
  index,
  eyebrow,
}: {
  index?: number
  eyebrow?: string
}) {
  const { showcase } = useStore()
  const { editing, markDirty } = useEditing()
  const store = useStore.getState()

  const act = (fn: () => void) => () => {
    fn()
    markDirty()
  }

  // The public page shows client engagements only — side projects live in
  // the Codebender section. The editor keeps every entry editable, and `i`
  // stays the store index so edit paths keep lining up.
  const rows = showcase
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => editing || !isSideProjectShowcase(item))

  return (
    <Section title="Selected Work" index={index} eyebrow={eyebrow}>
      <SortableList
        count={showcase.length}
        onReorder={(from, to) => store.reorder(["showcase"], from, to)}
      >
        <ul className={styles.grid}>
          {rows.map(({ item, i }) =>
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
                      {!!item.repo && (
                        <span className={styles.role}>
                          <EditableText
                            value={item.repo}
                            path={["showcase", i, "repo"]}
                            ariaLabel={`Showcase ${i + 1} repo`}
                          />
                        </span>
                      )}
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
                              label={`showcase ${i + 1} tag ${t + 1}`}
                              as="span"
                              className={`${styles.tag} ${styles.tagEditing}`}
                            >
                              {(tagHandle) => (
                                <>
                                  {tagHandle}
                                  <EditableText
                                    value={tag}
                                    path={["showcase", i, "tags", t]}
                                    ariaLabel={`Showcase ${i + 1} tag ${t + 1}`}
                                  />
                                  <button
                                    type="button"
                                    className={sortStyles.removeButton}
                                    aria-label={`Remove tag ${t + 1} from showcase ${i + 1}`}
                                    onClick={act(() =>
                                      store.setPath(
                                        ["showcase", i, "tags"],
                                        item.tags.filter((_, x) => x !== t)
                                      )
                                    )}
                                  >
                                    ✕
                                  </button>
                                </>
                              )}
                            </SortableItem>
                          ))}
                          <button
                            type="button"
                            className={sortStyles.addChip}
                            aria-label={`Add tag to showcase ${i + 1}`}
                            onClick={act(() =>
                              store.setPath(
                                ["showcase", i, "tags"],
                                [...item.tags, "New tag"]
                              )
                            )}
                          >
                            + Tag
                          </button>
                        </span>
                      </SortableList>
                    </span>
                  </div>
                )}
              </SortableItem>
            ) : (
              <li key={item.url} className={styles.clientCard}>
                <a
                  className={styles.clientShot}
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
                <span className={styles.clientHead}>
                  <h3 className={styles.clientName}>{item.name}</h3>
                  <span className={styles.clientPeriod}>{item.period}</span>
                </span>
                <span className={styles.clientRole}>{item.role}</span>
                <span className={styles.clientDescription}>
                  {item.description}
                </span>
              </li>
            )
          )}
        </ul>
      </SortableList>
    </Section>
  )
}
