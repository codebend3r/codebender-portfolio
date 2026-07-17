import type { ReactNode } from "react"

import { Document, Link, Page, Text, View } from "@react-pdf/renderer"

import { styles } from "@pdf/styles"

import { isUrl, stripProtocol } from "@utils/contact"
import { formatEmployment } from "@utils/employment"

type Props = { data: Data }

export function ResumePDF({ data }: Props) {
  return (
    <Document
      title={`${data.name} - ${data.title}`}
      author={data.name}
      subject="Resume"
    >
      <Page size="LETTER" style={styles.page}>
        <ResumeHeader data={data} />

        <Section heading="Technical Skills">
          <View style={styles.skillsList}>
            {data.technical_skills.map((skill) => (
              <Text key={skill} style={styles.skillPill}>
                {skill}
              </Text>
            ))}
          </View>
        </Section>

        <Section heading="Work Experience">
          {data.work_experience.map((entry, i) => (
            <ExperienceEntry key={`${entry.company}-${i}`} entry={entry} />
          ))}
        </Section>

        <View style={styles.metaRow}>
          <View style={styles.metaColumn}>
            <Section heading="Awards">
              {data.awards.map((award) => (
                <View key={award.name} style={styles.metaItem}>
                  <Text style={styles.metaPrimary}>{award.name}</Text>
                  <Text style={styles.metaSecondary}>
                    {award.organization} · {award.year}
                  </Text>
                </View>
              ))}
            </Section>
          </View>
          <View style={styles.metaColumn}>
            <Section heading="Languages">
              {data.languages.map((lang) => (
                <View key={lang.name} style={styles.metaItem}>
                  <Text style={styles.metaPrimary}>{lang.name}</Text>
                  <Text style={styles.metaSecondary}>{lang.proficiency}</Text>
                </View>
              ))}
            </Section>
          </View>
          <View style={styles.metaColumn}>
            <Section heading="Education">
              {data.education.map((ed) => (
                <View key={ed.program} style={styles.metaItem}>
                  <Text style={styles.metaPrimary}>{ed.program}</Text>
                  <Text style={styles.metaSecondary}>{ed.institution}</Text>
                </View>
              ))}
            </Section>
          </View>
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${data.name}  ·  Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  )
}

function ResumeHeader({ data }: { data: Data }) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.name}>{data.name}</Text>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.summary}>{data.summary}</Text>
      </View>
      <View style={styles.contactBar}>
        {data.contact.map((entry, i) => {
          if (isUrl(entry.value)) {
            return (
              <Link key={i} style={styles.contactItem} src={entry.value}>
                {stripProtocol(entry.value)}
              </Link>
            )
          }
          if (entry.value.includes("@")) {
            return (
              <Link
                key={i}
                style={styles.contactItem}
                src={`mailto:${entry.value}`}
              >
                {entry.value}
              </Link>
            )
          }
          return (
            <Text key={i} style={styles.contactItem}>
              {entry.value}
            </Text>
          )
        })}
      </View>
    </View>
  )
}

function Section({
  heading,
  children,
}: {
  heading: string
  children: ReactNode
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {children}
    </View>
  )
}

function ExperienceEntry({ entry }: { entry: Experience }) {
  const employment = formatEmployment(entry)
  // wrap={false} keeps the whole entry on one page: when it does not fit
  // in the remaining space it moves to the next page instead of splitting.
  return (
    <View style={styles.experience} wrap={false}>
      <View style={styles.timelineDash} />
      <View style={styles.experienceHeader}>
        <Text style={styles.role}>{entry.role}</Text>
        <Text style={styles.period}>{entry.period}</Text>
      </View>
      <View style={styles.companyRow}>
        <Text style={styles.company}>{entry.company}</Text>
        {!!employment && <Text style={styles.employment}>{employment}</Text>}
      </View>
      {entry.achievements.map((a, i) => (
        <Text key={i} style={styles.achievement}>
          <Text style={styles.bullet}>{"\u2022  "}</Text>
          {a}
        </Text>
      ))}
    </View>
  )
}
