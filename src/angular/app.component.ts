import { ChangeDetectionStrategy, Component } from "@angular/core"

@Component({
  selector: "app-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Angular version</p>`,
})
export class AppComponent {}
