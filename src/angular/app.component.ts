import { ChangeDetectionStrategy, Component } from "@angular/core"

import { AppHeaderComponent } from "@ngapp/components/app-header.component"
import { AwardsComponent } from "@ngapp/components/awards.component"
import { EducationComponent } from "@ngapp/components/education.component"
import { FooterComponent } from "@ngapp/components/footer.component"
import { LanguagesComponent } from "@ngapp/components/languages.component"
import { SectionNavComponent } from "@ngapp/components/section-nav.component"
import { ShowcaseComponent } from "@ngapp/components/showcase.component"
import { SideMenuComponent } from "@ngapp/components/side-menu.component"
import { SkyComponent } from "@ngapp/components/sky.component"
import { SoftSkillsComponent } from "@ngapp/components/soft-skills.component"
import { SummaryComponent } from "@ngapp/components/summary.component"
import { TechnicalSkillsComponent } from "@ngapp/components/technical-skills.component"
import { WeatherComponent } from "@ngapp/components/weather.component"
import { WorkExperienceComponent } from "@ngapp/components/work-experience.component"

@Component({
  selector: "app-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppHeaderComponent,
    AwardsComponent,
    EducationComponent,
    FooterComponent,
    LanguagesComponent,
    SectionNavComponent,
    ShowcaseComponent,
    SideMenuComponent,
    SkyComponent,
    SoftSkillsComponent,
    SummaryComponent,
    TechnicalSkillsComponent,
    WeatherComponent,
    WorkExperienceComponent,
  ],
  styleUrl: "./app.component.css",
  template: `
    <app-sky />
    <app-weather />
    <app-section-nav />
    <app-side-menu />
    <div id="resume-root" class="resumeRoot">
      <app-header-bar />

      <div class="container">
        <main class="main">
          <app-summary />
          <app-technical-skills [index]="1" eyebrow="Stack" />
          <app-soft-skills [index]="2" eyebrow="Soft Skills" />
          <app-work-experience [index]="3" eyebrow="Experience" />
          <app-showcase [index]="4" eyebrow="Selected Work" />

          <div class="subgrid">
            <app-awards [index]="5" eyebrow="Recognition" />
            <app-languages [index]="6" eyebrow="Languages" />
            <app-education [index]="7" eyebrow="Education" />
          </div>
        </main>

        <app-footer />
      </div>
    </div>
  `,
})
export class AppComponent {}
