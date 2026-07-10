import { ChangeDetectionStrategy, Component, inject } from "@angular/core"

import { HeaderComponent } from "@ngapp/components/header.component"
import { WeatherClockComponent } from "@ngapp/components/weather-clock.component"
import { ResumeDataService } from "@ngapp/services/resume-data.service"

import { documentFileName } from "@utils/documentFileName"

@Component({
  selector: "app-header-bar",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderComponent, WeatherClockComponent],
  styleUrl: "./app-header.component.css",
  template: `
    <header class="bar">
      <div class="inner">
        <div class="utility">
          <app-weather-clock />
          <a class="downloadButton" [href]="cvHref" download>
            <svg
              class="downloadIcon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 4v12" />
              <path d="m7 11 5 5 5-5" />
              <path d="M5 20h14" />
            </svg>
            Download CV
          </a>
        </div>
        <app-header />
      </div>
    </header>
  `,
})
export class AppHeaderComponent {
  private readonly data = inject(ResumeDataService).data

  // Matches the file the `generate:cv` build step writes into `public/cv/`.
  readonly cvHref = `/cv/${encodeURIComponent(
    documentFileName({
      name: this.data.name,
      label: this.data.title,
      extension: "pdf",
    })
  )}`
}
