import data from './data.json';
import type { Data } from './types';
import Logo from './assets/logo.svg';

const d = data as Data;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function App() {
  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <img src={Logo} alt="Logo" className="logo" />
          <div>
            <h1>{d.name}</h1>
            <p className="subtitle">{d.title}</p>
          </div>
        </div>
        <div className="contact">
          <a href={`mailto:${d.contact.email}`}>{d.contact.email}</a>
          <span>•</span>
          <a href={`tel:${d.contact.phone}`}>{d.contact.phone}</a>
          <span>•</span>
          <span>{d.contact.location}</span>
          <span>•</span>
          <a href={d.contact.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </header>

      <main>
        <Section title="Summary">
          <p>{d.summary}</p>
        </Section>

        <Section title="Technical Skills">
          <ul className="pill-list">
            {d.technical_skills.map((s) => (
              <li key={s} className="pill">
                {s}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Work Experience">
          <ul className="timeline">
            {d.work_experience.map((w) => (
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

        <div className="grid-2">
          <Section title="Awards">
            <ul>
              {d.awards.map((a) => (
                <li key={a.name + a.year}>
                  <strong>{a.name}</strong> — {a.organization} ({a.year})
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Languages">
            <ul>
              {d.languages.map((l) => (
                <li key={l.name}>
                  <strong>{l.name}:</strong> {l.proficiency}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Education">
            <ul>
              {d.education.map((e) => (
                <li key={e.program + e.institution}>
                  <strong>{e.program}</strong> — {e.institution}
                  {e.details ? ` — ${e.details}` : ''}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </main>

      <footer className="footer">
        <small>
          © {new Date().getFullYear()} {d.name}. Built with Vite + React.
        </small>
      </footer>
    </div>
  );
}
