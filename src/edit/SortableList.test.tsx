import type { DragEndEvent } from "@dnd-kit/core"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { EditProvider } from "@edit/EditContext"
import { SortableItem, SortableList } from "@edit/SortableList"
import { makeDragEndHandler } from "@edit/SortableListImpl"

function Fixture({ items }: { items: string[] }) {
  return (
    <SortableList count={items.length} onReorder={() => {}}>
      <ul>
        {items.map((item, i) => (
          <SortableItem key={i} index={i} label={`item ${i + 1}`}>
            {(handle) => (
              <>
                {handle}
                <span>{item}</span>
              </>
            )}
          </SortableItem>
        ))}
      </ul>
    </SortableList>
  )
}

const items = ["alpha", "beta", "gamma"]

describe("SortableList", () => {
  it("renders plain items without handles when not editing", () => {
    render(<Fixture items={items} />)
    expect(screen.getByText("alpha")).toBeInTheDocument()
    expect(screen.getByText("alpha").closest("li")).not.toBeNull()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renders a drag handle per item in edit mode", async () => {
    render(
      <EditProvider editing markDirty={() => {}}>
        <Fixture items={items} />
      </EditProvider>
    )
    const handles = await screen.findAllByRole("button", {
      name: /drag to reorder item \d/i,
    })
    expect(handles).toHaveLength(3)
  })

  it("renders the whole item as the drag activator with dragWholeItem", async () => {
    render(
      <EditProvider editing markDirty={() => {}}>
        <SortableList count={1} onReorder={() => {}}>
          <SortableItem index={0} label="tag 1" as="span" dragWholeItem>
            {() => "chip"}
          </SortableItem>
        </SortableList>
      </EditProvider>
    )
    const chip = await screen.findByRole("button", { name: "chip" })
    expect(chip.tagName).toBe("SPAN")
  })
})

describe("makeDragEndHandler", () => {
  const event = (active: string, over: string | null) =>
    ({
      active: { id: active },
      over: over === null ? null : { id: over },
    }) as DragEndEvent

  it("maps ids to indices and marks dirty", () => {
    const onReorder = vi.fn()
    const markDirty = vi.fn()
    makeDragEndHandler(onReorder, markDirty)(event("0", "2"))
    expect(onReorder).toHaveBeenCalledWith(0, 2)
    expect(markDirty).toHaveBeenCalledOnce()
  })

  it("no-ops when dropped outside a target", () => {
    const onReorder = vi.fn()
    const markDirty = vi.fn()
    makeDragEndHandler(onReorder, markDirty)(event("1", null))
    expect(onReorder).not.toHaveBeenCalled()
    expect(markDirty).not.toHaveBeenCalled()
  })

  it("no-ops when dropped on itself", () => {
    const onReorder = vi.fn()
    const markDirty = vi.fn()
    makeDragEndHandler(onReorder, markDirty)(event("1", "1"))
    expect(onReorder).not.toHaveBeenCalled()
    expect(markDirty).not.toHaveBeenCalled()
  })
})
