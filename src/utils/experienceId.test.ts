import { describe, expect, it } from "vitest"

import baseResume from "@data/resume.json"

import { experienceId } from "@utils/experienceId"

describe("experienceId", () => {
  it("generates stable ids from company name and period", () => {
    expect(
      experienceId({ company: "Codebender Inc.", period: "01/2011 - Present" })
    ).toBe("codebender_inc_2011")
    expect(
      experienceId({
        company: "The Globe and Mail",
        period: "09/2024 - 05/2026",
      })
    ).toBe("the_globe_and_mail_2024")
  })

  it("generates correct ids for all real resume entries", () => {
    // Map entries by both company and period to handle duplicates
    const expectedIds = [
      {
        company: "Codebender Inc.",
        period: "01/2011 - Present",
        id: "codebender_inc_2011",
      },
      {
        company: "The Globe and Mail",
        period: "09/2024 - 05/2026",
        id: "the_globe_and_mail_2024",
      },
      {
        company: "iPolitics",
        period: "11/2023 - 07/2026",
        id: "ipolitics_2023",
      },
      {
        company: "XP Ventures Labs",
        period: "01/2024 - 09/2024",
        id: "xp_ventures_labs_2024",
      },
      { company: "Radian", period: "06/2022 - 11/2023", id: "radian_2022" },
      { company: "Varicent", period: "02/2021 - 06/2022", id: "varicent_2021" },
      { company: "Myplanet", period: "12/2020 - 02/2021", id: "myplanet_2020" },
      {
        company: "RBC Capital Markets",
        period: "08/2020 - 12/2020",
        id: "rbc_capital_markets_2020",
      },
      {
        company: "RBC Ventures",
        period: "08/2019 - 08/2020",
        id: "rbc_ventures_2019",
      },
      {
        company: "Toronto Star",
        period: "12/2018 - 08/2019",
        id: "toronto_star_2018",
      },
      {
        company: "The Globe and Mail",
        period: "05/2016 - 04/2018",
        id: "the_globe_and_mail_2016",
      },
      { company: "theScore", period: "01/2016 - 05/2016", id: "thescore_2016" },
      { company: "Rogers", period: "11/2014 - 01/2016", id: "rogers_2014" },
      {
        company: "Uptime Software",
        period: "04/2014 - 11/2014",
        id: "uptime_software_2014",
      },
      {
        company: "Kobo Inc.",
        period: "02/2012 - 03/2014",
        id: "kobo_inc_2012",
      },
      {
        company: "Research Now",
        period: "07/2008 - 09/2011",
        id: "research_now_2008",
      },
    ]

    for (const entry of baseResume.work_experience) {
      const id = experienceId({ company: entry.company, period: entry.period })
      const expected = expectedIds.find(
        (e) => e.company === entry.company && e.period === entry.period
      )
      expect(id).toBe(expected?.id)
    }
  })

  it("generates unique ids for entries with the same company but different years", () => {
    const globeIds = baseResume.work_experience
      .filter((e) => e.company === "The Globe and Mail")
      .map((e) => experienceId({ company: e.company, period: e.period }))

    // Should have two entries with different ids
    expect(globeIds.length).toBeGreaterThan(1)
    expect(new Set(globeIds).size).toBe(globeIds.length)
  })

  it("ensures all ids across the resume are unique", () => {
    const ids = baseResume.work_experience.map((e) =>
      experienceId({ company: e.company, period: e.period })
    )
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})
