export type Route =
  | "generate-proximate"
  | "generate-exact"
  | "edit"
  | "login"
  | "app"

export function routeFor(pathname: string): Route {
  if (pathname === "/edit-resume") return "edit"
  if (pathname === "/generate-proximate") return "generate-proximate"
  if (pathname === "/generate-exact") return "generate-exact"
  if (pathname === "/login") return "login"
  return "app"
}
