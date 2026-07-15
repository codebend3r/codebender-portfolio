export type Route = "generate-proximate" | "edit" | "login" | "app"

export function routeFor(pathname: string): Route {
  if (pathname === "/edit-resume") return "edit"
  if (pathname === "/generate-proximate") return "generate-proximate"
  if (pathname === "/login") return "login"
  return "app"
}
