import {
  TemplateElement,
  TemplatePageSettings,
  TemplateUnit
} from '@/types';
import { TemplateCanvasPoint, TemplateSelectionRect } from '../types/template-editor.types';

export const PDF_EDITOR_PX_PER_MM = 96 / 25.4;
export const MIN_ELEMENT_SIZE = 2;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const roundTemplateUnit = (value: number) => Math.round(value * 100) / 100;

export const getPixelsPerUnit = (zoom: number, unit: TemplateUnit = 'mm') => {
  if (unit === 'px') return zoom;
  if (unit === 'pt') return (96 / 72) * zoom;
  return PDF_EDITOR_PX_PER_MM * zoom;
};

export const getPageSize = (pageSettings: TemplatePageSettings) => ({
  width: Number(pageSettings.width || 210),
  height: Number(pageSettings.height || 297)
});

export const getPagePixelSize = (pageSettings: TemplatePageSettings, zoom: number) => {
  const pixelsPerUnit = getPixelsPerUnit(zoom, pageSettings.unit);
  const { width, height } = getPageSize(pageSettings);
  return {
    width: width * pixelsPerUnit,
    height: height * pixelsPerUnit
  };
};

export const getPageRect = (pageRef: { current: HTMLElement | null }) =>
  pageRef.current?.getBoundingClientRect() || null;

export const isPointInsidePage = ({
  clientX,
  clientY,
  pageRect
}: {
  clientX: number;
  clientY: number;
  pageRect: DOMRect;
}) =>
  clientX >= pageRect.left &&
  clientX <= pageRect.right &&
  clientY >= pageRect.top &&
  clientY <= pageRect.bottom;

export const screenPointToPagePoint = ({
  clientX,
  clientY,
  pageRect,
  zoom,
  pageSettings
}: {
  clientX: number;
  clientY: number;
  pageRect: DOMRect;
  zoom: number;
  scrollOffset?: { x: number; y: number };
  pageSettings: TemplatePageSettings;
}): TemplateCanvasPoint | null => {
  const xPx = clientX - pageRect.left;
  const yPx = clientY - pageRect.top;

  if (!isPointInsidePage({ clientX, clientY, pageRect })) {
    return null;
  }

  const pixelsPerUnit = getPixelsPerUnit(zoom, pageSettings.unit);
  const { width, height } = getPageSize(pageSettings);

  return {
    x: roundTemplateUnit(clamp(xPx / pixelsPerUnit, 0, width)),
    y: roundTemplateUnit(clamp(yPx / pixelsPerUnit, 0, height))
  };
};

export const clampElementToPage = (
  element: TemplateElement,
  pageSettings: TemplatePageSettings
): TemplateElement => {
  const page = getPageSize(pageSettings);
  const width = clamp(
    Number(element.size.width || MIN_ELEMENT_SIZE),
    MIN_ELEMENT_SIZE,
    page.width
  );
  const height = clamp(
    Number(element.size.height || MIN_ELEMENT_SIZE),
    MIN_ELEMENT_SIZE,
    page.height
  );

  return {
    ...element,
    position: {
      x: roundTemplateUnit(clamp(Number(element.position.x || 0), 0, page.width - width)),
      y: roundTemplateUnit(clamp(Number(element.position.y || 0), 0, page.height - height))
    },
    size: {
      width: roundTemplateUnit(width),
      height: roundTemplateUnit(height)
    },
    style: {
      ...element.style,
      fontSize: element.style.fontSize ? Math.max(1, element.style.fontSize) : element.style.fontSize,
      borderWidth:
        element.style.borderWidth !== undefined
          ? Math.max(0, element.style.borderWidth)
          : element.style.borderWidth
    }
  };
};

export const moveElementWithinPage = (
  element: TemplateElement,
  pageSettings: TemplatePageSettings,
  deltaX: number,
  deltaY: number
) =>
  clampElementToPage(
    {
      ...element,
      position: {
        x: element.position.x + deltaX,
        y: element.position.y + deltaY
      }
    },
    pageSettings
  );

export const resizeElementWithinPage = (
  element: TemplateElement,
  pageSettings: TemplatePageSettings,
  width: number,
  height: number
) =>
  clampElementToPage(
    {
      ...element,
      size: {
        width,
        height
      }
    },
    pageSettings
  );

export const normalizeSelectionRect = (
  start: TemplateCanvasPoint,
  end: TemplateCanvasPoint
): TemplateSelectionRect => ({
  x: roundTemplateUnit(Math.min(start.x, end.x)),
  y: roundTemplateUnit(Math.min(start.y, end.y)),
  width: roundTemplateUnit(Math.abs(end.x - start.x)),
  height: roundTemplateUnit(Math.abs(end.y - start.y))
});

export const elementIntersectsSelectionRect = (
  element: TemplateElement,
  rect: TemplateSelectionRect
) => {
  const elementLeft = element.position.x;
  const elementTop = element.position.y;
  const elementRight = element.position.x + element.size.width;
  const elementBottom = element.position.y + element.size.height;
  const rectRight = rect.x + rect.width;
  const rectBottom = rect.y + rect.height;

  return (
    elementLeft <= rectRight &&
    elementRight >= rect.x &&
    elementTop <= rectBottom &&
    elementBottom >= rect.y
  );
};

export const getElementsInSelectionRect = (
  elements: TemplateElement[],
  rect: TemplateSelectionRect,
  pageIndex = 0
) =>
  elements.filter(
    (element) =>
      element.visible &&
      (element.pageIndex || 0) === pageIndex &&
      elementIntersectsSelectionRect(element, rect)
  );

export const getElementsBoundingBox = (
  elements: TemplateElement[]
): TemplateSelectionRect | null => {
  if (!elements.length) return null;

  const left = Math.min(...elements.map((element) => element.position.x));
  const top = Math.min(...elements.map((element) => element.position.y));
  const right = Math.max(
    ...elements.map((element) => element.position.x + element.size.width)
  );
  const bottom = Math.max(
    ...elements.map((element) => element.position.y + element.size.height)
  );

  return {
    x: roundTemplateUnit(left),
    y: roundTemplateUnit(top),
    width: roundTemplateUnit(right - left),
    height: roundTemplateUnit(bottom - top)
  };
};

export const clampGroupMoveDelta = (
  elements: TemplateElement[],
  deltaX: number,
  deltaY: number,
  pageSettings: TemplatePageSettings
) => {
  const bounds = getElementsBoundingBox(elements);
  if (!bounds) return { x: 0, y: 0 };

  const page = getPageSize(pageSettings);
  return {
    x: roundTemplateUnit(
      clamp(deltaX, -bounds.x, page.width - (bounds.x + bounds.width))
    ),
    y: roundTemplateUnit(
      clamp(deltaY, -bounds.y, page.height - (bounds.y + bounds.height))
    )
  };
};

export const moveElementsByDelta = (
  elements: TemplateElement[],
  deltaX: number,
  deltaY: number
) =>
  elements.map((element) => ({
    ...element,
    position: {
      x: roundTemplateUnit(element.position.x + deltaX),
      y: roundTemplateUnit(element.position.y + deltaY)
    }
  }));

export const getSafeInsertionPoint = (
  pageSettings: TemplatePageSettings,
  elementCount: number
): TemplateCanvasPoint => {
  const page = getPageSize(pageSettings);
  const offset = (elementCount % 6) * 6;
  return {
    x: clamp(18 + offset, 0, page.width - 40),
    y: clamp(24 + offset, 0, page.height - 12)
  };
};
