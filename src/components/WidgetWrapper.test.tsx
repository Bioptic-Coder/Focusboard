import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WidgetWrapper } from "./WidgetWrapper";
import type { WidgetConfig } from "./Dashboard";

const mockWidget: WidgetConfig = {
  id: "test-widget",
  type: "clock",
  x: 2,
  y: 3,
  w: 4,
  h: 2,
  title: "Test Clock",
};

const defaultProps = {
  widget: mockWidget,
  editMode: true,
  onDelete: vi.fn(),
  onUpdate: vi.fn(),
  children: <div>Widget Content</div>,
  onDragStart: vi.fn(),
  onResizeStart: vi.fn(),
  onDragEnd: vi.fn(),
  onResizeEnd: vi.fn(),
  announce: vi.fn(),
};

describe("WidgetWrapper Keyboard Navigation & Accessibility", () => {
  it("allows moving the widget via arrow keys when wrapper container has focus", () => {
    const onUpdateMock = vi.fn();
    render(<WidgetWrapper {...defaultProps} onUpdate={onUpdateMock} />);

    const container = screen.getByLabelText(/Test Clock widget\. Grid position/i);
    container.focus();

    // ArrowUp (y - 1) -> y goes from 3 to 2
    const eventUp = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true });
    container.dispatchEvent(eventUp);
    expect(onUpdateMock).toHaveBeenLastCalledWith("test-widget", { x: 2, y: 2 });
    expect(eventUp.defaultPrevented).toBe(true);

    // ArrowDown (y + 1) -> y goes from 3 to 4
    const eventDown = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
    container.dispatchEvent(eventDown);
    expect(onUpdateMock).toHaveBeenLastCalledWith("test-widget", { x: 2, y: 4 });
    expect(eventDown.defaultPrevented).toBe(true);

    // ArrowLeft (x - 1) -> x goes from 2 to 1
    const eventLeft = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true });
    container.dispatchEvent(eventLeft);
    expect(onUpdateMock).toHaveBeenLastCalledWith("test-widget", { x: 1, y: 3 });
    expect(eventLeft.defaultPrevented).toBe(true);

    // ArrowRight (x + 1) -> x goes from 2 to 3
    const eventRight = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
    container.dispatchEvent(eventRight);
    expect(onUpdateMock).toHaveBeenLastCalledWith("test-widget", { x: 3, y: 3 });
    expect(eventRight.defaultPrevented).toBe(true);
  });

  it("allows resizing the widget via Shift + arrow keys when wrapper container has focus", () => {
    const onUpdateMock = vi.fn();
    render(<WidgetWrapper {...defaultProps} onUpdate={onUpdateMock} />);

    const container = screen.getByLabelText(/Test Clock widget\. Grid position/i);
    container.focus();

    // Shift + ArrowUp (shrink-h) -> h goes from 2 to 1
    const eventUp = new KeyboardEvent("keydown", { key: "ArrowUp", shiftKey: true, bubbles: true, cancelable: true });
    container.dispatchEvent(eventUp);
    expect(onUpdateMock).toHaveBeenLastCalledWith("test-widget", { w: 4, h: 1 });
    expect(eventUp.defaultPrevented).toBe(true);

    // Shift + ArrowDown (grow-h) -> h goes from 2 to 3
    const eventDown = new KeyboardEvent("keydown", { key: "ArrowDown", shiftKey: true, bubbles: true, cancelable: true });
    container.dispatchEvent(eventDown);
    expect(onUpdateMock).toHaveBeenLastCalledWith("test-widget", { w: 4, h: 3 });
    expect(eventDown.defaultPrevented).toBe(true);

    // Shift + ArrowLeft (shrink-w) -> w goes from 4 to 3
    const eventLeft = new KeyboardEvent("keydown", { key: "ArrowLeft", shiftKey: true, bubbles: true, cancelable: true });
    container.dispatchEvent(eventLeft);
    expect(onUpdateMock).toHaveBeenLastCalledWith("test-widget", { w: 3, h: 2 });
    expect(eventLeft.defaultPrevented).toBe(true);

    // Shift + ArrowRight (grow-w) -> w goes from 4 to 5
    const eventRight = new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true, cancelable: true });
    container.dispatchEvent(eventRight);
    expect(onUpdateMock).toHaveBeenLastCalledWith("test-widget", { w: 5, h: 2 });
    expect(eventRight.defaultPrevented).toBe(true);
  });

  it("deletes the widget via Delete/Backspace keys when wrapper container has focus", () => {
    const onDeleteMock = vi.fn();
    render(<WidgetWrapper {...defaultProps} onDelete={onDeleteMock} />);

    const container = screen.getByLabelText(/Test Clock widget\. Grid position/i);
    container.focus();

    const eventDelete = new KeyboardEvent("keydown", { key: "Delete", bubbles: true, cancelable: true });
    container.dispatchEvent(eventDelete);
    expect(onDeleteMock).toHaveBeenLastCalledWith("test-widget");
    expect(eventDelete.defaultPrevented).toBe(true);

    const eventBackspace = new KeyboardEvent("keydown", { key: "Backspace", bubbles: true, cancelable: true });
    container.dispatchEvent(eventBackspace);
    expect(onDeleteMock).toHaveBeenLastCalledWith("test-widget");
    expect(eventBackspace.defaultPrevented).toBe(true);
  });

  it("does not trigger keyboard actions when focus is inside a child element", () => {
    const onUpdateMock = vi.fn();
    const onDeleteMock = vi.fn();
    render(
      <WidgetWrapper {...defaultProps} onUpdate={onUpdateMock} onDelete={onDeleteMock}>
        <input data-testid="child-input" />
      </WidgetWrapper>
    );

    const childInput = screen.getByTestId("child-input");
    childInput.focus();

    // Arrow keys or Delete inside input should not be intercepted
    const eventUp = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true });
    childInput.dispatchEvent(eventUp);
    expect(onUpdateMock).not.toHaveBeenCalled();
    expect(eventUp.defaultPrevented).toBe(false);

    const eventDelete = new KeyboardEvent("keydown", { key: "Delete", bubbles: true, cancelable: true });
    childInput.dispatchEvent(eventDelete);
    expect(onDeleteMock).not.toHaveBeenCalled();
    expect(eventDelete.defaultPrevented).toBe(false);
  });

  it("verifies all edit-mode interactive controls have a minimum target size of 44x44px", () => {
    render(<WidgetWrapper {...defaultProps} />);

    // 1. Delete button
    const deleteBtn = screen.getByRole("button", { name: /Delete Test Clock widget/i });
    expect(deleteBtn.className).toContain("w-11");
    expect(deleteBtn.className).toContain("h-11");

    // 2. Drag handle
    const dragHandle = screen.getByLabelText(/Drag widget handle/i);
    expect(dragHandle.className).toContain("w-11");
    expect(dragHandle.className).toContain("h-11");

    // 3. Resize handle
    const resizeHandle = screen.getByLabelText(/Resize widget handle/i);
    expect(resizeHandle.className).toContain("w-11");
    expect(resizeHandle.className).toContain("h-11");

    // 4. Move buttons in the positioning panel
    const moveUpBtn = screen.getByRole("button", { name: /Move Test Clock Up/i });
    expect(moveUpBtn.className).toContain("w-11");
    expect(moveUpBtn.className).toContain("h-11");

    const moveDownBtn = screen.getByRole("button", { name: /Move Test Clock Down/i });
    expect(moveDownBtn.className).toContain("w-11");
    expect(moveDownBtn.className).toContain("h-11");

    const moveLeftBtn = screen.getByRole("button", { name: /Move Test Clock Left/i });
    expect(moveLeftBtn.className).toContain("w-11");
    expect(moveLeftBtn.className).toContain("h-11");

    const moveRightBtn = screen.getByRole("button", { name: /Move Test Clock Right/i });
    expect(moveRightBtn.className).toContain("w-11");
    expect(moveRightBtn.className).toContain("h-11");

    // 5. Size buttons in the positioning panel
    const shrinkWBtn = screen.getByRole("button", { name: /Shrink Test Clock Width/i });
    expect(shrinkWBtn.className).toContain("w-11");
    expect(shrinkWBtn.className).toContain("h-11");

    const growWBtn = screen.getByRole("button", { name: /Expand Test Clock Width/i });
    expect(growWBtn.className).toContain("w-11");
    expect(growWBtn.className).toContain("h-11");

    const shrinkHBtn = screen.getByRole("button", { name: /Shrink Test Clock Height/i });
    expect(shrinkHBtn.className).toContain("w-11");
    expect(shrinkHBtn.className).toContain("h-11");

    const growHBtn = screen.getByRole("button", { name: /Expand Test Clock Height/i });
    expect(growHBtn.className).toContain("w-11");
    expect(growHBtn.className).toContain("h-11");
  });
});
