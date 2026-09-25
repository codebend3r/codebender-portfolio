import styles from "@components/ThemeToggle.module.css"

import { applySky } from "@sky"

import { useTheme } from "@state/useTheme"

import type { ThemeChoice } from "@utils/theme"

const OPTIONS: readonly { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
]

// Light / Dark / Auto segmented control. Auto follows the sky: light
// during day and dawn, dark at dusk and night.
export function ThemeToggle() {
  const choice = useTheme((state) => state.choice)
  const setChoice = useTheme((state) => state.setChoice)

  const pick = (value: ThemeChoice) => {
    setChoice(value)
    applySky(value)
  }

  return (
    <div className={styles.group} role="group" aria-label="Color theme">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={
            option.value === choice
              ? `${styles.option} ${styles.active}`
              : styles.option
          }
          aria-pressed={option.value === choice}
          onClick={() => pick(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
