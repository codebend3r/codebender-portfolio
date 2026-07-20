import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core"

import { SectionComponent } from "@ngapp/components/section.component"
import { ResumeDataService } from "@ngapp/services/resume-data.service"

@Component({
  selector: "app-soft-skills",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionComponent],
  styleUrl: "./soft-skills.component.css",
  template: `
    <app-section title="Soft Skills" [index]="index()" [eyebrow]="eyebrow()">
      <ul class="pillList">
        @for (skill of skills; track $index) {
          <li class="pill">{{ skill }}</li>
        }
      </ul>
    </app-section>
  `,
})
export class SoftSkillsComponent {
  readonly index = input<number>()
  readonly eyebrow = input<string>()

  readonly skills = inject(ResumeDataService).data.soft_skills
}
