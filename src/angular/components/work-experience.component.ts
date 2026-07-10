import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core"

import { SectionComponent } from "@ngapp/components/section.component"
import { ResumeDataService } from "@ngapp/services/resume-data.service"

import { experienceDuration } from "@utils/experienceDuration"

@Component({
  selector: "app-work-experience",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionComponent],
  styleUrl: "./work-experience.component.css",
  template: `
    <app-section
      title="Work Experience"
      [index]="index()"
      [eyebrow]="eyebrow()"
    >
      <ul class="timeline">
        @for (experience of experiences; track $index) {
          <li>
            <div class="item">
              <div class="header">
                <div>
                  <h3>{{ experience.role }}</h3>
                  <p class="muted">{{ experience.company }}</p>
                </div>
                <span class="period">
                  {{ experience.period }}
                  @if (experience.duration !== null) {
                    <span class="duration">{{ experience.duration }}</span>
                  }
                </span>
              </div>
              <ul class="bullets">
                @for (achievement of experience.achievements; track $index) {
                  <li>{{ achievement }}</li>
                }
              </ul>
            </div>
          </li>
        }
      </ul>
    </app-section>
  `,
})
export class WorkExperienceComponent {
  readonly index = input<number>()
  readonly eyebrow = input<string>()

  readonly experiences = inject(ResumeDataService).data.work_experience.map(
    (experience) => ({
      ...experience,
      duration: experienceDuration(experience.period),
    })
  )
}
