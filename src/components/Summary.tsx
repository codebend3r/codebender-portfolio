import { Section } from './Section';

import type { Data } from '../types';

export function Summary({ d }: { d: Data }) {
  return (
    <Section title="Summary">
      <p>{d.summary}</p>
    </Section>
  );
}
