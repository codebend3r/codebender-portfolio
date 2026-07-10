import { provideZonelessChangeDetection } from "@angular/core"
import { bootstrapApplication } from "@angular/platform-browser"

import { AppComponent } from "@ngapp/app.component"

import "@styles/global.css"
import "@styles/keyframes.css"
import "@styles/tokens.css"

void bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
})
