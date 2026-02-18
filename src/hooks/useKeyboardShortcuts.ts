import { useEffect, useCallback, useRef } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  disabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: ShortcutConfig[];
}

const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export const useKeyboardShortcuts = ({
  enabled = true,
  shortcuts,
}: UseKeyboardShortcutsOptions) => {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.disabled) continue;

        const ctrlPressed = isMac ? e.metaKey : e.ctrlKey;
        const ctrlMatch = shortcut.ctrl ? ctrlPressed : !ctrlPressed;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (isInputFocused && !['Escape'].includes(shortcut.key)) {
            continue;
          }

          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
};

export const createShortcuts = (
  actions: {
    onDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onCopy?: () => void;
    onPaste?: () => void;
    onSelectAll?: () => void;
    onDuplicate?: () => void;
    onEscape?: () => void;
  },
  disabled = false,
): ShortcutConfig[] => {
  const shortcuts: ShortcutConfig[] = [];

  if (actions.onDelete) {
    shortcuts.push(
      { key: 'Delete', action: actions.onDelete, disabled },
      { key: 'Backspace', action: actions.onDelete, disabled },
    );
  }

  if (actions.onUndo) {
    shortcuts.push({ key: 'z', ctrl: true, action: actions.onUndo, disabled });
  }

  if (actions.onRedo) {
    shortcuts.push(
      { key: 'z', ctrl: true, shift: true, action: actions.onRedo, disabled },
      { key: 'y', ctrl: true, action: actions.onRedo, disabled },
    );
  }

  if (actions.onCopy) {
    shortcuts.push({ key: 'c', ctrl: true, action: actions.onCopy, disabled });
  }

  if (actions.onPaste) {
    shortcuts.push({ key: 'v', ctrl: true, action: actions.onPaste, disabled });
  }

  if (actions.onSelectAll) {
    shortcuts.push({ key: 'a', ctrl: true, action: actions.onSelectAll, disabled });
  }

  if (actions.onDuplicate) {
    shortcuts.push({ key: 'd', ctrl: true, action: actions.onDuplicate, disabled });
  }

  if (actions.onEscape) {
    shortcuts.push({ key: 'Escape', action: actions.onEscape, disabled: false });
  }

  return shortcuts;
};

export default useKeyboardShortcuts;
