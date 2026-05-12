import { Awards } from "@components/Awards"
import { Education } from "@components/Education"
import { Footer } from "@components/Footer"
import { Header } from "@components/Header"
import { Languages } from "@components/Languages"
import { Sky } from "@components/Sky"
import { Summary } from "@components/Summary"
import { TechnicalSkills } from "@components/TechnicalSkills"
import { Weather } from "@components/Weather"
import { WorkExperience } from "@components/WorkExperience"

import "@styles/global.scss"

export default function App() {
  return (
    <>
      <Sky />
      <Weather />
      <div className="container">
        <Header />

        <main>
          <Summary />
          <TechnicalSkills />
          <WorkExperience />

          <div className="grid-2">
            <Awards />
            <Languages />
            <Education />
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
