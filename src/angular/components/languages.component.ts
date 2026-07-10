import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core"

import { SectionComponent } from "@ngapp/components/section.component"
import { ResumeDataService } from "@ngapp/services/resume-data.service"

@Component({
  selector: "app-languages",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionComponent],
  template: `
    <app-section title="Languages" [index]="index()" [eyebrow]="eyebrow()">
      <ul>
        @for (language of languages; track $index) {
          <li>
            <span>
              <strong>{{ language.name }}:</strong>
              {{ language.proficiency }}
            </span>
          </li>
        }
      </ul>
    </app-section>
  `,
})
export class LanguagesComponent {
  readonly index = input<number>()
  readonly eyebrow = input<string>()

  readonly languages = inject(ResumeDataService).data.languages
}
