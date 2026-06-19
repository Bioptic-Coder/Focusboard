import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { BrainDumpWidget } from "./BrainDumpWidget";

describe("BrainDumpWidget", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders empty state with placeholder text", () => {
    render(<BrainDumpWidget />);
    expect(screen.getByText("Empty mind, clear focus")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
  });

  it("adds an item when Enter is pressed", () => {
    render(<BrainDumpWidget />);
    const input = screen.getByPlaceholderText("What's on your mind?");

    fireEvent.change(input, { target: { value: "Test thought" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Test thought")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("adds an item when the add button is clicked", () => {
    render(<BrainDumpWidget />);
    const input = screen.getByPlaceholderText("What's on your mind?");
    const addButton = screen.getByLabelText("Add item");

    fireEvent.change(input, { target: { value: "Click test" } });
    fireEvent.click(addButton);

    expect(screen.getByText("Click test")).toBeInTheDocument();
  });

  it("does not add empty items", () => {
    render(<BrainDumpWidget />);
    const input = screen.getByPlaceholderText("What's on your mind?");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Empty mind, clear focus")).toBeInTheDocument();
  });

  it("toggles processed state on an item", () => {
    render(<BrainDumpWidget />);
    const input = screen.getByPlaceholderText("What's on your mind?");

    fireEvent.change(input, { target: { value: "Toggle me" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const toggleButton = screen.getByLabelText('Mark "Toggle me" as processed');
    fireEvent.click(toggleButton);

    // Item should now have strikethrough style (processed)
    const itemText = screen.getByText("Toggle me");
    expect(itemText.className).toContain("line-through");
  });

  it("removes an item", () => {
    render(<BrainDumpWidget />);
    const input = screen.getByPlaceholderText("What's on your mind?");

    fireEvent.change(input, { target: { value: "Remove me" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const removeButton = screen.getByLabelText('Remove "Remove me"');
    fireEvent.click(removeButton);

    expect(screen.queryByText("Remove me")).not.toBeInTheDocument();
  });

  it("clears all items with confirmation", () => {
    render(<BrainDumpWidget />);
    const input = screen.getByPlaceholderText("What's on your mind?");

    fireEvent.change(input, { target: { value: "Item 1" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "Item 2" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const clearButton = screen.getByLabelText("Clear all items");
    fireEvent.click(clearButton);

    // window.confirm is mocked to return true in setup.ts
    expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Item 2")).not.toBeInTheDocument();
  });

  it("persists items to localStorage", () => {
    render(<BrainDumpWidget />);
    const input = screen.getByPlaceholderText("What's on your mind?");

    fireEvent.change(input, { target: { value: "Persistent thought" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const stored = localStorage.getItem("focusboard-braindump");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].text).toBe("Persistent thought");
  });
});
