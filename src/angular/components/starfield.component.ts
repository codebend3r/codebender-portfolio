import type { ElementRef } from "@angular/core"
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  viewChildren,
} from "@angular/core"

import { makeStars } from "@utils/particles"
import type { StarLayerConfig } from "@utils/particles"

const LAYERS: StarLayerConfig[] = [
  {
    count: 160,
    speed: 0.1,
    sizeRange: [1, 1.6],
    opacityRange: [0.25, 0.6],
    rangeY: 4000,
  },
  {
    count: 80,
    speed: 0.3,
    sizeRange: [1.4, 2.2],
    opacityRange: [0.4, 0.85],
    rangeY: 4000,
  },
  {
    count: 30,
    speed: 0.55,
    sizeRange: [2, 3],
    opacityRange: [0.7, 1],
    rangeY: 4000,
  },
]

@Component({
  selector: "app-starfield",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./starfield.component.css",
  template: `
    <div class="starfield" aria-hidden="true">
      @for (layer of layers; track $index) {
        <div class="layer" #layerEl>
          @for (star of layer.stars; track $index) {
            <span
              class="star"
              [style.left.%]="star.x"
              [style.top.px]="star.y"
              [style.width.px]="star.size"
              [style.height.px]="star.size"
              [style.opacity]="star.opacity"
            ></span>
          }
        </div>
      }
    </div>
  `,
})
export class StarfieldComponent {
  readonly layers = LAYERS.map((config) => ({
    config,
    stars: makeStars(config),
  }))

  private readonly layerEls =
    viewChildren<ElementRef<HTMLDivElement>>("layerEl")

  constructor() {
    const destroyRef = inject(DestroyRef)

    afterNextRender(() => {
      let raf = 0
      let pending = false

      const update = () => {
        const y = window.scrollY
        this.layerEls().forEach((layerEl, i) => {
          const speed = this.layers[i]?.config.speed ?? 0
          layerEl.nativeElement.style.transform = `translate3d(0, ${-y * speed}px, 0)`
        })
        pending = false
      }

      const onScroll = () => {
        if (pending) return
        pending = true
        raf = requestAnimationFrame(update)
      }

      update()
      window.addEventListener("scroll", onScroll, { passive: true })
      destroyRef.onDestroy(() => {
        window.removeEventListener("scroll", onScroll)
        cancelAnimationFrame(raf)
      })
    })
  }
}
