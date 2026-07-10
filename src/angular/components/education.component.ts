import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core"

import { SectionComponent } from "@ngapp/components/section.component"
import { ResumeDataService } from "@ngapp/services/resume-data.service"

@Component({
  selector: "app-education",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionComponent],
  template: `
    <app-section title="Education" [index]="index()" [eyebrow]="eyebrow()">
      <ul>
        @for (entry of education; track $index) {
          <li>
            <span>
              <strong>{{ entry.program }}</strong> — {{ entry.institution
              }}{{ !!entry.details ? " — " + entry.details : "" }}
            </span>
          </li>
        }
      </ul>
    </app-section>
  `,
})
export class EducationComponent {
  readonly index = input<number>()
  readonly eyebrow = input<string>()

  readonly education = inject(ResumeDataService).data.education
}
