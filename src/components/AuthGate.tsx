import { type ReactNode, useEffect } from "react"

import { cloudConfigured } from "@state/supabase"
import { useAuth } from "@state/useAuth"

import { navigate } from "@utils/navigate"

// Wraps the private routes (/edit-resume, /generate): anonymous visitors
// are redirected to the homepage. Inert when the project is not configured,
// since no login mechanism exists (tests, forks without a project).
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth()
  const denied = cloudConfigured && ready && session === null

  useEffect(() => {
    if (denied) navigate("/")
  }, [denied])

  if (!cloudConfigured) return <>{children}</>
  if (!ready || !session) return null
  return <>{children}</>
}
