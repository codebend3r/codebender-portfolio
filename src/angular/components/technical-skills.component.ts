import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core"

import { SectionComponent } from "@ngapp/components/section.component"
import { ResumeDataService } from "@ngapp/services/resume-data.service"

const FALLBACK_DESCRIPTION =
  "A core technology used across modern frontend engineering."

// Keeps the hover tooltip inside the viewport by shifting it horizontally
// via the `--tooltip-shift` custom property the stylesheet consumes.
function clampTooltipToViewport(pill: HTMLElement) {
  const tooltip = pill.querySelector<HTMLElement>("[data-skill-tooltip]")
  if (!tooltip) return

  pill.style.setProperty("--tooltip-shift", "0px")
  const rect = tooltip.getBoundingClientRect()

  const margin = 8
  const overflowLeft = margin - rect.left
  const overflowRight = rect.right - (window.innerWidth - margin)

  const shift =
    overflowLeft > 0 ? overflowLeft : overflowRight > 0 ? -overflowRight : 0

  if (shift !== 0) pill.style.setProperty("--tooltip-shift", `${shift}px`)
}

@Component({
  selector: "app-technical-skills",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionComponent],
  styleUrl: "./technical-skills.component.css",
  template: `
    <app-section
      title="Technical Skills"
      [index]="index()"
      [eyebrow]="eyebrow()"
    >
      <ul class="pillList">
        @for (skill of skills; track $index) {
          <li
            class="pill"
            [attr.aria-label]="skill.name + ': ' + skill.description"
            (mouseenter)="clampTooltip($event)"
            (focus)="clampTooltip($event)"
          >
            {{ skill.name }}
            <span data-skill-tooltip role="tooltip" class="tooltip">
              {{ skill.description }}
            </span>
          </li>
        }
      </ul>
    </app-section>
  `,
})
export class TechnicalSkillsComponent {
  readonly index = input<number>()
  readonly eyebrow = input<string>()

  private readonly data = inject(ResumeDataService).data

  readonly skills = this.data.technical_skills.map((name, i) => ({
    name,
    description: this.data.skill_descriptions[i] || FALLBACK_DESCRIPTION,
  }))

  clampTooltip(event: Event) {
    const pill = event.currentTarget
    if (!(pill instanceof HTMLElement)) return
    clampTooltipToViewport(pill)
  }
}
