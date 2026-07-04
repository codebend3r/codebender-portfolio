export type Route = "generate" | "edit" | "app"

export function routeFor(pathname: string): Route {
  if (pathname === "/edit-resume") return "edit"
  if (pathname === "/generate") return "generate"
  return "app"
}
