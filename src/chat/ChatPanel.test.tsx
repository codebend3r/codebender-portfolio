import { useRef } from "react"

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import ChatPanel from "./ChatPanel"
import type {
  ChatAssistantMessage,
  ChatUserMessage,
  UseChatResult,
} from "./useChat"

function baseChat(overrides: Partial<UseChatResult> = {}): UseChatResult {
  return {
    status: "idle",
    messages: [],
    errorMessage: null,
    errorKind: null,
    send: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    retry: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn(),
    ...overrides,
  }
}

let chatState: UseChatResult = baseChat()

vi.mock("./useChat", () => ({
  useChat: () => chatState,
}))

function userMessage(
  text: string,
  status: ChatUserMessage["status"] = "sent"
): ChatUserMessage {
  return { id: `user-${text}`, role: "user", text, status }
}

function assistantMessage(
  overrides: Partial<ChatAssistantMessage> = {}
): ChatAssistantMessage {
  return {
    id: overrides.id ?? "assistant-1",
    role: "assistant",
    text: "",
    status: "done",
    ...overrides,
  }
}

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>()
  const mql = {
    matches,
    media: "",
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener)
    },
  }
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mql)
  )
  return mql
}

function Harness({
  open = true,
  onClose = () => {},
}: {
  open?: boolean
  onClose?: () => void
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={triggerRef}>trigger</button>
      <ChatPanel
        id="chat-panel"
        open={open}
        onClose={onClose}
        returnFocusRef={triggerRef}
      />
    </>
  )
}

describe("ChatPanel", () => {
  beforeEach(() => {
    chatState = baseChat()
    mockMatchMedia(true) // desktop: matches the 48rem query, non-modal
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("renders the header title and subtitle", () => {
    render(<Harness />)
    expect(
      screen.getByRole("heading", { name: "Ask about CJ" })
    ).toBeInTheDocument()
    expect(
      screen.getByText("AI assistant, answers from CJ’s resume")
    ).toBeInTheDocument()
  })

  it("focuses the textarea on open", async () => {
    render(<Harness />)
    await waitFor(() =>
      expect(screen.getByLabelText("Your question")).toHaveFocus()
    )
  })

  it("disables 'Start a new conversation' when the log is empty", () => {
    render(<Harness />)
    expect(
      screen.getByRole("button", { name: "Start a new conversation" })
    ).toBeDisabled()
  })

  it("enables 'Start a new conversation' once there are messages, and it resets", async () => {
    chatState = baseChat({ messages: [userMessage("hi")] })
    const user = userEvent.setup()
    render(<Harness />)
    const button = screen.getByRole("button", {
      name: "Start a new conversation",
    })
    expect(button).toBeEnabled()
    await user.click(button)
    expect(chatState.reset).toHaveBeenCalledOnce()
  })

  it("sends a starter prompt when clicked", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(
      screen.getByRole("button", { name: "Why do some roles overlap?" })
    )
    expect(chatState.send).toHaveBeenCalledWith({
      text: "Why do some roles overlap?",
    })
  })

  it("marks a streaming assistant message aria-busy, and a done one not busy", () => {
    chatState = baseChat({
      status: "streaming",
      messages: [
        userMessage("hi"),
        assistantMessage({ id: "a1", text: "partial", status: "streaming" }),
      ],
    })
    render(<Harness />)
    const busyRow = screen.getByText("partial").closest("[aria-busy]")
    expect(busyRow).toHaveAttribute("aria-busy", "true")
  })

  it("shows the stopped/truncated suffixes", () => {
    chatState = baseChat({
      messages: [
        userMessage("hi"),
        assistantMessage({ id: "a1", text: "cut off", status: "stopped" }),
      ],
    })
    const { rerender } = render(<Harness />)
    expect(screen.getByText("(stopped)")).toBeInTheDocument()

    chatState = baseChat({
      messages: [
        userMessage("hi"),
        assistantMessage({ id: "a1", text: "cut off", status: "truncated" }),
      ],
    })
    rerender(<Harness />)
    expect(screen.getByText("(answer truncated)")).toBeInTheDocument()
  })

  it("shows a 'Not sent. Retry' button for a failed user message", async () => {
    chatState = baseChat({ messages: [userMessage("hi", "failed")] })
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole("button", { name: "Not sent. Retry" }))
    expect(chatState.retry).toHaveBeenCalledOnce()
  })

  it("toggles the send button to Stop while streaming, and Stop calls stop()", async () => {
    chatState = baseChat({ status: "streaming", messages: [userMessage("hi")] })
    const user = userEvent.setup()
    render(<Harness />)
    const stopButton = screen.getByRole("button", { name: "Stop" })
    await user.click(stopButton)
    expect(chatState.stop).toHaveBeenCalledOnce()
  })

  it("sends on Enter and inserts a newline on Shift+Enter", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const textarea = screen.getByLabelText("Your question")
    await user.type(textarea, "hello")
    fireEvent.keyDown(textarea, { key: "Enter" })
    expect(chatState.send).toHaveBeenCalledWith({ text: "hello" })

    await user.type(textarea, "line one{Shift>}{Enter}{/Shift}line two")
    expect(chatState.send).toHaveBeenCalledTimes(1)
  })

  it("shows a char counter past 800 characters and a too-long notice past 1000", async () => {
    render(<Harness />)
    const textarea = screen.getByLabelText("Your question")
    fireEvent.change(textarea, { target: { value: "a".repeat(801) } })
    expect(screen.getByText("801 / 1,000")).toBeInTheDocument()
    expect(
      screen.queryByText("Questions can be up to 1,000 characters.")
    ).not.toBeInTheDocument()

    fireEvent.change(textarea, { target: { value: "a".repeat(1001) } })
    expect(
      screen.getByText("Questions can be up to 1,000 characters.")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
  })

  it("shows the conversation-full alert at the turn limit and disables the composer", () => {
    chatState = baseChat({
      messages: Array.from({ length: 20 }, (_, index) =>
        index % 2 === 0
          ? userMessage(`q${index}`)
          : assistantMessage({ id: `a${index}` })
      ),
    })
    render(<Harness />)
    expect(
      screen.getByText("This conversation is at its limit.")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Your question")).toBeDisabled()
  })

  it.each([
    ["limit" as const, "You've reached today's limit of 30 questions."],
    ["resting" as const, "The assistant is off for today."],
    ["offline" as const, "You're offline."],
    ["generic" as const, "That answer didn't come through."],
  ])("shows the right alert copy for %s", (kind, expectedBold) => {
    chatState = baseChat({ errorMessage: "irrelevant prose", errorKind: kind })
    render(<Harness />)
    expect(screen.getByRole("alert")).toHaveTextContent(expectedBold)
  })

  it("shows Email CJ / Copy email actions on the limit alert", () => {
    chatState = baseChat({
      errorMessage: "You've reached today's question limit. Reach CJ directly.",
      errorKind: "limit",
    })
    render(<Harness />)
    expect(screen.getByRole("link", { name: "Email CJ" })).toHaveAttribute(
      "href",
      "mailto:cj.rivas.dev@gmail.com"
    )
    expect(
      screen.getByRole("button", { name: "Copy email" })
    ).toBeInTheDocument()
  })

  it("shows a Try again action on the generic alert that retries", async () => {
    chatState = baseChat({
      errorMessage: "That message couldn't be sent.",
      errorKind: "generic",
    })
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(chatState.retry).toHaveBeenCalledOnce()
  })

  describe("Escape", () => {
    it("stops an active stream instead of closing", () => {
      chatState = baseChat({ status: "streaming" })
      render(<Harness />)
      const dialog = document.getElementById("chat-panel")
      expect(dialog).not.toBeNull()
      fireEvent.keyDown(dialog as Element, { key: "Escape" })
      expect(chatState.stop).toHaveBeenCalledOnce()
    })

    it("closes the panel and returns focus to the launcher when idle", async () => {
      const onClose = vi.fn()
      render(<Harness onClose={onClose} />)
      const dialog = document.getElementById("chat-panel")
      fireEvent.keyDown(dialog as Element, { key: "Escape" })
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  describe("source activation", () => {
    afterEach(() => {
      document
        .querySelectorAll("[data-test-heading]")
        .forEach((node) => node.remove())
    })

    it("scrolls to, focuses, and highlights the cited role on desktop without closing", () => {
      const heading = document.createElement("h3")
      heading.id = "exp-varicent_2021"
      heading.setAttribute("tabindex", "-1")
      heading.setAttribute("data-test-heading", "true")
      heading.textContent = "Varicent"
      document.body.appendChild(heading)

      chatState = baseChat({
        messages: [
          userMessage("q"),
          assistantMessage({
            id: "a1",
            text: "CJ worked at Varicent. [[exp:varicent_2021]]",
          }),
        ],
      })
      const onClose = vi.fn()
      render(<Harness onClose={onClose} />)

      vi.useFakeTimers()
      try {
        const chip = screen.getByRole("button", {
          name: /Go to Varicent, \d{4} on the page/,
        })
        fireEvent.click(chip)

        expect(heading.scrollIntoView).toHaveBeenCalled()
        expect(document.activeElement).toBe(heading)
        expect(onClose).not.toHaveBeenCalled()
        expect(heading.className).not.toBe("")

        vi.advanceTimersByTime(2000)
        expect(heading.className).toBe("")
      } finally {
        vi.useRealTimers()
      }
    })

    it("closes the panel first on narrow screens", async () => {
      mockMatchMedia(false) // narrow: doesn't match the 48rem query
      const heading = document.createElement("h3")
      heading.id = "exp-varicent_2021"
      heading.setAttribute("data-test-heading", "true")
      document.body.appendChild(heading)

      chatState = baseChat({
        messages: [
          userMessage("q"),
          assistantMessage({
            id: "a1",
            text: "CJ worked at Varicent. [[exp:varicent_2021]]",
          }),
        ],
      })
      const onClose = vi.fn()
      const user = userEvent.setup()
      render(<Harness onClose={onClose} />)

      const chip = screen.getByRole("button", {
        name: /Go to Varicent, \d{4} on the page/,
      })
      await user.click(chip)
      expect(onClose).toHaveBeenCalledOnce()
    })

    it("does not crash when the target heading isn't on the page yet", async () => {
      chatState = baseChat({
        messages: [
          userMessage("q"),
          assistantMessage({
            id: "a1",
            text: "CJ worked at Varicent. [[exp:varicent_2021]]",
          }),
        ],
      })
      const user = userEvent.setup()
      render(<Harness />)
      const chip = screen.getByRole("button", {
        name: /Go to Varicent, \d{4} on the page/,
      })
      await expect(user.click(chip)).resolves.not.toThrow()
    })
  })

  it("renders a timeline figure for a [[timeline:...]] marker", () => {
    chatState = baseChat({
      messages: [
        userMessage("q"),
        assistantMessage({
          id: "a1",
          text: "Two roles overlapped.\n[[timeline:varicent_2021,myplanet_2020]]",
        }),
      ],
    })
    render(<Harness />)
    expect(screen.getByRole("figure")).toBeInTheDocument()
  })
})
