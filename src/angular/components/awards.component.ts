import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core"

import { SectionComponent } from "@ngapp/components/section.component"
import { ResumeDataService } from "@ngapp/services/resume-data.service"

@Component({
  selector: "app-awards",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionComponent],
  template: `
    <app-section title="Awards" [index]="index()" [eyebrow]="eyebrow()">
      <ul>
        @for (award of awards; track $index) {
          <li>
            <span>
              <strong>{{ award.name }}</strong> — {{ award.organization }} ({{
                award.year
              }})
            </span>
          </li>
        }
      </ul>
    </app-section>
  `,
})
export class AwardsComponent {
  readonly index = input<number>()
  readonly eyebrow = input<string>()

  readonly awards = inject(ResumeDataService).data.awards
}
