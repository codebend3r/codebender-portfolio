import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DropArea } from "@generate/DropArea"

function makeImageFile(bytes: number, name = "posting.png"): File {
  return new File([new Uint8Array(bytes)], name, { type: "image/png" })
}

describe("DropArea", () => {
  it("emits a text input when typing into the textarea", () => {
    const onChange = vi.fn()
    render(<DropArea value={null} onChange={onChange} onError={() => {}} />)
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Senior Frontend Engineer" },
    })
    expect(onChange).toHaveBeenCalledWith({
      type: "text",
      text: "Senior Frontend Engineer",
    })
  })

  it("emits null when the textarea is emptied", () => {
    const onChange = vi.fn()
    render(
      <DropArea
        value={{ type: "text", text: "x" }}
        onChange={onChange}
        onError={() => {}}
      />
    )
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } })
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it("emits an image input when an image file is dropped", async () => {
    const onChange = vi.fn()
    render(<DropArea value={null} onChange={onChange} onError={() => {}} />)
    fireEvent.drop(screen.getByLabelText(/drop area/i), {
      dataTransfer: { files: [makeImageFile(100)] },
    })
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ type: "image", mediaType: "image/png" })
      )
    )
  })

  it("rejects oversized images via onError", async () => {
    const onChange = vi.fn()
    const onError = vi.fn()
    render(<DropArea value={null} onChange={onChange} onError={onError} />)
    fireEvent.drop(screen.getByLabelText(/drop area/i), {
      dataTransfer: { files: [makeImageFile(3_500_001)] },
    })
    await waitFor(() => expect(onError).toHaveBeenCalled())
    expect(onChange).not.toHaveBeenCalled()
  })

  it("shows the selected image and clears it", () => {
    const onChange = vi.fn()
    render(
      <DropArea
        value={{ type: "image", mediaType: "image/png", dataBase64: "AAAA" }}
        onChange={onChange}
        onError={() => {}}
      />
    )
    expect(screen.getByText(/image attached/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /clear/i }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it("surfaces a file-read failure via onError", async () => {
    const onChange = vi.fn()
    const onError = vi.fn()
    vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(
      function (this: FileReader) {
        this.dispatchEvent(new ProgressEvent("error"))
      }
    )
    render(<DropArea value={null} onChange={onChange} onError={onError} />)
    fireEvent.drop(screen.getByLabelText(/drop area/i), {
      dataTransfer: { files: [makeImageFile(100)] },
    })
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Could not read the image file")
    )
    expect(onChange).not.toHaveBeenCalled()
  })
})
