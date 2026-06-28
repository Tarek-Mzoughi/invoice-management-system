import React from 'react';
import {
  DOCUMENT_TEMPLATE_ELEMENT_TYPE,
  DocumentTemplate,
  TemplateElement,
  TemplatePageSettings,
  TemplateSchema
} from '@/types';
import {
  TemplateCanvasPoint,
  TemplateRightTab,
  TemplateVariableDefinition
} from '../types/template-editor.types';
import {
  clampGroupMoveDelta,
  clampElementToPage,
  getSafeInsertionPoint,
  moveElementsByDelta,
  moveElementWithinPage,
  resizeElementWithinPage
} from '../utils/coordinates';
import { createTemplateElementAt, createVariableElementAt } from '../utils/element-defaults';

const DEFAULT_PAGE_SETTINGS: TemplatePageSettings = {
  format: 'A4',
  orientation: 'portrait',
  unit: 'mm',
  width: 210,
  height: 297,
  margin: { top: 12, right: 12, bottom: 12, left: 12 }
};

export const useTemplateEditorState = () => {
  const [templateId, setTemplateId] = React.useState<number>();
  const [schema, setSchema] = React.useState<TemplateSchema | null>(null);
  const [templateName, setTemplateNameState] = React.useState('');
  const [selectedElementId, setPrimarySelectedElementId] = React.useState<string>();
  const [selectedElementIds, setSelectedElementIdsState] = React.useState<string[]>([]);
  const [zoom, setZoom] = React.useState(1);
  const [showGrid, setShowGrid] = React.useState(true);
  const [activeRightTab, setActiveRightTab] = React.useState<TemplateRightTab>('properties');
  const [isDirty, setIsDirty] = React.useState(false);

  const loadTemplate = React.useCallback(
    (template: DocumentTemplate, options: { force?: boolean } = {}) => {
      if (!options.force && templateId === template.id && isDirty) return;

      const nextSchema = template.templateSchema;
      setTemplateId(template.id);
      setSchema(nextSchema);
      setTemplateNameState(template.name);
      const firstElementId = nextSchema?.elements?.[0]?.id;
      setPrimarySelectedElementId(firstElementId);
      setSelectedElementIdsState(firstElementId ? [firstElementId] : []);
      setActiveRightTab('properties');
      setIsDirty(false);
    },
    [isDirty, templateId]
  );

  const patchSchema = React.useCallback((updater: (current: TemplateSchema) => TemplateSchema) => {
    setSchema((current) => {
      if (!current) return current;
      setIsDirty(true);
      return updater(current);
    });
  }, []);

  const pageSettings = React.useMemo(
    () => schema?.pageSettings || DEFAULT_PAGE_SETTINGS,
    [schema?.pageSettings]
  );
  const elements = React.useMemo(() => schema?.elements || [], [schema?.elements]);

  React.useEffect(() => {
    setSelectedElementIdsState((current) => {
      const existingIds = new Set(elements.map((element) => element.id));
      const next = current.filter((id) => existingIds.has(id));
      setPrimarySelectedElementId((currentPrimary) => {
        if (currentPrimary && next.includes(currentPrimary)) return currentPrimary;
        return next[0];
      });
      return next;
    });
  }, [elements]);

  const primarySelectedElementId = selectedElementId;
  const selectedElements = React.useMemo(
    () => selectedElementIds
      .map((id) => elements.find((element) => element.id === id))
      .filter((element): element is TemplateElement => Boolean(element)),
    [elements, selectedElementIds]
  );

  const selectedElement = React.useMemo(
    () =>
      selectedElementIds.length === 1
        ? elements.find((element) => element.id === selectedElementIds[0])
        : undefined,
    [elements, selectedElementIds]
  );

  const selectOnlyElement = React.useCallback((id?: string) => {
    setPrimarySelectedElementId(id);
    setSelectedElementIdsState(id ? [id] : []);
  }, []);

  const setSelectedElementId = selectOnlyElement;
  const selectElement = selectOnlyElement;

  const setSelectedElementIds = React.useCallback((ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    setSelectedElementIdsState(uniqueIds);
    setPrimarySelectedElementId(uniqueIds[0]);
  }, []);

  const clearSelection = React.useCallback(() => {
    setPrimarySelectedElementId(undefined);
    setSelectedElementIdsState([]);
  }, []);

  const addElementToSelection = React.useCallback((id: string) => {
    setSelectedElementIdsState((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      setPrimarySelectedElementId((primary) => primary || id);
      return next;
    });
  }, []);

  const toggleElementSelection = React.useCallback((id: string) => {
    setSelectedElementIdsState((current) => {
      if (current.includes(id)) {
        const next = current.filter((selectedId) => selectedId !== id);
        setPrimarySelectedElementId((primary) =>
          primary === id ? next[0] : primary
        );
        return next;
      }
      const next = [...current, id];
      setPrimarySelectedElementId((primary) => primary || id);
      return next;
    });
  }, []);

  const selectAllOnPage = React.useCallback(
    (pageIndex = 0) => {
      const ids = elements
        .filter((element) => element.visible && (element.pageIndex || 0) === pageIndex)
        .map((element) => element.id);
      setSelectedElementIds(ids);
    },
    [elements, setSelectedElementIds]
  );

  const setTemplateName = React.useCallback((value: string) => {
    setTemplateNameState(value);
    setIsDirty(true);
  }, []);

  const setPageSettings = React.useCallback(
    (nextPageSettings: TemplatePageSettings) => {
      patchSchema((current) => ({
        ...current,
        pageSettings: nextPageSettings,
        elements: current.elements.map((element) => clampElementToPage(element, nextPageSettings))
      }));
    },
    [patchSchema]
  );

  const updateElement = React.useCallback(
    (nextElement: TemplateElement) => {
      patchSchema((current) => ({
        ...current,
        elements: current.elements.map((element) =>
          element.id === nextElement.id
            ? clampElementToPage(nextElement, current.pageSettings)
            : element
        )
      }));
    },
    [patchSchema]
  );

  const getNextZIndex = React.useCallback(
    (currentElements: TemplateElement[]) =>
      Math.max(0, ...currentElements.map((element) => element.zIndex || 0)) + 1,
    []
  );

  const addElement = React.useCallback(
    (type: DOCUMENT_TEMPLATE_ELEMENT_TYPE, point?: TemplateCanvasPoint) => {
      setSchema((current) => {
        if (!current) return current;
        const nextElement = createTemplateElementAt({
          type,
          point: point || getSafeInsertionPoint(current.pageSettings, current.elements.length),
          pageSettings: current.pageSettings,
          zIndex: getNextZIndex(current.elements)
        });
        selectOnlyElement(nextElement.id);
        setActiveRightTab('properties');
        setIsDirty(true);
        return { ...current, elements: [...current.elements, nextElement] };
      });
    },
    [getNextZIndex, selectOnlyElement]
  );

  const addVariableElement = React.useCallback(
    (variable: TemplateVariableDefinition, point?: TemplateCanvasPoint) => {
      setSchema((current) => {
        if (!current) return current;
        const nextElement = createVariableElementAt({
          variable,
          point: point || getSafeInsertionPoint(current.pageSettings, current.elements.length),
          pageSettings: current.pageSettings,
          zIndex: getNextZIndex(current.elements)
        });
        selectOnlyElement(nextElement.id);
        setActiveRightTab('properties');
        setIsDirty(true);
        return { ...current, elements: [...current.elements, nextElement] };
      });
    },
    [getNextZIndex, selectOnlyElement]
  );

  const deleteElement = React.useCallback((elementId: string) => {
    setSchema((current) => {
      if (!current) return current;
      const target = current.elements.find((element) => element.id === elementId);
      if (target?.locked) return current;
      setIsDirty(true);
      return {
        ...current,
        elements: current.elements.filter((element) => element.id !== elementId)
      };
    });
    setSelectedElementIdsState((current) => {
      const next = current.filter((id) => id !== elementId);
      setPrimarySelectedElementId((primary) =>
        primary === elementId ? next[0] : primary
      );
      return next;
    });
  }, []);

  const duplicateElement = React.useCallback(
    (elementId: string) => {
      setSchema((current) => {
        if (!current) return current;
        const element = current.elements.find((candidate) => candidate.id === elementId);
        if (!element) return current;
        const nextElement = clampElementToPage(
          {
            ...element,
            id: `element_${Date.now()}_${Math.round(Math.random() * 1000)}`,
            name: `${element.name} Copy`,
            position: { x: element.position.x + 6, y: element.position.y + 6 },
            locked: false,
            zIndex: getNextZIndex(current.elements)
          },
          current.pageSettings
        );
        selectOnlyElement(nextElement.id);
        setActiveRightTab('properties');
        setIsDirty(true);
        return { ...current, elements: [...current.elements, nextElement] };
      });
    },
    [getNextZIndex, selectOnlyElement]
  );

  const updateElements = React.useCallback(
    (nextElements: TemplateElement[]) => {
      const byId = new Map(nextElements.map((element) => [element.id, element]));
      patchSchema((current) => ({
        ...current,
        elements: current.elements.map((element) =>
          byId.has(element.id)
            ? clampElementToPage(byId.get(element.id) as TemplateElement, current.pageSettings)
            : element
        )
      }));
    },
    [patchSchema]
  );

  const moveElement = React.useCallback(
    (elementId: string, deltaX: number, deltaY: number) => {
      patchSchema((current) => ({
        ...current,
        elements: current.elements.map((element) =>
          element.id === elementId && !element.locked
            ? moveElementWithinPage(element, current.pageSettings, deltaX, deltaY)
            : element
        )
      }));
    },
    [patchSchema]
  );

  const moveSelectedElements = React.useCallback(
    (deltaX: number, deltaY: number) => {
      patchSchema((current) => {
        const selectedIds = new Set(selectedElementIds);
        const movableElements = current.elements.filter(
          (element) => selectedIds.has(element.id) && element.visible && !element.locked
        );
        const delta = clampGroupMoveDelta(
          movableElements,
          deltaX,
          deltaY,
          current.pageSettings
        );
        const movedById = new Map(
          moveElementsByDelta(movableElements, delta.x, delta.y).map((element) => [
            element.id,
            element
          ])
        );

        return {
          ...current,
          elements: current.elements.map((element) =>
            movedById.get(element.id) || element
          )
        };
      });
    },
    [patchSchema, selectedElementIds]
  );

  const resizeElement = React.useCallback(
    (elementId: string, width: number, height: number) => {
      patchSchema((current) => ({
        ...current,
        elements: current.elements.map((element) =>
          element.id === elementId && !element.locked
            ? resizeElementWithinPage(element, current.pageSettings, width, height)
            : element
        )
      }));
    },
    [patchSchema]
  );

  const deleteSelectedElements = React.useCallback(() => {
    setSchema((current) => {
      if (!current) return current;
      const selectedIds = new Set(selectedElementIds);
      const deletableIds = new Set(
        current.elements
          .filter((element) => selectedIds.has(element.id) && !element.locked)
          .map((element) => element.id)
      );
      if (!deletableIds.size) return current;
      setIsDirty(true);
      return {
        ...current,
        elements: current.elements.filter((element) => !deletableIds.has(element.id))
      };
    });
    setSelectedElementIdsState((current) => {
      const next = current.filter(
        (id) => !selectedElements.some((element) => element.id === id && !element.locked)
      );
      setPrimarySelectedElementId(next[0]);
      return next;
    });
  }, [selectedElementIds, selectedElements]);

  const duplicateSelectedElements = React.useCallback(() => {
    setSchema((current) => {
      if (!current) return current;
      const selectedIds = new Set(selectedElementIds);
      const selected = current.elements.filter((element) => selectedIds.has(element.id));
      if (!selected.length) return current;
      let nextZIndex = getNextZIndex(current.elements);
      const duplicates = selected.map((element, index) =>
        clampElementToPage(
          {
            ...element,
            id: `element_${Date.now()}_${index}_${Math.round(Math.random() * 1000)}`,
            name: `${element.name} Copy`,
            position: {
              x: element.position.x + 6,
              y: element.position.y + 6
            },
            locked: false,
            zIndex: nextZIndex++
          },
          current.pageSettings
        )
      );
      setSelectedElementIds(duplicates.map((element) => element.id));
      setActiveRightTab('properties');
      setIsDirty(true);
      return { ...current, elements: [...current.elements, ...duplicates] };
    });
  }, [getNextZIndex, selectedElementIds, setSelectedElementIds]);

  const patchSelectedElements = React.useCallback(
    (patch: Partial<TemplateElement>) => {
      patchSchema((current) => {
        const selectedIds = new Set(selectedElementIds);
        return {
          ...current,
          elements: current.elements.map((element) =>
            selectedIds.has(element.id) ? { ...element, ...patch } : element
          )
        };
      });
    },
    [patchSchema, selectedElementIds]
  );

  const lockSelectedElements = React.useCallback(
    () => patchSelectedElements({ locked: true }),
    [patchSelectedElements]
  );
  const unlockSelectedElements = React.useCallback(
    () => patchSelectedElements({ locked: false }),
    [patchSelectedElements]
  );
  const hideSelectedElements = React.useCallback(
    () => patchSelectedElements({ visible: false }),
    [patchSelectedElements]
  );
  const showSelectedElements = React.useCallback(
    () => patchSelectedElements({ visible: true }),
    [patchSelectedElements]
  );

  const alignSelectedElements = React.useCallback(
    (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      patchSchema((current) => {
        const selectedIds = new Set(selectedElementIds);
        const selected = current.elements.filter((element) => selectedIds.has(element.id));
        const movable = selected.filter((element) => !element.locked);
        if (movable.length < 2) return current;
        const left = Math.min(...selected.map((element) => element.position.x));
        const top = Math.min(...selected.map((element) => element.position.y));
        const right = Math.max(...selected.map((element) => element.position.x + element.size.width));
        const bottom = Math.max(...selected.map((element) => element.position.y + element.size.height));
        const centerX = left + (right - left) / 2;
        const centerY = top + (bottom - top) / 2;

        return {
          ...current,
          elements: current.elements.map((element) => {
            if (!selectedIds.has(element.id) || element.locked) return element;
            const position = { ...element.position };
            if (alignment === 'left') position.x = left;
            if (alignment === 'center') position.x = centerX - element.size.width / 2;
            if (alignment === 'right') position.x = right - element.size.width;
            if (alignment === 'top') position.y = top;
            if (alignment === 'middle') position.y = centerY - element.size.height / 2;
            if (alignment === 'bottom') position.y = bottom - element.size.height;
            return clampElementToPage({ ...element, position }, current.pageSettings);
          })
        };
      });
    },
    [patchSchema, selectedElementIds]
  );

  const bindVariable = React.useCallback(
    (variable: string) => {
      if (!selectedElement) return;
      updateElement({
        ...selectedElement,
        type:
          selectedElement.type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.TEXT
            ? DOCUMENT_TEMPLATE_ELEMENT_TYPE.DYNAMIC_TEXT
            : selectedElement.type,
        binding: { ...selectedElement.binding, path: variable }
      });
    },
    [selectedElement, updateElement]
  );

  const buildSaveSchema = React.useCallback(() => {
    if (!schema) return null;
    return {
      ...schema,
      metadata: {
        ...schema.metadata,
        name: templateName,
        updatedAt: new Date().toISOString()
      }
    };
  }, [schema, templateName]);

  const markClean = React.useCallback(() => setIsDirty(false), []);

  return {
    templateId,
    schema,
    elements,
    pageSettings,
    selectedElement,
    selectedElementId,
    selectedElementIds,
    primarySelectedElementId,
    selectedElements,
    templateName,
    zoom,
    showGrid,
    activeRightTab,
    isDirty,
    canSave: !!schema && isDirty && !!templateName.trim(),
    loadTemplate,
    setTemplateName,
    setSelectedElementId,
    setSelectedElementIds,
    selectElement,
    selectOnlyElement,
    toggleElementSelection,
    addElementToSelection,
    clearSelection,
    selectAllOnPage,
    setZoom,
    setShowGrid,
    setActiveRightTab,
    setPageSettings,
    updateElement,
    updateElements,
    addElement,
    addVariableElement,
    deleteElement,
    duplicateElement,
    deleteSelectedElements,
    duplicateSelectedElements,
    moveElement,
    moveSelectedElements,
    resizeElement,
    lockSelectedElements,
    unlockSelectedElements,
    hideSelectedElements,
    showSelectedElements,
    alignSelectedElements,
    bindVariable,
    buildSaveSchema,
    markClean
  };
};
