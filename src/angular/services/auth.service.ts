import { Injectable, signal } from "@angular/core"
import type { Session } from "@supabase/supabase-js"

import { cloudConfigured, supabase } from "@state/supabase"

// Session awareness for the owner-only side menu. Sign-in itself lives on the
// React `/login` page; Supabase persists the session per-origin, so a session
// created there is visible here through `onAuthStateChange`.
@Injectable({ providedIn: "root" })
export class AuthService {
  readonly cloudConfigured = cloudConfigured

  private readonly sessionSignal = signal<Session | null>(null)
  // False until the persisted session (if any) has been restored.
  private readonly readySignal = signal(!cloudConfigured)

  readonly session = this.sessionSignal.asReadonly()
  readonly ready = this.readySignal.asReadonly()

  constructor() {
    if (!supabase) return
    supabase.auth.onAuthStateChange((_event, session) => {
      this.sessionSignal.set(session)
      this.readySignal.set(true)
    })
  }

  async signOut(): Promise<void> {
    if (!supabase) return
    await supabase.auth.signOut()
  }
}
