export type Route = "generate" | "edit" | "login" | "app"

export function routeFor(pathname: string): Route {
  if (pathname === "/edit-resume") return "edit"
  if (pathname === "/generate") return "generate"
  if (pathname === "/login") return "login"
  return "app"
}
