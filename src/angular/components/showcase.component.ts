import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core"

import { SectionComponent } from "@ngapp/components/section.component"
import { ResumeDataService } from "@ngapp/services/resume-data.service"

@Component({
  selector: "app-showcase",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionComponent],
  styleUrl: "./showcase.component.css",
  template: `
    <app-section title="Selected Work" [index]="index()" [eyebrow]="eyebrow()">
      <ul class="grid">
        @for (item of showcase; track item.url) {
          <li class="cardWrap">
            <a
              class="card"
              [href]="item.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="frame" aria-hidden="true">
                <span class="dots">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </span>
                <span class="domain">{{ item.domain }}</span>
              </span>
              <span class="shot">
                <img
                  [src]="item.image"
                  [alt]="item.name + ' website'"
                  loading="lazy"
                />
              </span>
              <span class="body">
                <span class="titleRow">
                  <h3 class="name">{{ item.name }}</h3>
                  <span class="period">{{ item.period }}</span>
                </span>
                <span class="role">{{ item.role }}</span>
                <span class="description">{{ item.description }}</span>
                <span class="tags">
                  @for (tag of item.tags; track tag) {
                    <span class="tag">{{ tag }}</span>
                  }
                </span>
              </span>
            </a>
            <span class="overlay" aria-hidden="true">
              <span
                class="overlayHalf siteHalf"
                [class.siteHalfSplit]="!!item.repo"
              >
                View site
              </span>
              @if (!!item.repo) {
                <span class="overlayHalf repoHalf"> View code </span>
              }
            </span>
            @if (!!item.repo) {
              <a
                class="repoHit"
                [href]="item.repo"
                target="_blank"
                rel="noopener noreferrer"
                [attr.aria-label]="item.name + ' source code on GitHub'"
              ></a>
            }
          </li>
        }
      </ul>
    </app-section>
  `,
})
export class ShowcaseComponent {
  readonly index = input<number>()
  readonly eyebrow = input<string>()

  readonly showcase = inject(ResumeDataService).data.showcase
}
