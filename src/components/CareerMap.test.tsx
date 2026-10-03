import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CareerMap } from "@components/CareerMap"

import resume from "@data/resume.json"

const SIDE_NAME = "Codebender Inc.: Side projects · 2011 → now"

const slotOf = (name: string) =>
  screen.getByRole("button", { name }).closest("li")

describe("CareerMap", () => {
  it("renders the legend for all three tracks", () => {
    render(<CareerMap />)
    expect(screen.getByText("Career map")).toBeInTheDocument()
    expect(screen.getByText("Full-time")).toBeInTheDocument()
    expect(screen.getByText("Part-time contract")).toBeInTheDocument()
    expect(
      screen.getByText("Codebender Inc. (side projects)")
    ).toBeInTheDocument()
  })

  it("is a labelled figure", () => {
    render(<CareerMap />)
    expect(
      screen.getByRole("figure", { name: "Career map" })
    ).toBeInTheDocument()
  })

  it("renders a button per dated entry, named after its company", () => {
    render(<CareerMap />)
    resume.work_experience.forEach((job) => {
      const name = job.side_project ? SIDE_NAME : job.company
      expect(screen.getAllByRole("button", { name }).length).toBeGreaterThan(0)
    })
  })

  it("groups bars into one labelled list per lane", () => {
    render(<CareerMap />)
    const fullTime = resume.work_experience.filter(
      (job) => !job.side_project && job.schedule !== "part-time"
    )
    expect(
      within(screen.getByRole("list", { name: "Employment" })).getAllByRole(
        "button"
      )
    ).toHaveLength(fullTime.length)
    expect(
      within(screen.getByRole("list", { name: "Part-time" })).getAllByRole(
        "button"
      )
    ).toHaveLength(1)
    expect(
      within(
        screen.getByRole("list", { name: "Codebender Inc." })
      ).getAllByRole("button")
    ).toHaveLength(1)
  })

  it("orders each lane oldest first so tab order follows the timeline", () => {
    render(<CareerMap />)
    const bars = within(
      screen.getByRole("list", { name: "Employment" })
    ).getAllByRole("button")
    expect(bars[0]).toHaveAccessibleName("Research Now")
    expect(bars[bars.length - 1]).toHaveAccessibleName("The Globe and Mail")
  })

  it("labels the side-project track with its running span", () => {
    render(<CareerMap />)
    expect(screen.getByText("Side projects · 2011 → now")).toBeInTheDocument()
  })

  it("positions bars inside the range", () => {
    render(<CareerMap />)
    const style = slotOf(SIDE_NAME)?.getAttribute("style") ?? ""
    const left = Number(/left: ([\d.]+)%/.exec(style)?.[1] ?? Number.NaN)
    const width = Number(/width: ([\d.]+)%/.exec(style)?.[1] ?? Number.NaN)
    expect(left).toBeGreaterThan(0)
    expect(width).toBeGreaterThan(0)
    expect(left + width).toBeLessThanOrEqual(100)
  })

  it("describes each bar with its role, dates, tenure, and employment", () => {
    render(<CareerMap />)
    const kobo = screen.getByRole("button", { name: "Kobo Inc." })
    expect(kobo).toHaveAccessibleDescription(
      expect.stringContaining("Intermediate Frontend Developer")
    )
    expect(kobo).toHaveAccessibleDescription(
      expect.stringContaining("Feb 2012 – Mar 2014 · 2 years 2 months")
    )
    expect(kobo).toHaveAccessibleDescription(
      expect.stringContaining("Full-time · Permanent")
    )
    expect(kobo).toHaveAccessibleDescription(
      expect.stringContaining("SproutCore")
    )
  })

  it("describes bars that are too short to carry a label", () => {
    render(<CareerMap />)
    const myplanet = screen.getByRole("button", { name: "Myplanet" })
    expect(myplanet).toHaveTextContent("")
    expect(myplanet).toHaveAccessibleDescription(
      expect.stringContaining("Dec 2020 – Feb 2021")
    )
  })

  it("keeps an ongoing role open-ended in its description", () => {
    render(<CareerMap />)
    expect(
      screen.getByRole("button", { name: SIDE_NAME })
    ).toHaveAccessibleDescription(expect.stringContaining("Jan 2011 – Present"))
  })

  it("opens the popover on hover and closes it when the pointer leaves", async () => {
    const user = userEvent.setup()
    render(<CareerMap />)
    const kobo = screen.getByRole("button", { name: "Kobo Inc." })
    expect(slotOf("Kobo Inc.")).toHaveAttribute("data-open", "false")

    await user.hover(kobo)
    expect(slotOf("Kobo Inc.")).toHaveAttribute("data-open", "true")

    await user.unhover(kobo)
    expect(slotOf("Kobo Inc.")).toHaveAttribute("data-open", "false")
  })

  it("keeps only one popover open at a time", async () => {
    const user = userEvent.setup()
    render(<CareerMap />)
    await user.hover(screen.getByRole("button", { name: "Kobo Inc." }))
    await user.hover(screen.getByRole("button", { name: "Rogers" }))
    expect(slotOf("Kobo Inc.")).toHaveAttribute("data-open", "false")
    expect(slotOf("Rogers")).toHaveAttribute("data-open", "true")
  })

  it("opens on keyboard focus and closes on Escape", async () => {
    const user = userEvent.setup()
    render(<CareerMap />)
    await user.tab()
    expect(screen.getByRole("button", { name: "Research Now" })).toHaveFocus()
    expect(slotOf("Research Now")).toHaveAttribute("data-open", "true")

    await user.keyboard("{Escape}")
    expect(slotOf("Research Now")).toHaveAttribute("data-open", "false")
  })

  it("opens on tap and closes on a press outside it", () => {
    render(<CareerMap />)
    fireEvent.click(screen.getByRole("button", { name: "Rogers" }))
    expect(slotOf("Rogers")).toHaveAttribute("data-open", "true")

    fireEvent.pointerDown(document.body)
    expect(slotOf("Rogers")).toHaveAttribute("data-open", "false")
  })

  it("shows year ticks starting at the career's first year", () => {
    render(<CareerMap />)
    expect(screen.getByText("2008")).toBeInTheDocument()
    expect(screen.getByText("2026")).toBeInTheDocument()
  })

  it("plays the reveal once the map scrolls into view", () => {
    const observed: {
      reveal?: (entries: { isIntersecting: boolean }[]) => void
    } = {}
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(
          callback: (entries: { isIntersecting: boolean }[]) => void
        ) {
          observed.reveal = callback
        }
        observe() {}
        disconnect() {}
        unobserve() {}
      }
    )
    render(<CareerMap />)
    const map = screen.getByRole("figure", { name: "Career map" })
    expect(map).toHaveAttribute("data-reveal", "pending")

    act(() => observed.reveal?.([{ isIntersecting: false }]))
    expect(map).toHaveAttribute("data-reveal", "pending")

    act(() => observed.reveal?.([{ isIntersecting: true }]))
    expect(map).toHaveAttribute("data-reveal", "done")
  })
})
