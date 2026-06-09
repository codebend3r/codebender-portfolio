import type { ReactNode } from "react"

import { Document, Link, Page, Text, View } from "@react-pdf/renderer"

import { styles } from "@pdf/styles"

type Props = { data: Data }

export function ResumePDF({ data }: Props) {
  return (
    <Document
      title={`${data.name} — ${data.title}`}
      author={data.name}
      subject="Resume"
    >
      <Page size="LETTER" style={styles.page}>
        <ResumeHeader data={data} />

        <Section heading="Summary">
          <Text style={styles.summary}>{data.summary}</Text>
        </Section>

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
      </Page>
    </Document>
  )
}

function ResumeHeader({ data }: { data: Data }) {
  return (
    <View style={styles.header}>
      <Text style={styles.name}>{data.name}</Text>
      <Text style={styles.title}>{data.title}</Text>
      <View style={styles.contact}>
        <Text style={styles.contactItem}>{data.contact.location}</Text>
        <Link style={styles.contactLink} src={`mailto:${data.contact.email}`}>
          {data.contact.email}
        </Link>
        <Text style={styles.contactItem}>{data.contact.phone}</Text>
        <Link style={styles.contactLink} src={data.contact.github}>
          {stripProtocol(data.contact.github)}
        </Link>
        <Link style={styles.contactLink} src={data.contact.linkedin}>
          {stripProtocol(data.contact.linkedin)}
        </Link>
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
  return (
    <View style={styles.experience} wrap={false}>
      <View style={styles.experienceHeader}>
        <Text style={styles.role}>{entry.role}</Text>
        <Text style={styles.period}>{entry.period}</Text>
      </View>
      <Text style={styles.company}>{entry.company}</Text>
      {entry.achievements.map((a, i) => (
        <View key={i} style={styles.achievement}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.achievementText}>{a}</Text>
        </View>
      ))}
    </View>
  )
}

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, "")
}
