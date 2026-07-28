import styles from "@edit/EditableText.module.css"
import { useEditing } from "@edit/EditContext"

export function EditableSelect({
  value,
  options,
  placeholder,
  ariaLabel,
  onCommit,
}: {
  value: string
  options: readonly { value: string; label: string }[]
  placeholder: string
  ariaLabel: string
  onCommit: (next: string) => void
}) {
  const { markDirty } = useEditing()

  return (
    <select
      className={styles.field}
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => {
        onCommit(event.target.value)
        markDirty()
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
