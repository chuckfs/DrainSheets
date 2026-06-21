import { describe, expect, it } from "vitest";
import { isGridEditableTarget, isGridFocusTarget, resolveGridKeyboardShortcut } from "@/lib/sheets/grid-keyboard";

describe("grid keyboard shortcuts", () => {
  it.each([
    [{ key: "z", metaKey: true, ctrlKey: false, shiftKey: false }, "undo"],
    [{ key: "Z", metaKey: true, ctrlKey: false, shiftKey: true }, "redo"],
    [{ key: "z", metaKey: false, ctrlKey: true, shiftKey: true }, "redo"],
    [{ key: "d", metaKey: true, ctrlKey: false, shiftKey: false }, "fill_down"],
    [{ key: "c", metaKey: false, ctrlKey: true, shiftKey: false }, "copy"],
    [{ key: "x", metaKey: true, ctrlKey: false, shiftKey: false }, "cut"],
    [{ key: "v", metaKey: false, ctrlKey: true, shiftKey: false }, "paste"],
    [{ key: "a", metaKey: true, ctrlKey: false, shiftKey: false }, "select_all"],
    [{ key: "A", metaKey: false, ctrlKey: true, shiftKey: false }, "select_all"],
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

  it("detects grid focus targets", () => {
    const cell = {
      closest(selector: string) {
        if (selector === '[role="gridcell"]') {
          return cell;
        }
        return null;
      },
    } as unknown as HTMLElement;

    expect(isGridFocusTarget(cell)).toBe(true);
    expect(isGridFocusTarget({ closest: () => null } as unknown as HTMLElement)).toBe(false);
  });
});
