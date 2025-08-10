import { Awards } from "@components/Awards"
import { Education } from "@components/Education"
import { Footer } from "@components/Footer"
import { Header } from "@components/Header"
import { Languages } from "@components/Languages"
import { Summary } from "@components/Summary"
import { TechnicalSkills } from "@components/TechnicalSkills"
import { WorkExperience } from "@components/WorkExperience"

import "@styles/global.scss"

import data from "./data.json"
import type { Data } from "./types"

const d = data as Data

export default function App() {
  return (
    <div className="container">
      <Header d={d} />

      <main>
        <Summary d={d} />
        <TechnicalSkills d={d} />
        <WorkExperience d={d} />

        <div className="grid-2">
          <Awards d={d} />
          <Languages d={d} />
          <Education d={d} />
        </div>
      </main>

      <Footer d={d} />
    </div>
  )
}
