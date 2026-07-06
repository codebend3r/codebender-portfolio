import type { Session } from "@supabase/supabase-js"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { VariationsPanel } from "@edit/VariationsPanel"

import { useAuth } from "@state/useAuth"
import { useSync } from "@state/useSync"
import { useVariations } from "@state/useVariations"

// Cloud UI is driven by cloudConfigured; force it on for this suite.
vi.mock("@state/supabase", () => ({ cloudConfigured: true, supabase: null }))

const noop = () => {}

const variation = (over: Partial<Variation> & { id: string }): Variation => ({
  name: over.id,
  createdAt: 0,
  updatedAt: 0,
  data: {} as Data,
  ...over,
})

const renderPanel = () =>
  render(
    <VariationsPanel
      dirty={false}
      onSave={noop}
      onGenerate={noop}
      onNew={noop}
    />
  )

beforeEach(() => {
  localStorage.clear()
  useVariations.setState({ variations: [], activeId: null, pendingDeletes: [] })
  useAuth.setState({ session: null, ready: true, error: null })
  useSync.setState({ syncing: false, error: null, lastSyncedAt: null })
})

describe("VariationsPanel cloud sync", () => {
  it("flags variations without a syncedAt watermark as not synced", () => {
    useVariations.setState({
      variations: [variation({ id: "1", name: "Globe", updatedAt: 100 })],
    })
    renderPanel()
    expect(screen.getByRole("status")).toHaveAccessibleName("Globe: not synced")
  })

  it("flags variations synced at their latest edit as synced", () => {
    useVariations.setState({
      variations: [
        variation({ id: "1", name: "Globe", updatedAt: 100, syncedAt: 100 }),
      ],
    })
    renderPanel()
    expect(screen.getByRole("status")).toHaveAccessibleName("Globe: synced")
  })

  it("offers sign-in when signed out and opens the modal", () => {
    renderPanel()
    fireEvent.click(screen.getByRole("button", { name: /sign in to sync/i }))
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
  })

  it("shows the pending count on the sync button when signed in", () => {
    useAuth.setState({ session: {} as Session })
    useVariations.setState({
      variations: [
        variation({ id: "1", updatedAt: 100 }),
        variation({ id: "2", updatedAt: 100, syncedAt: 100 }),
      ],
      pendingDeletes: ["3"],
    })
    renderPanel()
    expect(screen.getByRole("button", { name: "Sync (2)" })).toBeInTheDocument()
  })

  it("shows a check on the sync button when everything is synced", () => {
    useAuth.setState({ session: {} as Session })
    useVariations.setState({
      variations: [variation({ id: "1", updatedAt: 100, syncedAt: 100 })],
    })
    renderPanel()
    expect(screen.getByRole("button", { name: "Sync ✓" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument()
  })

  it("surfaces sync errors", () => {
    useAuth.setState({ session: {} as Session })
    useSync.setState({ error: "boom" })
    renderPanel()
    expect(screen.getByRole("alert")).toHaveTextContent("boom")
  })
})
