import type { ReactElement } from "react"

import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { Awards } from "@components/Awards"
import { Education } from "@components/Education"
import { Languages } from "@components/Languages"
import { Showcase } from "@components/Showcase"
import { SoftSkills } from "@components/SoftSkills"
import {
  TechnicalSkills,
  addSkill,
  removeSkill,
  reorderSkills,
} from "@components/TechnicalSkills"
import { WorkExperience } from "@components/WorkExperience"

import resume from "@data/resume.json"

import { EditProvider } from "@edit/EditContext"

import { useStore } from "@state/useStore"

function editRender(ui: ReactElement) {
  return render(
    <EditProvider editing markDirty={() => {}}>
      {ui}
    </EditProvider>
  )
}

const totalAchievements = resume.work_experience.reduce(
  (n, w) => n + w.achievements.length,
  0
)
const totalTags = resume.showcase.reduce((n, s) => n + s.tags.length, 0)

const sections: {
  name: string
  el: ReactElement
  pattern: RegExp
  count: number
}[] = [
  {
    name: "award",
    el: <Awards />,
    pattern: /drag to reorder award/i,
    count: resume.awards.length,
  },
  {
    name: "language",
    el: <Languages />,
    pattern: /drag to reorder language/i,
    count: resume.languages.length,
  },
  {
    name: "education entry",
    el: <Education />,
    pattern: /drag to reorder education/i,
    count: resume.education.length,
  },
  {
    name: "skill pill",
    el: <TechnicalSkills />,
    pattern: /drag to reorder skill/i,
    count: resume.technical_skills.length,
  },
  {
    name: "soft skill pill",
    el: <SoftSkills />,
    pattern: /drag to reorder soft skill/i,
    count: resume.soft_skills.length,
  },
  {
    name: "experience",
    el: <WorkExperience />,
    pattern: /drag to reorder experience/i,
    count: resume.work_experience.length,
  },
  {
    name: "achievement",
    el: <WorkExperience />,
    pattern: /drag to reorder achievement/i,
    count: totalAchievements,
  },
  {
    name: "showcase card",
    el: <Showcase />,
    pattern: /drag to reorder showcase \d+$/i,
    count: resume.showcase.length,
  },
  {
    name: "showcase tag",
    el: <Showcase />,
    pattern: /drag to reorder showcase \d+ tag \d+/i,
    count: totalTags,
  },
]

describe("section drag handles", () => {
  beforeEach(() => {
    useStore.getState().loadData(structuredClone(resume) as Data)
  })

  it("renders no drag affordances on the public page", () => {
    render(
      <>
        <Awards />
        <Languages />
        <Education />
        <TechnicalSkills />
        <SoftSkills />
        <WorkExperience />
        <Showcase />
      </>
    )
    expect(
      screen.queryByRole("button", { name: /drag to reorder/i })
    ).not.toBeInTheDocument()
    expect(
      document.querySelector('[aria-roledescription="sortable"]')
    ).toBeNull()
  })

  for (const section of sections) {
    it(`renders a drag handle per ${section.name} in edit mode`, async () => {
      editRender(section.el)
      const handles = await screen.findAllByRole("button", {
        name: section.pattern,
      })
      expect(handles).toHaveLength(section.count)
    })
  }
})

describe("skill and tag editing", () => {
  beforeEach(() => {
    useStore.getState().loadData(structuredClone(resume) as Data)
  })

  it("addSkill appends a skill and a blank description", () => {
    addSkill()
    const state = useStore.getState()
    expect(state.technical_skills).toHaveLength(
      resume.technical_skills.length + 1
    )
    expect(state.skill_descriptions).toHaveLength(
      resume.skill_descriptions.length + 1
    )
    expect(state.technical_skills[state.technical_skills.length - 1]).toBe(
      "New skill"
    )
    expect(state.skill_descriptions[state.skill_descriptions.length - 1]).toBe(
      ""
    )
  })

  it("removeSkill drops the skill and its description together", () => {
    removeSkill(0)
    const state = useStore.getState()
    expect(state.technical_skills[0]).toBe(resume.technical_skills[1])
    expect(state.skill_descriptions[0]).toBe(resume.skill_descriptions[1])
  })

  it("adds and removes skills from the pill list", () => {
    editRender(<TechnicalSkills />)
    fireEvent.click(screen.getByRole("button", { name: /add skill/i }))
    const added = useStore.getState().technical_skills
    expect(added[added.length - 1]).toBe("New skill")
    fireEvent.click(screen.getAllByRole("button", { name: /remove skill/i })[0])
    expect(useStore.getState().technical_skills).toHaveLength(
      resume.technical_skills.length
    )
  })

  it("adds and removes tags on a showcase card", () => {
    editRender(<Showcase />)
    const before = useStore.getState().showcase[0].tags.length
    fireEvent.click(
      screen.getByRole("button", { name: /^add tag to showcase 1$/i })
    )
    expect(useStore.getState().showcase[0].tags.length).toBe(before + 1)
    fireEvent.click(
      screen.getByRole("button", { name: /^remove tag 1 from showcase 1$/i })
    )
    expect(useStore.getState().showcase[0].tags.length).toBe(before)
  })
})

describe("reorderSkills", () => {
  beforeEach(() => {
    useStore.getState().loadData(structuredClone(resume) as Data)
  })

  it("moves the skill and its description together", () => {
    const skill = resume.technical_skills[0]
    const description = resume.skill_descriptions[0]
    reorderSkills(0, 2)
    const state = useStore.getState()
    expect(state.technical_skills[2]).toBe(skill)
    expect(state.skill_descriptions[2]).toBe(description)
  })

  it("pads missing descriptions before reordering", () => {
    const store = useStore.getState()
    store.setPath(["skill_descriptions"], resume.skill_descriptions.slice(0, 1))
    reorderSkills(0, 2)
    const state = useStore.getState()
    expect(state.skill_descriptions).toHaveLength(
      resume.technical_skills.length
    )
    expect(state.skill_descriptions[2]).toBe(resume.skill_descriptions[0])
  })
})
