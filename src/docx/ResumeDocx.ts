import { tokens } from "@theme/tokens"
import { Buffer } from "buffer"
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  ImageRun,
  LineRuleType,
  PageNumber,
  Paragraph,
  ShadingType,
  Tab,
  TabStopType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
} from "docx"

import {
  TRANSPARENT_PNG_BASE64,
  emailIconSvg,
  githubIconSvg,
  linkedinIconSvg,
  phoneIconSvg,
} from "@utils/brandIcons"
import {
  contactHref,
  contactIconKind,
  isDirectContactKind,
  isLocationEntry,
  isSocialContactKind,
} from "@utils/contact"
import { employmentParts } from "@utils/employment"

type ContactChild = TextRun | ExternalHyperlink

const CONTACT_ICON_SIZE = 12 // px, sits alongside the small contact text
const CONTACT_ICON_TRANSFORMATION = {
  width: CONTACT_ICON_SIZE,
  height: CONTACT_ICON_SIZE,
}

export type DocxFont = { name: string; data: Buffer }

// react-pdf styles are in points; Word wants half-points for font sizes and
// twentieths of a point (twips/dxa) for lengths.
const halfPoints = (pt: number) => Math.round(pt * 2)
const twips = (pt: number) => Math.round(pt * 20)
const hex = (color: string) => color.replace("#", "").toUpperCase()

// 240ths of a line, mirroring the PDF's unitless line-heights.
const lineOf = (lineHeight: number) => Math.round(lineHeight * 240)

const PAGE_WIDTH = twips(612) // LETTER: 8.5in
const PAGE_HEIGHT = twips(792) // LETTER: 11in
const MARGIN_X = twips(tokens.page.paddingHorizontal)
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

const FONT = tokens.font.family
const FONT_SEMIBOLD = `${tokens.font.family} Semibold`
const FONT_SANS = tokens.font.sans

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" }
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
}

function headerParagraphs(data: Data): Paragraph[] {
  return [
    new Paragraph({
      spacing: { after: twips(tokens.spacing.xs) },
      children: [
        new TextRun({
          text: data.name,
          font: FONT,
          bold: true,
          size: halfPoints(tokens.fontSize.h1),
          characterSpacing: twips(0.2),
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: twips(tokens.spacing.xs) },
      children: [
        new TextRun({
          text: data.title,
          color: hex(tokens.colors.accent),
          size: halfPoints(tokens.fontSize.subtitle),
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: twips(tokens.spacing.lg) },
      children: [new TextRun({ text: data.summary })],
    }),
  ]
}

const contactPlainStyle = {
  color: hex(tokens.colors.onAccent),
  size: halfPoints(tokens.fontSize.small),
}
// Underline linked text entries so they read as hyperlinks: without explicit
// run properties Word renders ExternalHyperlink text like any plain run.
const contactLinkStyle = {
  ...contactPlainStyle,
  underline: { type: UnderlineType.SINGLE },
}

function svgIconRun({
  svg,
  name,
  description,
}: {
  svg: string
  name: string
  description: string
}): ImageRun {
  return new ImageRun({
    type: "svg",
    data: Buffer.from(svg, "utf-8"),
    fallback: {
      type: "png",
      data: Buffer.from(TRANSPARENT_PNG_BASE64, "base64"),
    },
    transformation: CONTACT_ICON_TRANSFORMATION,
    altText: { name, description },
  })
}

// Email/phone icons sit inline with their readable value.
function directIconRun(kind: "email" | "phone"): ImageRun {
  const color = tokens.colors.onAccent
  if (kind === "email") {
    return svgIconRun({
      svg: emailIconSvg(color),
      name: "Email",
      description: "Email address",
    })
  }
  return svgIconRun({
    svg: phoneIconSvg(color),
    name: "Phone",
    description: "Phone number",
  })
}

// Web/social icons (portfolio, GitHub, LinkedIn) render icon-only, embedded
// as SVG (Word 2016+ draws it directly; the fallback only matters to legacy
// viewers). The portfolio link reuses the site's own logo image, passed in
// as already-fetched bytes.
function socialIconRun({
  kind,
  logo,
}: {
  kind: "github" | "linkedin" | "site"
  logo: Buffer
}): ImageRun {
  if (kind === "site") {
    return new ImageRun({
      type: "png",
      data: logo,
      transformation: CONTACT_ICON_TRANSFORMATION,
      altText: { name: "Portfolio", description: "Portfolio website" },
    })
  }
  const color = tokens.colors.onAccent
  const svg = kind === "github" ? githubIconSvg(color) : linkedinIconSvg(color)
  return svgIconRun({
    svg,
    name: kind === "github" ? "GitHub" : "LinkedIn",
    description: kind === "github" ? "GitHub profile" : "LinkedIn profile",
  })
}

function contactSeparatorRun(): TextRun {
  return new TextRun({
    text: "   •   ",
    color: hex(tokens.colors.onAccentMuted),
    size: halfPoints(tokens.fontSize.small),
  })
}

// Direct contact methods (email, phone): icon + the readable value, joined
// by a muted bullet so multiple entries still read as one cluster.
function directContactRuns(entries: ContactEntry[]): ContactChild[] {
  return entries.flatMap((entry, i) => {
    const separator = i > 0 ? [contactSeparatorRun()] : []
    const kind = contactIconKind(entry.value)
    if (!isDirectContactKind(kind)) {
      return [
        ...separator,
        new TextRun({ text: entry.value, ...contactPlainStyle }),
      ]
    }
    const href = contactHref(entry.value) ?? entry.value
    return [
      ...separator,
      new ExternalHyperlink({
        link: href,
        children: [
          directIconRun(kind),
          new TextRun({ text: " " }),
          new TextRun({ text: entry.value, ...contactLinkStyle }),
        ],
      }),
    ]
  })
}

// Web/social links: icon-only, evenly spaced.
function socialContactRuns({
  entries,
  logo,
}: {
  entries: ContactEntry[]
  logo: Buffer
}): ContactChild[] {
  return entries.flatMap((entry, i) => {
    const kind = contactIconKind(entry.value)
    if (!isSocialContactKind(kind)) return []
    const spacer = i > 0 ? [new TextRun({ text: "  " })] : []
    return [
      ...spacer,
      new ExternalHyperlink({
        link: entry.value,
        children: [socialIconRun({ kind, logo })],
      }),
    ]
  })
}

// Two clusters in a borderless, full-bleed table spanning the full page
// width (negative indent cancels the page margin): direct contact methods
// left-aligned in the wider cell, web/social icons right-aligned in the
// narrower one — the same left/right grouping a flexbox space-between would
// produce, expressed with Word's table primitives.
function contactBar({ data, logo }: { data: Data; logo: Buffer }): Table {
  const contact = data.contact.filter((entry) => !isLocationEntry(entry))
  const social = contact.filter((entry) =>
    isSocialContactKind(contactIconKind(entry.value))
  )
  const direct = contact.filter(
    (entry) => !isSocialContactKind(contactIconKind(entry.value))
  )
  const leftWidth = Math.round(PAGE_WIDTH * 0.58)
  const rightWidth = PAGE_WIDTH - leftWidth
  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    indent: { size: -MARGIN_X, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: NO_BORDERS,
    columnWidths: [leftWidth, rightWidth],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: {
              type: ShadingType.CLEAR,
              fill: hex(tokens.colors.accentDeep),
            },
            margins: {
              top: twips(tokens.spacing.sm),
              bottom: twips(tokens.spacing.sm),
              left: MARGIN_X,
              right: twips(tokens.spacing.md),
            },
            children: [new Paragraph({ children: directContactRuns(direct) })],
          }),
          new TableCell({
            shading: {
              type: ShadingType.CLEAR,
              fill: hex(tokens.colors.accentDeep),
            },
            margins: {
              top: twips(tokens.spacing.sm),
              bottom: twips(tokens.spacing.sm),
              left: twips(tokens.spacing.md),
              right: MARGIN_X,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: socialContactRuns({ entries: social, logo }),
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: {
      before: twips(tokens.spacing.lg),
      after: twips(tokens.spacing.md),
    },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 8, // eighths of a point: a 1pt rule
        space: tokens.spacing.xs, // points between text and rule
        color: hex(tokens.colors.rule),
      },
    },
    children: [
      new TextRun({
        text,
        allCaps: true,
        bold: true,
        color: hex(tokens.colors.accent),
        size: halfPoints(tokens.fontSize.h2),
        characterSpacing: twips(1.2),
      }),
    ],
  })
}

// Skill pills: shaded runs padded with spaces; extra line spacing keeps
// wrapped pill rows from touching (Word has no border-radius on runs).
function skillPills(skills: string[]): Paragraph {
  return new Paragraph({
    spacing: { line: lineOf(1.5), lineRule: LineRuleType.AUTO },
    children: skills.flatMap((skill, i) => {
      const pill = new TextRun({
        text: ` ${skill} `,
        color: hex(tokens.colors.onAccent),
        size: halfPoints(tokens.fontSize.small),
        shading: {
          type: ShadingType.CLEAR,
          fill: hex(tokens.colors.accentDeep),
        },
      })
      return i === 0 ? [pill] : [new TextRun({ text: "  " }), pill]
    }),
  })
}

// One experience entry, indented like the PDF's timeline block: the accent
// dash hangs in the gutter, role/period share a line via a right tab stop,
// and keepNext/keepLines emulate the PDF's wrap={false}.
function experienceParagraphs(entry: Experience): Paragraph[] {
  const indent = twips(22)
  const employment = employmentParts(entry)
  const employmentRun = {
    italics: true,
    size: halfPoints(tokens.fontSize.small),
  }
  return [
    new Paragraph({
      keepNext: true,
      keepLines: true,
      indent: { left: indent, hanging: indent },
      tabStops: [
        { type: TabStopType.LEFT, position: indent },
        { type: TabStopType.RIGHT, position: CONTENT_WIDTH },
      ],
      children: [
        new TextRun({
          children: ["—", new Tab()],
          bold: true,
          color: hex(tokens.colors.accent),
        }),
        new TextRun({
          text: entry.role,
          font: FONT,
          bold: true,
          size: halfPoints(tokens.fontSize.h3),
        }),
        new TextRun({ children: [new Tab()] }),
        new TextRun({
          text: entry.period,
          italics: true,
          size: halfPoints(tokens.fontSize.small),
          color: hex(tokens.colors.muted),
        }),
      ],
    }),
    new Paragraph({
      keepNext: true,
      keepLines: true,
      indent: { left: indent },
      spacing: { after: twips(3) },
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_WIDTH }],
      children: [
        new TextRun({
          text: entry.company,
          font: FONT_SEMIBOLD,
          color: hex(tokens.colors.accent),
        }),
        ...(employment.length
          ? [
              new TextRun({ children: [new Tab()] }),
              ...employment.flatMap((part, i) => [
                ...(i > 0
                  ? [
                      new TextRun({
                        ...employmentRun,
                        text: " · ",
                        color: hex(tokens.colors.muted),
                      }),
                    ]
                  : []),
                new TextRun({
                  ...employmentRun,
                  text: part.label,
                  color: hex(tokens.colors.employment[part.key]),
                }),
              ]),
            ]
          : []),
      ],
    }),
    ...entry.achievements.map(
      (achievement, i) =>
        new Paragraph({
          keepNext: i < entry.achievements.length - 1,
          keepLines: true,
          indent: { left: indent + twips(10), hanging: twips(10) },
          spacing: {
            line: lineOf(1.3),
            lineRule: LineRuleType.AUTO,
            after:
              i === entry.achievements.length - 1
                ? twips(tokens.spacing.lg)
                : twips(2),
          },
          children: [
            new TextRun({ text: "•  ", color: hex(tokens.colors.accent) }),
            new TextRun({ text: achievement }),
          ],
        })
    ),
  ]
}

function metaItemParagraphs({
  primary,
  secondary,
}: {
  primary: string
  secondary: string
}): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: primary, font: FONT, bold: true })],
    }),
    new Paragraph({
      spacing: { after: twips(tokens.spacing.sm) },
      children: [
        new TextRun({
          text: secondary,
          size: halfPoints(tokens.fontSize.small),
          color: hex(tokens.colors.muted),
        }),
      ],
    }),
  ]
}

// Awards / Languages / Education as a borderless three-column table.
function metaRow(data: Data): Table {
  const width = Math.floor(CONTENT_WIDTH / 3)
  const columns: { heading: string; items: Paragraph[] }[] = [
    {
      heading: "Awards",
      items: data.awards.flatMap((award) =>
        metaItemParagraphs({
          primary: award.name,
          secondary: `${award.organization} · ${award.year}`,
        })
      ),
    },
    {
      heading: "Languages",
      items: data.languages.flatMap((lang) =>
        metaItemParagraphs({ primary: lang.name, secondary: lang.proficiency })
      ),
    },
    {
      heading: "Education",
      items: data.education.flatMap((ed) =>
        metaItemParagraphs({ primary: ed.program, secondary: ed.institution })
      ),
    },
  ]
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: NO_BORDERS,
    columnWidths: columns.map(() => width),
    rows: [
      new TableRow({
        children: columns.map(
          ({ heading, items }, i) =>
            new TableCell({
              margins: {
                top: 0,
                bottom: 0,
                left: 0,
                right: i === columns.length - 1 ? 0 : twips(tokens.spacing.xl),
              },
              children: [sectionHeading(heading), ...items],
            })
        ),
      }),
    ],
  })
}

function pageFooter(name: string): Footer {
  const style = {
    italics: true,
    size: halfPoints(tokens.fontSize.micro),
    color: hex(tokens.colors.muted),
  }
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: `${name}  ·  Page `, ...style }),
          new TextRun({ children: [PageNumber.CURRENT], ...style }),
          new TextRun({ text: " of ", ...style }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], ...style }),
        ],
      }),
    ],
  })
}

export function buildResumeDocument({
  data,
  fonts,
  logo,
}: {
  data: Data
  fonts: DocxFont[]
  logo: Buffer
}): Document {
  return new Document({
    title: `${data.name} - ${data.title}`,
    creator: data.name,
    subject: "Resume",
    fonts,
    styles: {
      default: {
        document: {
          run: {
            font: FONT_SANS,
            size: halfPoints(tokens.fontSize.body),
            color: hex(tokens.colors.text),
          },
          paragraph: {
            spacing: { line: lineOf(1.45), lineRule: LineRuleType.AUTO },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: {
              top: twips(tokens.page.paddingTop),
              bottom: twips(tokens.page.paddingBottom),
              left: MARGIN_X,
              right: MARGIN_X,
              footer: twips(tokens.spacing.xl),
            },
          },
        },
        footers: { default: pageFooter(data.name) },
        children: [
          ...headerParagraphs(data),
          contactBar({ data, logo }),
          sectionHeading("Technical Skills"),
          skillPills(data.technical_skills),
          sectionHeading("Soft Skills"),
          skillPills(data.soft_skills),
          sectionHeading("Work Experience"),
          ...data.work_experience.flatMap(experienceParagraphs),
          metaRow(data),
        ],
      },
    ],
  })
}
