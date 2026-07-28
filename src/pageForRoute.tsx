import type { ReactElement } from "react"

import { AuthGate } from "@components/AuthGate"
import { LoginPage } from "@components/LoginPage"

import EditResumeApp from "@edit/EditResumeApp"

import GenerateApp from "@generate/GenerateApp"

import type { Route } from "@utils/routeFor"

import App from "@App"

// One page per route; private pages wrap themselves in AuthGate. Record
// keys keep this exhaustive — adding a Route without a page is a type error.
const PAGES: Record<Route, () => ReactElement> = {
  edit: () => (
    <AuthGate>
      <EditResumeApp />
    </AuthGate>
  ),
  "generate-proximate": () => (
    <AuthGate>
      <GenerateApp mode="proximate" />
    </AuthGate>
  ),
  "generate-exact": () => (
    <AuthGate>
      <GenerateApp mode="exact" />
    </AuthGate>
  ),
  login: () => <LoginPage />,
  // `/angular-version/` is a separate MPA entry served by its own
  // `index.html`; this fallback only renders if the React shell loads there.
  "angular-version": () => <App />,
  app: () => <App />,
}

export function pageForRoute(route: Route): ReactElement {
  return PAGES[route]()
}
