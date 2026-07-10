import type { ElementRef } from "@angular/core"
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  viewChildren,
} from "@angular/core"

import cloudsSprite from "@assets/clouds.png"
import moonSprite from "@assets/moon.png"
import sunSprite from "@assets/sun.png"

import { StarfieldComponent } from "@ngapp/components/starfield.component"

import { getCurrentSky } from "@sky"
import type { Sky as SkyName } from "@sky"

import { makeClouds } from "@utils/particles"
import type { Cloud, CloudLayerConfig } from "@utils/particles"
import { spritePosition } from "@utils/spriteSheet"

type DaylightSky = Exclude<SkyName, "night">

type SpritePosition = { x: string; y: string }

type CloudView = Cloud & { pos: SpritePosition }

type CloudLayerView = {
  config: CloudLayerConfig
  clouds: CloudView[]
}

type DaylightView = {
  sunClass: string
  sunPos: SpritePosition
  layers: CloudLayerView[]
}

const SUN_CLASS: Record<DaylightSky, string> = {
  day: "sunDay",
  dawn: "sunDawn",
  dusk: "sunDusk",
}

const SUN_SPRITE_INDEX: Record<DaylightSky, number> = {
  day: 1,
  dawn: 8,
  dusk: 5,
}

const MOON_SPRITE_INDEX = 4

const CLOUD_LAYERS: Record<DaylightSky, CloudLayerConfig[]> = {
  day: [
    {
      speed: 0.06,
      count: 7,
      scaleRange: [0.55, 0.95],
      opacityRange: [0.4, 0.7],
      driftRange: [160, 240],
      driftAmount: 5,
    },
    {
      speed: 0.14,
      count: 5,
      scaleRange: [0.9, 1.5],
      opacityRange: [0.7, 1],
      driftRange: [110, 180],
      driftAmount: 7,
    },
  ],
  dawn: [
    {
      speed: 0.06,
      count: 5,
      scaleRange: [0.55, 0.95],
      opacityRange: [0.4, 0.7],
      driftRange: [160, 240],
      driftAmount: 5,
    },
    {
      speed: 0.14,
      count: 4,
      scaleRange: [0.9, 1.5],
      opacityRange: [0.7, 1],
      driftRange: [110, 180],
      driftAmount: 7,
    },
  ],
  dusk: [
    {
      speed: 0.06,
      count: 5,
      scaleRange: [0.55, 0.95],
      opacityRange: [0.4, 0.7],
      driftRange: [160, 240],
      driftAmount: 5,
    },
    {
      speed: 0.14,
      count: 4,
      scaleRange: [0.9, 1.5],
      opacityRange: [0.7, 1],
      driftRange: [110, 180],
      driftAmount: 7,
    },
  ],
}

function isDaylight(sky: SkyName): sky is DaylightSky {
  return sky !== "night"
}

function daylightView(kind: DaylightSky): DaylightView {
  return {
    sunClass: SUN_CLASS[kind],
    sunPos: spritePosition(SUN_SPRITE_INDEX[kind]),
    layers: CLOUD_LAYERS[kind].map((config) => ({
      config,
      clouds: makeClouds(config).map((cloud) => ({
        ...cloud,
        pos: spritePosition(cloud.shape),
      })),
    })),
  }
}

@Component({
  selector: "app-sky",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StarfieldComponent],
  styleUrl: "./sky.component.css",
  template: `
    <div class="skyStage" aria-hidden="true">
      @if (daylight === null) {
        <app-starfield />
        <div class="moon">
          <div
            class="moonSprite"
            [style.background-image]="'url(' + moonUrl + ')'"
            [style.background-position]="moonPos.x + ' ' + moonPos.y"
          ></div>
        </div>
      } @else {
        <div class="sun {{ daylight.sunClass }}">
          <div
            class="sunSprite"
            [style.background-image]="'url(' + sunUrl + ')'"
            [style.background-position]="
              daylight.sunPos.x + ' ' + daylight.sunPos.y
            "
          ></div>
        </div>
        <div class="clouds">
          @for (layer of daylight.layers; track $index) {
            <div class="cloudsLayer" #cloudLayerEl>
              @for (cloud of layer.clouds; track $index) {
                <div
                  class="cloud"
                  [style.left.%]="cloud.x"
                  [style.top.%]="cloud.y"
                  [style.width.px]="200 * cloud.scale"
                  [style.height.px]="200 * cloud.scale"
                  [style.opacity]="cloud.opacity"
                  [style.animation-duration.s]="cloud.driftDuration"
                  [style.animation-delay.s]="cloud.driftDelay"
                  #cloudEl
                >
                  <div
                    class="cloudSprite"
                    [style.background-image]="'url(' + cloudsUrl + ')'"
                    [style.background-position]="
                      cloud.pos.x + ' ' + cloud.pos.y
                    "
                    [style.transform]="cloud.flip ? 'scaleX(-1)' : null"
                  ></div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SkyComponent {
  readonly moonUrl = moonSprite
  readonly sunUrl = sunSprite
  readonly cloudsUrl = cloudsSprite
  readonly moonPos = spritePosition(MOON_SPRITE_INDEX)

  private readonly sky = getCurrentSky()
  readonly daylight: DaylightView | null = isDaylight(this.sky)
    ? daylightView(this.sky)
    : null

  private readonly cloudLayerEls =
    viewChildren<ElementRef<HTMLDivElement>>("cloudLayerEl")

  private readonly cloudEls =
    viewChildren<ElementRef<HTMLDivElement>>("cloudEl")

  constructor() {
    const destroyRef = inject(DestroyRef)

    afterNextRender(() => {
      if (this.daylight === null) return

      // `[style.--x]` bindings don't reach custom properties, so the drift
      // distance each cloud's keyframe animation consumes is set imperatively.
      const clouds = this.daylight.layers.flatMap((layer) => layer.clouds)
      this.cloudEls().forEach((cloudEl, i) => {
        const cloud = clouds[i]
        if (cloud) {
          cloudEl.nativeElement.style.setProperty(
            "--cloud-drift",
            `${cloud.driftAmount}vw`
          )
        }
      })

      let raf = 0
      let pending = false

      const update = () => {
        const y = window.scrollY
        this.cloudLayerEls().forEach((layerEl, i) => {
          const speed = this.daylight?.layers[i]?.config.speed ?? 0
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
