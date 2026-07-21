import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  signal,
} from "@angular/core"

type NavItem = { id: string; label: string; num?: string }

// Mirrors the sections mounted in the Angular `AppComponent`; `num` matches
// each section's chip.
const ITEMS: NavItem[] = [
  { id: "summary", label: "Summary" },
  { id: "technical-skills", label: "Stack", num: "01" },
  { id: "soft-skills", label: "Soft Skills", num: "02" },
  { id: "work-experience", label: "Experience", num: "03" },
  { id: "selected-work", label: "Selected Work", num: "04" },
  { id: "awards", label: "Recognition", num: "05" },
  { id: "languages", label: "Languages", num: "06" },
  { id: "education", label: "Education", num: "07" },
]

@Component({
  selector: "app-section-nav",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./section-nav.component.css",
  template: `
    <nav class="nav" aria-label="Section navigation">
      <ul class="list">
        @for (item of items; track item.id) {
          <li>
            <a
              class="item"
              [href]="'#' + item.id"
              [attr.aria-label]="item.label"
              [attr.aria-current]="active() === item.id ? 'true' : null"
              (click)="onJump($event, item.id)"
            >
              <span class="label">{{ item.label }}</span>
              @if (item.num !== undefined) {
                <span class="num">{{ item.num }}</span>
              } @else {
                <span class="dot" aria-hidden="true"></span>
              }
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class SectionNavComponent {
  readonly items = ITEMS
  readonly active = signal(ITEMS[0]?.id ?? "")

  constructor() {
    const destroyRef = inject(DestroyRef)

    afterNextRender(() => {
      if (typeof IntersectionObserver === "undefined") return
      const observer = new IntersectionObserver(
        (entries) => {
          entries
            .filter((entry) => entry.isIntersecting)
            .forEach((entry) => this.active.set(entry.target.id))
        },
        { rootMargin: "-25% 0px -70% 0px", threshold: 0 }
      )
      this.items
        .map((item) => document.getElementById(item.id))
        .filter((element): element is HTMLElement => element !== null)
        .forEach((element) => observer.observe(element))
      destroyRef.onDestroy(() => observer.disconnect())
    })
  }

  onJump(event: Event, id: string) {
    event.preventDefault()
    const element = document.getElementById(id)
    if (!element) return
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    element.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    })
    this.active.set(id)
  }
}
