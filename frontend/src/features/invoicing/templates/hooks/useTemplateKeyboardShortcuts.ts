import React from 'react';
import { TemplateElement } from '@/types';

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
};

export const useTemplateKeyboardShortcuts = ({
  selectedElements,
  onMoveSelectedElements,
  onDeleteSelectedElements,
  onDuplicateSelectedElements,
  onClearSelection,
  onSelectAllOnPage
}: {
  selectedElements: TemplateElement[];
  onMoveSelectedElements: (deltaX: number, deltaY: number) => void;
  onDeleteSelectedElements: () => void;
  onDuplicateSelectedElements: () => void;
  onClearSelection: () => void;
  onSelectAllOnPage: (pageIndex?: number) => void;
}) => {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      if (event.key === 'Escape') {
        if (selectedElements.length) {
          event.preventDefault();
          onClearSelection();
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        onSelectAllOnPage(0);
        return;
      }

      if (!selectedElements.length) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        onDuplicateSelectedElements();
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        onDeleteSelectedElements();
        return;
      }

      if (!event.key.startsWith('Arrow')) return;

      const step = event.shiftKey ? 10 : 1;
      const delta = {
        ArrowUp: { x: 0, y: -step },
        ArrowDown: { x: 0, y: step },
        ArrowLeft: { x: -step, y: 0 },
        ArrowRight: { x: step, y: 0 }
      }[event.key];

      if (!delta) return;
      event.preventDefault();
      onMoveSelectedElements(delta.x, delta.y);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onClearSelection,
    onDeleteSelectedElements,
    onDuplicateSelectedElements,
    onMoveSelectedElements,
    onSelectAllOnPage,
    selectedElements.length
  ]);
};
