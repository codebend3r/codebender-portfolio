import { ChangeDetectionStrategy, Component, inject } from "@angular/core"

import logoUrl from "@assets/robot-logo.png"

import { ResumeDataService } from "@ngapp/services/resume-data.service"

import { contactHref, isEmail, isPhone, isUrl } from "@utils/contact"

type ContactIcon = "github" | "linkedin" | "link" | "email" | "phone"

type ContactView = {
  href: string | null
  text: string
  external: boolean
  icon: ContactIcon | null
}

function iconFor(value: string): ContactIcon | null {
  if (value.includes("github.com")) return "github"
  if (value.includes("linkedin.com")) return "linkedin"
  if (isUrl(value)) return "link"
  if (isEmail(value)) return "email"
  if (isPhone(value)) return "phone"
  return null
}

function toContactView(entry: ContactEntry): ContactView {
  const href = contactHref(entry.value)
  const external = isUrl(entry.value)
  return {
    href,
    // Links read by their label; email and phone read by their value.
    text: !href || !external ? entry.value : entry.label,
    external,
    icon: iconFor(entry.value),
  }
}

@Component({
  selector: "app-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./header.component.css",
  template: `
    <header class="header">
      <div class="brand">
        <img [src]="logoUrl" alt="Logo" class="logo" />
        <div>
          <h1>{{ name }}</h1>
          <p class="subtitle">{{ title }}</p>
        </div>
      </div>
      <div class="contact">
        @for (entry of entries; track $index) {
          @if (!$first) {
            <span class="sep">•</span>
          }
          @if (entry.href === null) {
            <span class="location">{{ entry.text }}</span>
          } @else {
            <a
              [href]="entry.href"
              [attr.target]="entry.external ? '_blank' : null"
              [attr.rel]="entry.external ? 'noopener noreferrer' : null"
            >
              @switch (entry.icon) {
                @case ("email") {
                  <svg
                    class="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m2 7 10 6 10-6" />
                  </svg>
                }
                @case ("phone") {
                  <svg
                    class="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                    />
                  </svg>
                }
                @case ("github") {
                  <svg
                    class="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
                    />
                  </svg>
                }
                @case ("linkedin") {
                  <svg
                    class="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
                    />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                }
                @case ("link") {
                  <svg
                    class="icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                    />
                    <path
                      d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                    />
                  </svg>
                }
              }
              <span class="label">{{ entry.text }}</span>
            </a>
          }
        }
      </div>
    </header>
  `,
})
export class HeaderComponent {
  private readonly resume = inject(ResumeDataService)

  readonly logoUrl = logoUrl
  readonly name = this.resume.data.name
  readonly title = this.resume.data.title
  readonly entries = this.resume.data.contact.map(toContactView)
}
