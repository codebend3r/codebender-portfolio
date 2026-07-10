import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core"

import { AuthService } from "@ngapp/services/auth.service"

import { routeFor } from "@utils/routeFor"

const LINKS = [
  { href: "/", label: "Home", route: "app" },
  { href: "/edit-resume", label: "Edit Resume", route: "edit" },
  { href: "/generate", label: "Generate", route: "generate" },
] as const

// Owner navigation. Invisible to anonymous visitors; renders a fixed toggle
// plus a left drawer when a Supabase session (created on the React `/login`
// page, shared per-origin) is present.
@Component({
  selector: "app-side-menu",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./side-menu.component.css",
  host: { "(window:keydown.escape)": "onEscape()" },
  template: `
    @if (visible()) {
      <button
        type="button"
        class="toggle"
        [attr.aria-label]="open() ? 'Close menu' : 'Open menu'"
        [attr.aria-expanded]="open()"
        (click)="toggle()"
      >
        {{ open() ? "✕" : "☰" }}
      </button>
      @if (open()) {
        <div class="backdrop" aria-hidden="true"></div>
        <nav class="menu" aria-label="Site">
          <span class="heading">Menu</span>
          <ul class="links">
            @for (link of links; track link.href) {
              <li>
                <a
                  class="link"
                  [href]="link.href"
                  [attr.aria-current]="current === link.route ? 'page' : null"
                >
                  {{ link.label }}
                </a>
              </li>
            }
          </ul>
          <button type="button" class="signOut" (click)="signOut()">
            Sign out
          </button>
        </nav>
      }
    }
  `,
})
export class SideMenuComponent {
  private readonly auth = inject(AuthService)

  readonly links = LINKS
  readonly current = routeFor(window.location.pathname)
  readonly open = signal(false)

  readonly visible = computed(
    () => this.auth.cloudConfigured && this.auth.session() !== null
  )

  toggle() {
    this.open.update((open) => !open)
  }

  onEscape() {
    if (this.open()) this.open.set(false)
  }

  signOut() {
    void this.auth.signOut()
  }
}
