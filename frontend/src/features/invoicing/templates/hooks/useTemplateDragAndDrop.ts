import React from 'react';
import {
  DragCancelEvent,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { DOCUMENT_TEMPLATE_ELEMENT_TYPE, TemplatePageSettings } from '@/types';
import {
  TEMPLATE_PAGE_DROPPABLE_ID,
  TemplateCanvasPoint,
  TemplateDragData,
  TemplateVariableDefinition
} from '../types/template-editor.types';
import { getPageRect, screenPointToPagePoint } from '../utils/coordinates';

const getClientPoint = (event: Event | undefined) => {
  if (!event) return null;
  if ('clientX' in event && 'clientY' in event) {
    return { x: event.clientX as number, y: event.clientY as number };
  }
  if ('touches' in event) {
    const touchEvent = event as TouchEvent;
    if (touchEvent.touches[0]) {
      return { x: touchEvent.touches[0].clientX, y: touchEvent.touches[0].clientY };
    }
  }
  return null;
};

const getTranslatedRectCenter = (event: DragEndEvent) => {
  const translatedRect = event.active.rect.current.translated;
  if (!translatedRect) return null;

  return {
    x: translatedRect.left + translatedRect.width / 2,
    y: translatedRect.top + translatedRect.height / 2
  };
};

const getFallbackDropPoint = (event: DragEndEvent) => {
  const activatorPoint = getClientPoint(event.activatorEvent);
  if (!activatorPoint) return null;

  return {
    x: activatorPoint.x + event.delta.x,
    y: activatorPoint.y + event.delta.y
  };
};

export const useTemplateDragAndDrop = ({
  pageRef,
  pageSettings,
  zoom,
  onAddElement,
  onAddVariable
}: {
  pageRef: React.RefObject<HTMLDivElement>;
  pageSettings?: TemplatePageSettings;
  zoom: number;
  onAddElement: (type: DOCUMENT_TEMPLATE_ELEMENT_TYPE, point?: TemplateCanvasPoint) => void;
  onAddVariable: (variable: TemplateVariableDefinition, point?: TemplateCanvasPoint) => void;
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 }
    })
  );
  const [activeDragData, setActiveDragData] = React.useState<TemplateDragData | null>(null);

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as TemplateDragData | undefined;
    setActiveDragData(data || null);
  }, []);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const data = event.active.data.current as TemplateDragData | undefined;
      setActiveDragData(null);

      if (!data || !pageSettings || event.over?.id !== TEMPLATE_PAGE_DROPPABLE_ID) return;

      const pageRect = getPageRect(pageRef);
      if (!pageRect) return;

      const dropPoint = getTranslatedRectCenter(event) || getFallbackDropPoint(event);
      if (!dropPoint) return;

      const point = screenPointToPagePoint({
        clientX: dropPoint.x,
        clientY: dropPoint.y,
        pageRect,
        zoom,
        pageSettings
      });

      if (!point) return;

      if (data.kind === 'element') {
        onAddElement(data.elementType, point);
        return;
      }

      onAddVariable(data.variable, point);
    },
    [onAddElement, onAddVariable, pageRef, pageSettings, zoom]
  );

  const handleDragCancel = React.useCallback((_event: DragCancelEvent) => {
    setActiveDragData(null);
  }, []);

  return {
    sensors,
    activeDragData,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  };
};
