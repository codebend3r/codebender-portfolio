import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuthService } from "@ngapp/services/auth.service"

type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void

const mock = vi.hoisted(() => {
  const state: {
    cloudConfigured: boolean
    callback: AuthCallback | null
    signOut: ReturnType<typeof vi.fn>
  } = {
    cloudConfigured: false,
    callback: null,
    signOut: vi.fn(async () => ({ error: null })),
  }
  return state
})

vi.mock("@state/supabase", () => ({
  get cloudConfigured() {
    return mock.cloudConfigured
  },
  get supabase() {
    if (!mock.cloudConfigured) return null
    return {
      auth: {
        onAuthStateChange: (callback: AuthCallback) => {
          mock.callback = callback
          return { data: { subscription: { unsubscribe: vi.fn() } } }
        },
        signOut: mock.signOut,
      },
    }
  },
}))

beforeEach(() => {
  mock.callback = null
  mock.signOut.mockClear()
})

describe("AuthService", () => {
  it("is ready with no session when cloud is not configured", () => {
    mock.cloudConfigured = false
    const service = new AuthService()

    expect(service.cloudConfigured).toBe(false)
    expect(service.ready()).toBe(true)
    expect(service.session()).toBeNull()
  })

  it("tracks the session through onAuthStateChange", () => {
    mock.cloudConfigured = true
    const service = new AuthService()

    expect(service.ready()).toBe(false)
    expect(mock.callback).not.toBeNull()

    const session = {} as Session
    mock.callback?.("SIGNED_IN", session)

    expect(service.ready()).toBe(true)
    expect(service.session()).toBe(session)

    mock.callback?.("SIGNED_OUT", null)
    expect(service.session()).toBeNull()
  })

  it("delegates signOut to the supabase client", async () => {
    mock.cloudConfigured = true
    const service = new AuthService()

    await service.signOut()

    expect(mock.signOut).toHaveBeenCalledOnce()
  })
})
