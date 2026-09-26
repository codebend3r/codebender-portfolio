import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CareerMap } from "@components/CareerMap"

import resume from "@data/resume.json"

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

  it("renders a titled bar per dated entry", () => {
    render(<CareerMap />)
    resume.work_experience.forEach((job) => {
      expect(
        screen.getByTitle(`${job.company} · ${job.period}`)
      ).toBeInTheDocument()
    })
  })

  it("labels the side-project track with its running span", () => {
    render(<CareerMap />)
    expect(screen.getByText("Side projects · 2011 → now")).toBeInTheDocument()
  })

  it("positions bars inside the range", () => {
    render(<CareerMap />)
    const bar = screen.getByTitle("Codebender Inc. · 01/2011 - Present")
    const style = bar.getAttribute("style") ?? ""
    const left = Number(/left: ([\d.]+)%/.exec(style)?.[1] ?? Number.NaN)
    const width = Number(/width: ([\d.]+)%/.exec(style)?.[1] ?? Number.NaN)
    expect(left).toBeGreaterThan(0)
    expect(width).toBeGreaterThan(0)
    expect(left + width).toBeLessThanOrEqual(100)
  })

  it("shows year ticks starting at the career's first year", () => {
    render(<CareerMap />)
    expect(screen.getByText("2008")).toBeInTheDocument()
    expect(screen.getByText("2026")).toBeInTheDocument()
  })
})
