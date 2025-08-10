import { Section } from './Section'

import type { Data } from '../types'

export function TechnicalSkills({ d }: { d: Data }) {
  return (
    <Section title="Technical Skills">
      <ul className="pill-list">
        {d.technical_skills.map((s) => (
          <li key={s} className="pill">
            {s}
          </li>
        ))}
      </ul>
    </Section>
  )
}
