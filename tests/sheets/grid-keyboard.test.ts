import { describe, expect, it } from "vitest";
import { isGridEditableTarget, resolveGridKeyboardShortcut } from "@/lib/sheets/grid-keyboard";

describe("grid keyboard shortcuts", () => {
  it.each([
    [{ key: "z", metaKey: true, ctrlKey: false, shiftKey: false }, "undo"],
    [{ key: "Z", metaKey: true, ctrlKey: false, shiftKey: true }, "redo"],
    [{ key: "z", metaKey: false, ctrlKey: true, shiftKey: true }, "redo"],
    [{ key: "d", metaKey: true, ctrlKey: false, shiftKey: false }, "fill_down"],
    [{ key: "c", metaKey: false, ctrlKey: true, shiftKey: false }, "copy"],
    [{ key: "x", metaKey: true, ctrlKey: false, shiftKey: false }, "cut"],
    [{ key: "v", metaKey: false, ctrlKey: true, shiftKey: false }, "paste"],
  ] as const)("maps %o to %s", (input, expected) => {
    expect(resolveGridKeyboardShortcut(input)).toBe(expected);
  });

  it("ignores shortcuts without modifier keys", () => {
    expect(
      resolveGridKeyboardShortcut({
        key: "c",
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
      }),
    ).toBeNull();
  });

  it("detects editable keyboard targets", () => {
    expect(isGridEditableTarget(null)).toBe(false);
    expect(isGridEditableTarget({ tagName: "DIV" } as EventTarget)).toBe(false);
    expect(isGridEditableTarget({ tagName: "INPUT" } as EventTarget)).toBe(true);
    expect(isGridEditableTarget({ tagName: "TEXTAREA" } as EventTarget)).toBe(true);
    expect(isGridEditableTarget({ tagName: "SELECT" } as EventTarget)).toBe(true);
    expect(
      isGridEditableTarget({ tagName: "DIV", isContentEditable: true } as EventTarget),
    ).toBe(true);
  });
});
