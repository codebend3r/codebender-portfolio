import type { ReactElement } from "react"

import { AuthGate } from "@components/AuthGate"
import { LoginPage } from "@components/LoginPage"

import EditResumeApp from "@edit/EditResumeApp"

import GenerateApp from "@generate/GenerateApp"

import type { Route, RouteMatch } from "@utils/routeFor"

import App from "@App"

// One page per route; private pages wrap themselves in AuthGate. Record
// keys keep this exhaustive — adding a Route without a page is a type error.
const PAGES: Record<Route, (match: RouteMatch) => ReactElement> = {
  edit: (match) => (
    <AuthGate>
      <EditResumeApp variationId={match.variationId} />
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
  app: () => <App />,
}

export function pageForRoute(match: RouteMatch): ReactElement {
  return PAGES[match.route](match)
}
