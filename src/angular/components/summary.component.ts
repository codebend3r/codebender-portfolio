import { ChangeDetectionStrategy, Component, inject } from "@angular/core"

import { SectionComponent } from "@ngapp/components/section.component"
import { ResumeDataService } from "@ngapp/services/resume-data.service"

@Component({
  selector: "app-summary",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionComponent],
  template: `
    <app-section title="Summary">
      <p>{{ summary }}</p>
    </app-section>
  `,
})
export class SummaryComponent {
  readonly summary = inject(ResumeDataService).data.summary
}
