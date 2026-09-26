import { Fragment, type ReactNode } from "react"

import {
  Circle,
  Document,
  Image,
  Link,
  Page,
  Path,
  Rect,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer"

import Logo from "@assets/robot-logo.png"

import { styles } from "@pdf/styles"

import { tokens } from "@theme/tokens"

import {
  EMAIL_ICON_PATH,
  EMAIL_ICON_RECT,
  GITHUB_ICON_PATH,
  ICON_VIEWBOX,
  LINKEDIN_ICON_CIRCLE,
  LINKEDIN_ICON_PATH,
  LINKEDIN_ICON_RECT,
  PHONE_ICON_PATH,
} from "@utils/brandIcons"
import {
  contactHref,
  contactIconKind,
  isDirectContactKind,
  isLocationEntry,
  isSocialContactKind,
} from "@utils/contact"
import { employmentParts, partitionExperience } from "@utils/employment"

type Props = { data: Data }

export function ResumePDF({ data }: Props) {
  const tracks = partitionExperience(data.work_experience)
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

        <Section heading="Soft Skills">
          <View style={styles.skillsList}>
            {data.soft_skills.map((skill) => (
              <Text key={skill} style={styles.skillPill}>
                {skill}
              </Text>
            ))}
          </View>
        </Section>

        <Section heading="Work Experience">
          {tracks.main.map((entry, i) => (
            <ExperienceEntry key={`${entry.company}-${i}`} entry={entry} />
          ))}
        </Section>

        {!!tracks.side.length && (
          <Section heading="Side Projects & Part-Time Work">
            {tracks.side.map((entry, i) => (
              <ExperienceEntry
                key={`${entry.company}-${i}`}
                entry={entry}
                side
              />
            ))}
          </Section>
        )}

        {/* wrap={false}: keep the headings with their entries rather than
            stranding them at the foot of a page. */}
        <View style={styles.metaRow} wrap={false}>
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
  const contact = data.contact.filter((entry) => !isLocationEntry(entry))
  const social = contact.filter((entry) =>
    isSocialContactKind(contactIconKind(entry.value))
  )
  const direct = contact.filter(
    (entry) => !isSocialContactKind(contactIconKind(entry.value))
  )
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.name}>{data.name}</Text>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.summary}>{data.summary}</Text>
      </View>
      <View style={styles.contactBar}>
        <View style={styles.contactGroup}>
          {/* Keyed by index: labels are user-editable and default to a
              shared "Link", so they are not unique. */}
          {direct.map((entry, i) => (
            <Fragment key={i}>
              {i > 0 && <Text style={styles.contactSep}>{"•"}</Text>}
              <DirectContact entry={entry} />
            </Fragment>
          ))}
        </View>
        <View style={styles.contactGroup}>
          {social.map((entry, i) => (
            <SocialContact key={i} entry={entry} />
          ))}
        </View>
      </View>
    </View>
  )
}

// Direct contact methods (email, phone) render as an icon + the readable
// value, so it can be read or copied at a glance, not just clicked.
function DirectContact({ entry }: { entry: ContactEntry }) {
  const kind = contactIconKind(entry.value)
  if (!isDirectContactKind(kind)) {
    return <Text style={styles.contactItem}>{entry.value}</Text>
  }
  const href = contactHref(entry.value) ?? entry.value
  return (
    <Link style={styles.contactLinkRow} src={href}>
      <ContactSvgIcon kind={kind} />
      <Text style={styles.contactLink}>{entry.value}</Text>
    </Link>
  )
}

// Web/social links (portfolio, GitHub, LinkedIn) render icon-only — the
// destination doesn't need spelling out, unlike an email or phone number.
function SocialContact({ entry }: { entry: ContactEntry }) {
  const kind = contactIconKind(entry.value)
  if (!isSocialContactKind(kind)) return null
  if (kind === "site") {
    return (
      <Link src={entry.value}>
        <Image src={Logo} style={styles.contactIcon} />
      </Link>
    )
  }
  return (
    <Link src={entry.value}>
      <ContactSvgIcon kind={kind} />
    </Link>
  )
}

function ContactSvgIcon({
  kind,
}: {
  kind: "email" | "phone" | "github" | "linkedin"
}) {
  const strokeProps = {
    stroke: tokens.colors.onAccent,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  }
  return (
    <Svg viewBox={ICON_VIEWBOX} style={styles.contactIcon}>
      {kind === "email" && (
        <>
          <Rect
            x={EMAIL_ICON_RECT.x}
            y={EMAIL_ICON_RECT.y}
            width={EMAIL_ICON_RECT.width}
            height={EMAIL_ICON_RECT.height}
            rx={EMAIL_ICON_RECT.rx}
            {...strokeProps}
          />
          <Path d={EMAIL_ICON_PATH} {...strokeProps} />
        </>
      )}
      {kind === "phone" && <Path d={PHONE_ICON_PATH} {...strokeProps} />}
      {kind === "github" && <Path d={GITHUB_ICON_PATH} {...strokeProps} />}
      {kind === "linkedin" && (
        <>
          <Path d={LINKEDIN_ICON_PATH} {...strokeProps} />
          <Rect
            x={LINKEDIN_ICON_RECT.x}
            y={LINKEDIN_ICON_RECT.y}
            width={LINKEDIN_ICON_RECT.width}
            height={LINKEDIN_ICON_RECT.height}
            {...strokeProps}
          />
          <Circle
            cx={LINKEDIN_ICON_CIRCLE.cx}
            cy={LINKEDIN_ICON_CIRCLE.cy}
            r={LINKEDIN_ICON_CIRCLE.r}
            {...strokeProps}
          />
        </>
      )}
    </Svg>
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

function ExperienceEntry({
  entry,
  side = false,
}: {
  entry: Experience
  side?: boolean
}) {
  const employment = employmentParts(entry)
  // wrap={false} keeps the whole entry on one page: when it does not fit
  // in the remaining space it moves to the next page instead of splitting.
  return (
    <View
      style={
        side ? [styles.experience, styles.sideExperience] : styles.experience
      }
      wrap={false}
    >
      {!side && <View style={styles.timelineDash} />}
      <View style={styles.experienceHeader}>
        <Text style={styles.role}>{entry.role}</Text>
        <Text style={styles.period}>{entry.period}</Text>
      </View>
      <View style={styles.companyRow}>
        <Text style={styles.company}>{entry.company}</Text>
        {!!employment.length && (
          <Text style={styles.employment}>
            {employment.map((part, i) => (
              <Fragment key={part.key}>
                {i > 0 && " · "}
                <Text style={{ color: tokens.colors.employment[part.key] }}>
                  {part.label}
                </Text>
              </Fragment>
            ))}
          </Text>
        )}
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
