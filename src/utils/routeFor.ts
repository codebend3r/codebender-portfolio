export type Route =
  | "generate-proximate"
  | "generate-exact"
  | "edit"
  | "login"
  | "angular-version"
  | "app"

export function routeFor(pathname: string): Route {
  if (pathname === "/edit-resume") return "edit"
  if (pathname === "/generate-proximate") return "generate-proximate"
  if (pathname === "/generate-exact") return "generate-exact"
  if (pathname === "/login") return "login"
  if (pathname === "/angular-version" || pathname === "/angular-version/") {
    return "angular-version"
  }
  return "app"
}
