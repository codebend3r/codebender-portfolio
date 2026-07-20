import App from "@App"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import resume from "@data/resume.json"

const { generateResumePdfMock, downloadBlobMock } = vi.hoisted(() => ({
  generateResumePdfMock: vi.fn().mockResolvedValue(new Blob()),
  downloadBlobMock: vi.fn(),
}))

vi.mock("@pdf", () => ({
  generateResumePdf: generateResumePdfMock,
  downloadBlob: downloadBlobMock,
}))

vi.mock("@components/Sky", () => ({
  Sky: () => <div data-testid="sky-mock" />,
}))

vi.mock("@components/Weather", () => ({
  Weather: () => <div data-testid="weather-mock" />,
}))

vi.mock("@components/WeatherClock", () => ({
  WeatherClock: () => <div data-testid="weather-clock-mock" />,
}))

describe("App", () => {
  beforeEach(() => {
    generateResumePdfMock.mockClear()
    generateResumePdfMock.mockResolvedValue(new Blob())
    downloadBlobMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the major resume sections in order", () => {
    render(<App />)
    expect(screen.getByTestId("sky-mock")).toBeInTheDocument()
    expect(screen.getByTestId("weather-mock")).toBeInTheDocument()
    expect(screen.getByTestId("weather-clock-mock")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 1, name: resume.name })
    ).toBeInTheDocument()
    for (const title of [
      "Summary",
      "Technical Skills",
      "Soft Skills",
      "Work Experience",
      "Selected Work",
      "Awards",
      "Languages",
      "Education",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name: title })
      ).toBeInTheDocument()
    }

    for (const chip of [
      "01 · Stack",
      "02 · Soft Skills",
      "03 · Experience",
      "04 · Selected Work",
      "05 · Recognition",
      "06 · Languages",
      "07 · Education",
    ]) {
      expect(screen.getByText(chip)).toBeInTheDocument()
    }

    expect(screen.queryByText(/^00 ·/)).not.toBeInTheDocument()
    expect(screen.queryByText(/· Summary$/)).not.toBeInTheDocument()
  })

  it("renders an enabled download button by default", () => {
    render(<App />)
    const button = screen.getByRole("button", { name: "Download CV" })
    expect(button).toBeEnabled()
    expect(button).toHaveAttribute("aria-busy", "false")
  })

  it("generates a PDF and triggers a download when clicked", async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole("button", { name: "Download CV" }))
    await waitFor(() => expect(generateResumePdfMock).toHaveBeenCalledTimes(1))
    expect(downloadBlobMock).toHaveBeenCalledTimes(1)
    expect(downloadBlobMock.mock.calls[0][1]).toBe(
      "CJ Rivas - Senior Frontend Engineer + Architect.pdf"
    )
  })

  it("shows a generating state while the PDF is being produced", async () => {
    let resolveGenerate: (blob: Blob) => void = () => {}
    generateResumePdfMock.mockImplementationOnce(
      () =>
        new Promise<Blob>((resolve) => {
          resolveGenerate = resolve
        })
    )

    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole("button", { name: "Download CV" })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Generating…" })).toBeDisabled()
    })

    resolveGenerate(new Blob())
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Download CV" })).toBeEnabled()
    })
  })

  it("ignores a second click while a PDF generation is in flight", async () => {
    let resolveGenerate: (blob: Blob) => void = () => {}
    generateResumePdfMock.mockImplementationOnce(
      () =>
        new Promise<Blob>((resolve) => {
          resolveGenerate = resolve
        })
    )

    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole("button", { name: "Download CV" })
    await user.click(button)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Generating…" })).toBeDisabled()
    })

    await user.click(screen.getByRole("button", { name: "Generating…" }))
    expect(generateResumePdfMock).toHaveBeenCalledTimes(1)

    resolveGenerate(new Blob())
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Download CV" })).toBeEnabled()
    })
  })

  it("logs and recovers when PDF generation fails", async () => {
    const error = new Error("nope")
    generateResumePdfMock.mockRejectedValueOnce(error)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole("button", { name: "Download CV" }))
    await waitFor(() => expect(consoleError).toHaveBeenCalled())
    expect(consoleError.mock.calls[0][0]).toBe("PDF generation failed:")
    expect(screen.getByRole("button", { name: "Download CV" })).toBeEnabled()
    expect(downloadBlobMock).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
