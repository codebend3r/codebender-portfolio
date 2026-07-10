import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core"

@Component({
  selector: "app-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./section.component.css",
  template: `
    <section [id]="id()" class="section">
      @if (hasChip()) {
        <span class="chip">
          <span class="chipDot" aria-hidden="true"></span>
          {{ chipLabel() }}
        </span>
      }
      <h2 class="srTitle">{{ title() }}</h2>
      <ng-content />
    </section>
  `,
})
export class SectionComponent {
  readonly title = input.required<string>()
  readonly index = input<number>()
  readonly eyebrow = input<string>()

  readonly id = computed(() => this.title().toLowerCase().replace(/\s+/g, "-"))

  readonly hasChip = computed(
    () => this.index() !== undefined && this.eyebrow() !== undefined
  )

  readonly chipLabel = computed(
    () => `${String(this.index()).padStart(2, "0")} · ${this.eyebrow()}`
  )
}
