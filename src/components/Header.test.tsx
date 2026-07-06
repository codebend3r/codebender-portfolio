import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { Header } from "@components/Header"

import resume from "@data/resume.json"

import { EditProvider } from "@edit/EditContext"

import { useStore } from "@state/useStore"

const contactValue = (label: string) =>
  resume.contact.find((c) => c.label === label)!.value

describe("Header", () => {
  it("renders the name as the page heading", () => {
    render(<Header />)
    expect(
      screen.getByRole("heading", { level: 1, name: resume.name })
    ).toBeInTheDocument()
  })

  it("renders the title/subtitle", () => {
    render(<Header />)
    expect(screen.getByText(resume.title)).toBeInTheDocument()
  })

  it("renders an email mailto: link", () => {
    render(<Header />)
    const email = contactValue("Email")
    const link = screen.getByRole("link", { name: email })
    expect(link).toHaveAttribute("href", `mailto:${email}`)
  })

  it("renders a phone tel: link", () => {
    render(<Header />)
    const phone = contactValue("Phone")
    const link = screen.getByRole("link", { name: phone })
    expect(link).toHaveAttribute("href", `tel:${phone}`)
  })

  it("renders the location text", () => {
    render(<Header />)
    expect(screen.getByText(contactValue("Location"))).toBeInTheDocument()
  })

  it("renders a GitHub link that opens in a new tab safely", () => {
    render(<Header />)
    const link = screen.getByRole("link", { name: "GitHub" })
    expect(link).toHaveAttribute("href", contactValue("GitHub"))
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("renders a LinkedIn link that opens in a new tab safely", () => {
    render(<Header />)
    const link = screen.getByRole("link", { name: "LinkedIn" })
    expect(link).toHaveAttribute("href", contactValue("LinkedIn"))
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("renders contact entries in data order", () => {
    render(<Header />)
    const email = screen.getByText(contactValue("Email"))
    const location = screen.getByText(contactValue("Location"))
    const github = screen.getByText("GitHub")
    const follows = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    expect(follows(email, location)).toBe(true)
    expect(follows(location, github)).toBe(true)
  })

  it("renders the logo with alt text", () => {
    render(<Header />)
    expect(screen.getByAltText("Logo")).toBeInTheDocument()
  })

  it("uses the two-column layout by default", () => {
    render(<Header />)
    expect(screen.getByRole("banner").className).not.toContain("stacked")
  })

  it("stacks brand above contact when `stacked` is set", () => {
    render(<Header stacked />)
    expect(screen.getByRole("banner").className).toContain("stacked")
  })
})

describe("Header editing", () => {
  beforeEach(() => {
    useStore.getState().loadData(structuredClone(resume) as Data)
  })

  function renderEditing() {
    return render(
      <EditProvider editing markDirty={() => {}}>
        <Header />
      </EditProvider>
    )
  }

  it("renders a drag handle per contact link", async () => {
    renderEditing()
    const handles = await screen.findAllByRole("button", {
      name: /drag to reorder link \d/i,
    })
    expect(handles).toHaveLength(resume.contact.length)
  })

  it("adds a link", () => {
    renderEditing()
    fireEvent.click(screen.getByRole("button", { name: /add link/i }))
    const { contact } = useStore.getState()
    expect(contact).toHaveLength(resume.contact.length + 1)
    expect(contact[contact.length - 1]).toEqual({
      label: "Link",
      value: "https://",
    })
  })

  it("removes a link", () => {
    renderEditing()
    fireEvent.click(screen.getByRole("button", { name: /^remove link 1$/i }))
    const { contact } = useStore.getState()
    expect(contact).toHaveLength(resume.contact.length - 1)
    expect(contact[0].label).toBe(resume.contact[1].label)
  })

  it("reorders links through the store action", () => {
    useStore.getState().reorder(["contact"], 0, 2)
    const { contact } = useStore.getState()
    expect(contact[2].label).toBe(resume.contact[0].label)
  })
})
