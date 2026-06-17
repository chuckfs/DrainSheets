"use client";

import { useEffect, useRef } from "react";

type WorkspaceShortcutsHandlers = {
  onFocusSearch?: () => void;
  onClosePanel?: () => void;
  onGlobalSearch?: () => void;
  onAddNote?: () => void;
  onUpload?: () => void;
  enabled?: boolean;
};

export function useWorkspaceShortcuts({
  onFocusSearch,
  onClosePanel,
  onGlobalSearch,
  onAddNote,
  onUpload,
  enabled = true,
}: WorkspaceShortcutsHandlers) {
  const handlersRef = useRef({
    onFocusSearch,
    onClosePanel,
    onGlobalSearch,
    onAddNote,
    onUpload,
  });

  handlersRef.current = {
    onFocusSearch,
    onClosePanel,
    onGlobalSearch,
    onAddNote,
    onUpload,
  };

  useEffect(() => {
    if (!enabled) return;

    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) {
        if (event.key === "Escape") {
          (event.target as HTMLElement).blur();
          handlersRef.current.onClosePanel?.();
        }
        return;
      }

      const mod = event.metaKey || event.ctrlKey;

      if (event.key === "/" && !mod) {
        event.preventDefault();
        handlersRef.current.onFocusSearch?.();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        handlersRef.current.onClosePanel?.();
        return;
      }

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        handlersRef.current.onGlobalSearch?.();
        return;
      }

      if (!mod && event.key.toLowerCase() === "n") {
        event.preventDefault();
        handlersRef.current.onAddNote?.();
        return;
      }

      if (!mod && event.key.toLowerCase() === "u") {
        event.preventDefault();
        handlersRef.current.onUpload?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
