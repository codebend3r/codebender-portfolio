import type { Session } from "@supabase/supabase-js"
import { create } from "zustand"

import { supabase } from "@state/supabase"
import { useSync } from "@state/useSync"

type AuthState = {
  session: Session | null
  // False until the persisted session (if any) has been restored.
  ready: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>()((set) => ({
  session: null,
  ready: supabase === null,
  error: null,

  signIn: async (email, password) => {
    if (!supabase) return false
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    set({ error: error?.message ?? null })
    return !error
  },

  signOut: async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  },
}))

if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    useAuth.setState({ session, ready: true })
    if (session && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
      void useSync.getState().syncNow()
    }
  })
}
