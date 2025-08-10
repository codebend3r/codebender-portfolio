import { Section } from './Section';

import type { Data } from '../types';

export function Languages({ d }: { d: Data }) {
  return (
    <Section title="Languages">
      <ul>
        {d.languages.map((l) => (
          <li key={l.name}>
            <strong>{l.name}:</strong> {l.proficiency}
          </li>
        ))}
      </ul>
    </Section>
  );
}
