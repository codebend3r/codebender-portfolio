import { ChangeDetectionStrategy, Component, inject } from "@angular/core"

import { ResumeDataService } from "@ngapp/services/resume-data.service"

import { stripProtocol } from "@utils/contact"

@Component({
  selector: "app-footer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./footer.component.css",
  template: `
    <footer class="footer">
      <small class="stack">Built with Angular + Typescript + Vite</small>
      <small class="year">© {{ year }}. Codebender Inc.</small>
      <small class="credit">
        {{ name }}
        @if (github !== null) {
          {{ " · " }}
          <a [href]="github" target="_blank" rel="noopener noreferrer">
            {{ githubLabel }}
          </a>
        }
      </small>
    </footer>
  `,
})
export class FooterComponent {
  private readonly resume = inject(ResumeDataService)

  readonly name = this.resume.data.name
  readonly github =
    this.resume.data.contact.find((entry) => entry.value.includes("github.com"))
      ?.value ?? null
  readonly githubLabel = this.github !== null ? stripProtocol(this.github) : ""
  readonly year = new Date().getFullYear()
}
