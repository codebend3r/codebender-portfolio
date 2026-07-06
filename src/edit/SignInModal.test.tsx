import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SignInModal } from "@edit/SignInModal"

import { useAuth } from "@state/useAuth"

beforeEach(() => {
  useAuth.setState({ session: null, ready: true, error: null })
})

describe("SignInModal", () => {
  it("renders nothing when closed", () => {
    render(<SignInModal open={false} onClose={() => {}} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("renders email and password fields when open", () => {
    render(<SignInModal open onClose={() => {}} />)
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
  })

  it("submits trimmed credentials and closes on success", async () => {
    const signIn = vi.fn(async () => true)
    useAuth.setState({ signIn })
    const onClose = vi.fn()

    render(<SignInModal open onClose={onClose} />)
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "  cj@example.com  " },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "hunter2" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in$/i }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(signIn).toHaveBeenCalledWith("cj@example.com", "hunter2")
  })

  it("stays open and shows the error on failure", async () => {
    const signIn = vi.fn(async () => {
      useAuth.setState({ error: "Invalid login credentials" })
      return false
    })
    useAuth.setState({ signIn })
    const onClose = vi.fn()

    render(<SignInModal open onClose={onClose} />)
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "cj@example.com" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    })
    fireEvent.click(screen.getByRole("button", { name: /sign in$/i }))

    expect(
      await screen.findByText("Invalid login credentials")
    ).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("disables submit until both fields are filled", () => {
    render(<SignInModal open onClose={() => {}} />)
    expect(screen.getByRole("button", { name: /sign in$/i })).toBeDisabled()
  })
})
