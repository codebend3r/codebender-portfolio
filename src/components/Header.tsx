import { Fragment } from "react"

import Logo from "@assets/robot-logo.png"

import styles from "@components/Header.module.css"

import { useEditing } from "@edit/EditContext"
import { EditableText } from "@edit/EditableText"
import { SortableItem, SortableList } from "@edit/SortableList"
import sortStyles from "@edit/SortableList.module.css"

import { useStore } from "@state/useStore"

function EmailIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function isEmail(value: string) {
  return !isUrl(value) && value.includes("@")
}

function isPhone(value: string) {
  return /^[\d\s()+.-]+$/.test(value.trim()) && /\d/.test(value)
}

function contactHref(value: string): string | null {
  if (isUrl(value)) return value
  if (isEmail(value)) return `mailto:${value}`
  if (isPhone(value)) return `tel:${value}`
  return null
}

function ContactIcon({ value }: { value: string }) {
  if (value.includes("github.com")) return <GitHubIcon />
  if (value.includes("linkedin.com")) return <LinkedInIcon />
  if (isUrl(value)) return <LinkIcon />
  if (isEmail(value)) return <EmailIcon />
  if (isPhone(value)) return <PhoneIcon />
  return null
}

function ContactValue({ entry }: { entry: ContactEntry }) {
  const href = contactHref(entry.value)
  if (!href) return <span className={styles.location}>{entry.value}</span>
  // Links read by their label; email and phone read by their value.
  const text = isUrl(entry.value) ? entry.label : entry.value
  const external = isUrl(entry.value)
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <ContactIcon value={entry.value} />
      <span className={styles.label}>{text}</span>
    </a>
  )
}

export function Header() {
  const { name, title, contact } = useStore()
  const { editing, markDirty } = useEditing()
  const store = useStore.getState()

  const act = (fn: () => void) => () => {
    fn()
    markDirty()
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img src={Logo} alt="Logo" className={styles.logo} />
        <div>
          <h1>
            <EditableText value={name} path={["name"]} ariaLabel="Name" />
          </h1>
          <p className={styles.subtitle}>
            <EditableText value={title} path={["title"]} ariaLabel="Title" />
          </p>
        </div>
      </div>
      {editing ? (
        <SortableList
          count={contact.length}
          onReorder={(from, to) => store.reorder(["contact"], from, to)}
        >
          <ul className={`${styles.contactEdit} ${sortStyles.cardList}`}>
            {contact.map((entry, i) => (
              <SortableItem
                key={i}
                index={i}
                label={`link ${i + 1}`}
                className={sortStyles.rowCard}
              >
                {(handle) => (
                  <>
                    {handle}
                    <span className={styles.linkFields}>
                      <EditableText
                        value={entry.label}
                        path={["contact", i, "label"]}
                        ariaLabel={`Link ${i + 1} label`}
                      />
                      <EditableText
                        value={entry.value}
                        path={["contact", i, "value"]}
                        ariaLabel={`Link ${i + 1} value`}
                      />
                    </span>
                    <button
                      type="button"
                      className={sortStyles.removeButton}
                      aria-label={`Remove link ${i + 1}`}
                      onClick={act(() =>
                        store.setPath(
                          ["contact"],
                          contact.filter((_, x) => x !== i)
                        )
                      )}
                    >
                      ✕
                    </button>
                  </>
                )}
              </SortableItem>
            ))}
            <li>
              <button
                type="button"
                className={sortStyles.addChip}
                onClick={act(() =>
                  store.setPath(
                    ["contact"],
                    [...contact, { label: "Link", value: "https://" }]
                  )
                )}
              >
                + Add link
              </button>
            </li>
          </ul>
        </SortableList>
      ) : (
        <div className={styles.contact}>
          {contact.map((entry, i) => (
            <Fragment key={i}>
              {i > 0 && <span className={styles.sep}>•</span>}
              <ContactValue entry={entry} />
            </Fragment>
          ))}
        </div>
      )}
    </header>
  )
}
