import React, { CSSProperties } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createDefaultTableConfig,
  DOCUMENT_TEMPLATE_ELEMENT_TYPE,
  TemplateElement,
  TemplatePageSettings
} from '@/types';
import {
  TEMPLATE_PAGE_DROPPABLE_ID,
  TemplateElementInteraction
} from '../types/template-editor.types';
import {
  clampGroupMoveDelta,
  getElementsBoundingBox,
  getElementsInSelectionRect,
  getPagePixelSize,
  getPixelsPerUnit,
  moveElementsByDelta,
  normalizeSelectionRect,
  resizeElementWithinPage,
  roundTemplateUnit,
  screenPointToPagePoint
} from '../utils/coordinates';
import { TemplateCanvasPoint, TemplateSelectionRect } from '../types/template-editor.types';

interface TemplateEditorCanvasProps {
  pageSettings: TemplatePageSettings;
  elements: TemplateElement[];
  selectedElementId?: string;
  selectedElementIds: string[];
  zoom: number;
  showGrid: boolean;
  pageRef: React.MutableRefObject<HTMLDivElement | null>;
  viewportRef: React.MutableRefObject<HTMLDivElement | null>;
  onSelectElement: (id?: string) => void;
  onToggleElementSelection: (id: string) => void;
  onAddElementToSelection: (id: string) => void;
  onSetSelectedElementIds: (ids: string[]) => void;
  onClearSelection: () => void;
  onUpdateElement: (element: TemplateElement) => void;
  onUpdateElements: (elements: TemplateElement[]) => void;
}

type MarqueeState = {
  start: TemplateCanvasPoint;
  current: TemplateCanvasPoint;
  active: boolean;
};

export const TemplateEditorCanvas = ({
  pageSettings,
  elements,
  selectedElementId,
  selectedElementIds,
  zoom,
  showGrid,
  pageRef,
  viewportRef,
  onSelectElement,
  onToggleElementSelection,
  onAddElementToSelection,
  onSetSelectedElementIds,
  onClearSelection,
  onUpdateElement,
  onUpdateElements
}: TemplateEditorCanvasProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: TEMPLATE_PAGE_DROPPABLE_ID });
  const [interaction, setInteraction] = React.useState<TemplateElementInteraction | null>(null);
  const [marquee, setMarquee] = React.useState<MarqueeState | null>(null);
  const skipNextClickRef = React.useRef(false);
  const pagePixelSize = getPagePixelSize(pageSettings, zoom);
  const pixelsPerUnit = getPixelsPerUnit(zoom, pageSettings.unit);
  const selectedIdSet = React.useMemo(() => new Set(selectedElementIds), [selectedElementIds]);
  const selectedElements = React.useMemo(
    () => elements.filter((element) => selectedIdSet.has(element.id)),
    [elements, selectedIdSet]
  );
  const visibleSelectedElements = React.useMemo(
    () => selectedElements.filter((element) => element.visible),
    [selectedElements]
  );
  const selectionBounds = visibleSelectedElements.length
    ? getElementsBoundingBox(visibleSelectedElements)
    : null;
  const groupBounds = selectedElementIds.length > 1 ? selectionBounds : null;

  const setPageNode = React.useCallback(
    (node: HTMLDivElement | null) => {
      pageRef.current = node;
      setNodeRef(node);
    },
    [pageRef, setNodeRef]
  );

  React.useEffect(() => {
    if (!interaction) return;

    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = (event.clientX - interaction.startClientX) / pixelsPerUnit;
      const deltaY = (event.clientY - interaction.startClientY) / pixelsPerUnit;
      if (Math.abs(event.clientX - interaction.startClientX) > 2 || Math.abs(event.clientY - interaction.startClientY) > 2) {
        skipNextClickRef.current = true;
      }

      if (interaction.type === 'group-move' && interaction.elements?.length) {
        const delta = clampGroupMoveDelta(
          interaction.elements,
          roundTemplateUnit(deltaX),
          roundTemplateUnit(deltaY),
          interaction.pageSettings
        );
        onUpdateElements(moveElementsByDelta(interaction.elements, delta.x, delta.y));
        return;
      }

      if (interaction.type === 'move') {
        onUpdateElement({
          ...interaction.element,
          position: {
            x: roundTemplateUnit(interaction.startPosition.x + deltaX),
            y: roundTemplateUnit(interaction.startPosition.y + deltaY)
          }
        });
        return;
      }

      onUpdateElement(
        resizeElementWithinPage(
          {
            ...interaction.element,
            size: interaction.startSize
          },
          interaction.pageSettings,
          roundTemplateUnit(interaction.startSize.width + deltaX),
          roundTemplateUnit(interaction.startSize.height + deltaY)
        )
      );
    };

    const handlePointerUp = () => setInteraction(null);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [interaction, onUpdateElement, onUpdateElements, pixelsPerUnit]);

  React.useEffect(() => {
    if (!marquee) return;

    const handlePointerMove = (event: PointerEvent) => {
      const pageRect = pageRef.current?.getBoundingClientRect();
      if (!pageRect) return;
      const point = screenPointToPagePoint({
        clientX: event.clientX,
        clientY: event.clientY,
        pageRect,
        zoom,
        pageSettings
      });
      if (!point) return;
      const active =
        marquee.active ||
        Math.abs(point.x - marquee.start.x) > 1 ||
        Math.abs(point.y - marquee.start.y) > 1;
      const nextMarquee = { ...marquee, current: point, active };
      setMarquee(nextMarquee);
      if (active) {
        const rect = normalizeSelectionRect(nextMarquee.start, point);
        onSetSelectedElementIds(
          getElementsInSelectionRect(elements, rect, 0).map((element) => element.id)
        );
      }
    };

    const handlePointerUp = () => {
      if (!marquee.active) onClearSelection();
      setMarquee(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    elements,
    marquee,
    onClearSelection,
    onSetSelectedElementIds,
    pageRef,
    pageSettings,
    zoom
  ]);

  const startInteraction = (
    event: React.PointerEvent,
    element: TemplateElement,
    type: TemplateElementInteraction['type']
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.metaKey || event.ctrlKey) {
      onToggleElementSelection(element.id);
      return;
    }
    if (event.shiftKey) {
      onAddElementToSelection(element.id);
      return;
    }

    const alreadySelected = selectedIdSet.has(element.id);
    if (!alreadySelected) onSelectElement(element.id);
    if (element.locked) return;

    const selectedMovableElements = alreadySelected
      ? selectedElements.filter((selectedElement) => selectedElement.visible && !selectedElement.locked)
      : [element];

    setInteraction({
      type: type === 'move' && selectedMovableElements.length > 1 ? 'group-move' : type,
      element,
      elements: type === 'move' && selectedMovableElements.length > 1
        ? selectedMovableElements
        : undefined,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPosition: element.position,
      startSize: element.size,
      pageSettings
    });
  };

  const startSelectionBoundsMove = (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const movableElements = selectedElements.filter(
      (element) => element.visible && !element.locked
    );
    const primaryElement =
      movableElements.find((element) => element.id === selectedElementId) || movableElements[0];
    if (!primaryElement) return;

    setInteraction({
      type: movableElements.length > 1 ? 'group-move' : 'move',
      element: primaryElement,
      elements: movableElements.length > 1 ? movableElements : undefined,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPosition: primaryElement.position,
      startSize: primaryElement.size,
      pageSettings
    });
  };

  const startMarquee = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const pageRect = pageRef.current?.getBoundingClientRect();
    if (!pageRect) return;
    const point = screenPointToPagePoint({
      clientX: event.clientX,
      clientY: event.clientY,
      pageRect,
      zoom,
      pageSettings
    });
    if (!point) return;
    event.stopPropagation();
    setMarquee({ start: point, current: point, active: false });
  };

  const marqueeRect = marquee?.active
    ? normalizeSelectionRect(marquee.start, marquee.current)
    : null;

  return (
    <div
      ref={viewportRef}
      className={cn(
        'min-h-0 flex-1 overflow-auto bg-zinc-100 p-6 overscroll-contain dark:bg-zinc-900 sm:p-8',
        (interaction || marquee?.active) && 'select-none'
      )}
      onClick={() => onClearSelection()}
    >
      <div className="flex min-h-full w-fit min-w-full justify-center">
        <div
          ref={setPageNode}
          className={cn(
            'relative shrink-0 bg-white shadow-lg ring-1 ring-zinc-200 transition-shadow dark:ring-zinc-800',
            isOver &&
              'ring-2 ring-blue-500 ring-offset-4 ring-offset-zinc-100 dark:ring-offset-zinc-900'
          )}
          style={{
            width: pagePixelSize.width,
            height: pagePixelSize.height,
            backgroundImage: showGrid
              ? 'linear-gradient(to right, rgba(113,113,122,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(113,113,122,.12) 1px, transparent 1px)'
              : undefined,
            backgroundSize: showGrid ? `${10 * pixelsPerUnit}px ${10 * pixelsPerUnit}px` : undefined
          }}
          onPointerDown={startMarquee}
          onClick={(event) => event.stopPropagation()}
        >
          {selectionBounds ? (
            <div
              className={cn(
                'absolute rounded-sm border border-blue-500/70 bg-blue-500/5',
                selectedElements.some((element) => element.visible && !element.locked)
                  ? interaction
                    ? 'cursor-grabbing'
                    : 'cursor-move'
                  : 'pointer-events-none'
              )}
              style={getSelectionRectStyle(selectionBounds, pixelsPerUnit)}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={startSelectionBoundsMove}
            >
              {groupBounds ? (
                <span className="pointer-events-none absolute -top-7 left-0 whitespace-nowrap rounded bg-blue-600 px-2 py-1 text-[11px] font-medium text-white shadow-sm">
                  {selectedElementIds.length} elements selected
                </span>
              ) : null}
            </div>
          ) : null}

          {marqueeRect ? (
            <div
              className="pointer-events-none absolute rounded-sm border border-blue-500 bg-blue-500/10"
              style={getSelectionRectStyle(marqueeRect, pixelsPerUnit)}
            />
          ) : null}

          {elements
            .filter((element) => element.visible)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((element) => {
              const selected = selectedIdSet.has(element.id);
              const singleSelected = selectedElementIds.length === 1 && selectedElementId === element.id;
              const style = getElementStyle(element, pixelsPerUnit);

              return (
                <div
                  key={element.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'group absolute overflow-hidden rounded-sm border border-transparent bg-transparent p-1 text-left text-zinc-900 outline-none transition',
                    'hover:border-zinc-400 hover:bg-white/30 focus:ring-2 focus:ring-zinc-400',
                    selected && 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm',
                    element.locked ? 'cursor-not-allowed opacity-90' : selected ? 'cursor-move' : 'cursor-grab'
                  )}
                  style={style}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (skipNextClickRef.current) {
                      skipNextClickRef.current = false;
                      return;
                    }
                    if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
                      onSelectElement(element.id);
                    }
                  }}
                  onPointerDown={(event) => startInteraction(event, element, 'move')}
                >
                  {renderElementContent(element)}
                  {element.locked ? (
                    <Lock className="absolute right-1 top-1 h-3 w-3 rounded bg-white/80 text-zinc-500" />
                  ) : null}
                  {singleSelected && !element.locked ? (
                    <button
                      type="button"
                      aria-label="Resize element"
                      className="absolute bottom-0 right-0 h-3.5 w-3.5 cursor-se-resize rounded-tl-sm border border-blue-500 bg-white shadow-sm transition hover:bg-blue-50"
                      onPointerDown={(event) => startInteraction(event, element, 'resize')}
                    />
                  ) : null}
                </div>
              );
            })}

          {elements.some((element) => !element.visible) ? (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-500 shadow-sm">
              <EyeOff className="h-3 w-3" />
              Hidden layers
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const getSelectionRectStyle = (
  rect: TemplateSelectionRect,
  pixelsPerUnit: number
): CSSProperties => ({
  left: rect.x * pixelsPerUnit,
  top: rect.y * pixelsPerUnit,
  width: rect.width * pixelsPerUnit,
  height: rect.height * pixelsPerUnit
});

const getElementStyle = (element: TemplateElement, pixelsPerUnit: number): CSSProperties => ({
  left: element.position.x * pixelsPerUnit,
  top: element.position.y * pixelsPerUnit,
  width: element.size.width * pixelsPerUnit,
  height: element.size.height * pixelsPerUnit,
  zIndex: element.zIndex,
  color: element.style.color,
  backgroundColor: element.style.backgroundColor,
  fontSize: `${(element.style.fontSize || 10) * pixelsPerUnit * 0.35}px`,
  fontWeight: element.style.fontWeight,
  textAlign: element.style.textAlign,
  borderColor: element.style.borderColor,
  borderWidth: element.style.borderWidth,
  borderStyle: element.style.borderWidth ? 'solid' : undefined
});

const renderElementContent = (element: TemplateElement) => {
  if (element.type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE) {
    const tableConfig = element.tableConfig || createDefaultTableConfig();
    const columns = (tableConfig?.columns || [])
      .filter((column) => column.visible !== false)
      .slice(0, 8);
    const visibleColumns =
      columns.length > 0
        ? columns
        : [
            { key: 'reference', label: 'Ref', width: 20, align: 'left' as const },
            { key: 'name', label: 'Item', width: 64, align: 'left' as const },
            { key: 'quantity', label: 'Qty', width: 18, align: 'right' as const },
            { key: 'unitPrice', label: 'P.U', width: 26, align: 'right' as const },
            { key: 'totalTTC', label: 'TTC', width: 28, align: 'right' as const }
          ];
    const gridTemplateColumns = visibleColumns
      .map((column) => `${Math.max(Number(column.width || 16), 8)}fr`)
      .join(' ');
    const headerStyle = tableConfig?.headerStyle || {};
    const rowStyle = tableConfig?.rowStyle || {};

    return (
      <div
        className="h-full w-full overflow-hidden rounded border text-zinc-700"
        style={{
          borderColor: tableConfig?.borderColor || '#d4d4d8',
          borderWidth: tableConfig?.borderWidth || 1
        }}
      >
        <div
          className="grid border-b font-semibold"
          style={{
            gridTemplateColumns,
            backgroundColor: headerStyle.backgroundColor || '#111827',
            color: headerStyle.color || '#ffffff',
            fontSize: `${headerStyle.fontSize || 7}px`,
            borderColor: tableConfig?.borderColor || '#d4d4d8'
          }}
        >
          {visibleColumns.map((column) => (
            <span
              key={column.key}
              className="truncate px-1 py-0.5"
              style={{ textAlign: column.align || 'left' }}
            >
              {column.label}
            </span>
          ))}
        </div>
        <div
          className="grid"
          style={{
            gridTemplateColumns,
            backgroundColor: rowStyle.alternateBackgroundColor || '#f8fafc',
            color: rowStyle.color || '#111827',
            fontSize: `${rowStyle.fontSize || 7}px`
          }}
        >
          {visibleColumns.map((column) => (
            <span
              key={column.key}
              className="truncate px-1 py-0.5"
              style={{ textAlign: column.align || 'left' }}
            >
              {getTablePreviewValue(column.key)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (imageElementTypes.has(element.type)) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-500">
        {element.binding?.path || element.content || element.name}
      </div>
    );
  }

  return element.binding?.path ? `{{${element.binding.path}}}` : element.content || element.name;
};

const imageElementTypes = new Set<DOCUMENT_TEMPLATE_ELEMENT_TYPE>([
  DOCUMENT_TEMPLATE_ELEMENT_TYPE.IMAGE,
  DOCUMENT_TEMPLATE_ELEMENT_TYPE.LOGO,
  DOCUMENT_TEMPLATE_ELEMENT_TYPE.SIGNATURE,
  DOCUMENT_TEMPLATE_ELEMENT_TYPE.STAMP
]);

const getTablePreviewValue = (key: string) => {
  const values: Record<string, string> = {
    index: '1',
    reference: 'REF-001',
    name: 'Produit ou service',
    description: 'Description',
    quantity: '2',
    unit: 'U',
    unitPrice: '450,000',
    discount: '0%',
    taxRate: '19%',
    totalHT: '900,000',
    totalTTC: '1 071,000'
  };

  return values[key] || `items[].${key}`;
};
