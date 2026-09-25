import { ChangeDetectionStrategy, Component } from "@angular/core"

import { HeaderComponent } from "@ngapp/components/header.component"
import { WeatherClockComponent } from "@ngapp/components/weather-clock.component"

@Component({
  selector: "app-header-bar",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderComponent, WeatherClockComponent],
  styleUrl: "./app-header.component.css",
  template: `
    <header class="bar">
      <div class="inner">
        <div class="utility">
          <app-weather-clock />
        </div>
        <app-header />
      </div>
    </header>
  `,
})
export class AppHeaderComponent {}
