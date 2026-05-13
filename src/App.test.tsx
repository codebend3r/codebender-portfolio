import App from "@App"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import resume from "@data/resume.json"

const { html2pdfSave, html2pdfFrom, html2pdfSet, html2pdfFactory } = vi.hoisted(
  () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const from = vi.fn(() => ({ save }))
    const set = vi.fn(() => ({ from }))
    const factory = vi.fn(() => ({ set }))
    return {
      html2pdfSave: save,
      html2pdfFrom: from,
      html2pdfSet: set,
      html2pdfFactory: factory,
    }
  }
)

vi.mock("html2pdf.js", () => ({
  default: html2pdfFactory,
}))

vi.mock("@components/Sky", () => ({
  Sky: () => <div data-testid="sky-mock" />,
}))

vi.mock("@components/Weather", () => ({
  Weather: () => <div data-testid="weather-mock" />,
}))

vi.mock("@utils/print-utils", () => ({
  waitForAssets: vi.fn().mockResolvedValue(undefined),
}))

describe("App", () => {
  beforeEach(() => {
    html2pdfFactory.mockClear()
    html2pdfSet.mockClear()
    html2pdfFrom.mockClear()
    html2pdfSave.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the major resume sections in order", () => {
    render(<App />)
    expect(screen.getByTestId("sky-mock")).toBeInTheDocument()
    expect(screen.getByTestId("weather-mock")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1, name: resume.name })
    ).toBeInTheDocument()
    for (const title of [
      "Summary",
      "Technical Skills",
      "Work Experience",
      "Awards",
      "Languages",
      "Education",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name: title })
      ).toBeInTheDocument()
    }
  })

  it("renders an enabled download button by default", () => {
    render(<App />)
    const button = screen.getByRole("button", { name: "Download PDF" })
    expect(button).toBeEnabled()
    expect(button).toHaveAttribute("aria-busy", "false")
  })

  it("invokes html2pdf when the download button is clicked", async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole("button", { name: "Download PDF" }))
    await waitFor(() => expect(html2pdfSave).toHaveBeenCalledTimes(1))
    expect(html2pdfFactory).toHaveBeenCalledTimes(1)
    expect(html2pdfSet).toHaveBeenCalledTimes(1)
    expect(html2pdfFrom).toHaveBeenCalledTimes(1)
  })

  it("shows a generating state while the PDF is being produced", async () => {
    let resolveSave: () => void = () => {}
    html2pdfSave.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )

    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole("button", { name: "Download PDF" })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Generating…" })).toBeDisabled()
    })

    resolveSave()
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled()
    })
  })

  it("logs and recovers when PDF generation fails", async () => {
    const error = new Error("nope")
    html2pdfSave.mockRejectedValueOnce(error)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole("button", { name: "Download PDF" }))
    await waitFor(() => expect(consoleError).toHaveBeenCalled())
    expect(consoleError.mock.calls[0][0]).toBe("PDF generation failed:")
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled()

    consoleError.mockRestore()
  })
})
