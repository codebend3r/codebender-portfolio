import { useStore } from "@state/useStore"

import { Section } from "@components/Section"

export function WorkExperience() {
  const { work_experience } = useStore()

  return (
    <Section title="Work Experience">
      <ul className="timeline">
        {work_experience.map((w) => (
          <li key={w.company + w.period}>
            <div className="timeline-item">
              <div className="timeline-header">
                <div>
                  <h3>{w.role}</h3>
                  <p className="muted">{w.company}</p>
                </div>
                <span className="period">{w.period}</span>
              </div>
              <ul className="bullets">
                {w.achievements.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
