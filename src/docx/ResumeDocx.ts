import { tokens } from "@theme/tokens"
import type { Buffer } from "buffer"
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
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
  WidthType,
} from "docx"

import { isEmail, isUrl, stripProtocol } from "@utils/contact"

type ContactChild = TextRun | ExternalHyperlink

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

function contactChild(value: string): ContactChild {
  const style = {
    color: hex(tokens.colors.onAccent),
    size: halfPoints(tokens.fontSize.small),
  }
  if (isUrl(value)) {
    return new ExternalHyperlink({
      link: value,
      children: [new TextRun({ text: stripProtocol(value), ...style })],
    })
  }
  if (isEmail(value)) {
    return new ExternalHyperlink({
      link: `mailto:${value}`,
      children: [new TextRun({ text: value, ...style })],
    })
  }
  return new TextRun({ text: value, ...style })
}

// Outer contact cells hug their page edge; inner cells center.
function contactAlignment({ index, count }: { index: number; count: number }) {
  if (index === 0) return AlignmentType.LEFT
  if (index === count - 1) return AlignmentType.RIGHT
  return AlignmentType.CENTER
}

// The PDF's full-bleed contact bar: a borderless single-row table spanning
// the full page width (negative indent cancels the page margin), one shaded
// cell per entry, outer cells padded back to the content edge.
function contactBar(data: Data): Table {
  const count = data.contact.length
  const width = Math.floor(PAGE_WIDTH / count)
  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    indent: { size: -MARGIN_X, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: NO_BORDERS,
    columnWidths: data.contact.map(() => width),
    rows: [
      new TableRow({
        children: data.contact.map(
          (entry, i) =>
            new TableCell({
              shading: {
                type: ShadingType.CLEAR,
                fill: hex(tokens.colors.accentDeep),
              },
              margins: {
                top: twips(tokens.spacing.sm),
                bottom: twips(tokens.spacing.sm),
                left: i === 0 ? MARGIN_X : twips(tokens.spacing.md),
                right: i === count - 1 ? MARGIN_X : twips(tokens.spacing.md),
              },
              children: [
                new Paragraph({
                  alignment: contactAlignment({ index: i, count }),
                  children: [contactChild(entry.value)],
                }),
              ],
            })
        ),
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
      children: [
        new TextRun({
          text: entry.company,
          font: FONT_SEMIBOLD,
          color: hex(tokens.colors.accent),
        }),
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
      children: [new TextRun({ text: primary, bold: true })],
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
}: {
  data: Data
  fonts: DocxFont[]
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
            font: FONT,
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
          contactBar(data),
          sectionHeading("Technical Skills"),
          skillPills(data.technical_skills),
          sectionHeading("Work Experience"),
          ...data.work_experience.flatMap(experienceParagraphs),
          metaRow(data),
        ],
      },
    ],
  })
}
