import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { experienceId } from "@utils/experienceId"

import type { TimelineRow, TimelineWindow } from "./TimelineFigure"
import { computeBands, TimelineFigure } from "./TimelineFigure"

// Fixed "now", after Varicent's real end date (06/2022) so its bounds never
// depend on the actual current date.
const NOW = new Date(2022, 5, 1)

describe("TimelineFigure", () => {
  it("renders nothing with fewer than two known ids", () => {
    const { container } = render(
      <TimelineFigure ids={["not_a_real_id"]} now={NOW} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing when only one id resolves against the resume", () => {
    const { container } = render(
      <TimelineFigure ids={["varicent_2021", "nope"]} now={NOW} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("builds bars from the real resume dates, not model text", () => {
    render(
      <TimelineFigure
        ids={["codebender_inc_2011", "varicent_2021", "myplanet_2020"]}
        now={NOW}
      />
    )

    expect(
      screen.getByRole("button", { name: /Varicent.*02\/2021 to 06\/2022/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Myplanet.*12\/2020 to 02\/2021/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Codebender.*01\/2011 to now/ })
    ).toBeInTheDocument()
  })

  it("shows a caption naming the roles' window", () => {
    render(
      <TimelineFigure
        ids={["codebender_inc_2011", "varicent_2021", "myplanet_2020"]}
        now={NOW}
      />
    )
    expect(screen.getByText(/^Roles \d{4} to (now|\d{4})$/)).toBeInTheDocument()
  })

  it("carries a muted part-time label beside a part-time row", () => {
    render(
      <TimelineFigure
        ids={["codebender_inc_2011", "varicent_2021", "myplanet_2020"]}
        now={NOW}
      />
    )
    expect(screen.getByText("part-time")).toBeInTheDocument()
  })

  // The real resume has no full-time (2+ month) overlap today — Varicent's
  // start date was corrected, turning its overlap with Myplanet into an
  // ordinary one-month handoff (see `employmentOverlaps.test.ts`). This
  // exercises the band-labeling math directly against synthetic data instead
  // of relying on the real resume happening to contain such a case.
  it("computeBands labels a full-time overlap longer than a month with its duration", () => {
    const idA = experienceId({
      company: "First Inc.",
      period: "01/2000 - 12/2000",
    })
    const idB = experienceId({
      company: "Second Ltd.",
      period: "01/2000 - 12/2000",
    })
    const rows: TimelineRow[] = [
      {
        id: idA,
        label: "First",
        company: "First Inc.",
        role: "Engineer",
        schedule: "full-time",
        bounds: { start: 0, end: 10 },
        isPresent: false,
      },
      {
        id: idB,
        label: "Second",
        company: "Second Ltd.",
        role: "Engineer",
        schedule: "full-time",
        bounds: { start: 5, end: 15 },
        isPresent: false,
      },
    ]
    const timeWindow: TimelineWindow = { start: 0, end: 15 }
    const bands = computeBands({
      rows,
      timeWindow,
      now: NOW,
      experience: [
        {
          role: "Engineer",
          company: "First Inc.",
          period: "01/2000 - 05/2000",
          schedule: "full-time",
          achievements: [],
        },
        {
          role: "Engineer",
          company: "Second Ltd.",
          period: "04/2000 - 09/2000",
          schedule: "full-time",
          achievements: [],
        },
      ],
    })

    expect(bands).toHaveLength(1)
    expect(bands[0].label).toBe("2 months")
  })

  it("shows a tooltip on focus and removes it on blur", () => {
    render(
      <TimelineFigure ids={["varicent_2021", "myplanet_2020"]} now={NOW} />
    )
    const bar = screen.getByRole("button", { name: /Varicent/ })
    fireEvent.focus(bar)
    expect(screen.getByRole("tooltip")).toHaveTextContent("Varicent")
    fireEvent.blur(bar)
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  it("activating a bar behaves like a source chip", () => {
    const onActivateRole = vi.fn()
    render(
      <TimelineFigure
        ids={["varicent_2021", "myplanet_2020"]}
        now={NOW}
        onActivateRole={onActivateRole}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /Varicent/ }))
    expect(onActivateRole).toHaveBeenCalledWith("varicent_2021")
  })

  it("swaps to a table on 'View as list' and back on 'View as chart'", () => {
    render(
      <TimelineFigure ids={["varicent_2021", "myplanet_2020"]} now={NOW} />
    )
    expect(screen.queryByRole("table")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "View as list" }))
    const table = screen.getByRole("table")
    expect(table).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "Company" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "Role" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "Dates" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "Schedule" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "Arrangement" })
    ).toBeInTheDocument()
    expect(screen.getByText("Varicent")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "View as chart" }))
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("drops unknown ids silently, keeping only resume roles", () => {
    render(
      <TimelineFigure
        ids={["varicent_2021", "myplanet_2020", "not_real"]}
        now={NOW}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "View as list" }))
    expect(screen.getAllByRole("row")).toHaveLength(3) // header + 2 known roles
  })
})
