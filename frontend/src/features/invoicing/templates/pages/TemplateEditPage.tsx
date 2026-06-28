import React from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { DOCUMENT_TEMPLATE_STATUS } from '@/types';
import { TemplateCanvasToolbar } from '../components/TemplateCanvasToolbar';
import { TemplateDocumentTypeSelector } from '../components/TemplateDocumentTypeSelector';
import { TemplateEditorCanvas } from '../components/TemplateEditorCanvas';
import { TemplateElementsPanel } from '../components/TemplateElementsPanel';
import { TemplateHeader } from '../components/TemplateHeader';
import { TemplateLayersPanel } from '../components/TemplateLayersPanel';
import { TemplatePreviewModal } from '../components/TemplatePreviewModal';
import { TemplatePropertiesPanel } from '../components/TemplatePropertiesPanel';
import { TemplateVariablesPanel } from '../components/TemplateVariablesPanel';
import { TemplateVersionHistory } from '../components/TemplateVersionHistory';
import { useTemplateDragAndDrop } from '../hooks/useTemplateDragAndDrop';
import { useTemplateEditorState } from '../hooks/useTemplateEditorState';
import { useTemplateKeyboardShortcuts } from '../hooks/useTemplateKeyboardShortcuts';
import { useTemplateZoom } from '../hooks/useTemplateZoom';
import type { TemplateRightTab } from '../types/template-editor.types';
import { validateTemplateForPublish } from '../utils/template-validation';

interface TemplateEditPageProps {
  id: number;
}

export const TemplateEditPage = ({ id }: TemplateEditPageProps) => {
  const router = useRouter();
  const { t: tSettings } = useTranslation('settings');
  const queryClient = useQueryClient();
  const editor = useTemplateEditorState();
  const { loadTemplate, templateId } = editor;
  const pageRef = React.useRef<HTMLDivElement | null>(null);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewBlob, setPreviewBlob] = React.useState<Blob | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = React.useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = React.useState(false);

  const { data: template, isPending } = useQuery({
    queryKey: ['document-template', id],
    queryFn: () => api.documentTemplate.findOne(id),
    enabled: Number.isFinite(id)
  });

  const { data: versions = [], refetch: refetchVersions } = useQuery({
    queryKey: ['document-template-versions', id],
    queryFn: () => api.documentTemplate.findVersions(id),
    enabled: Number.isFinite(id)
  });

  React.useEffect(() => {
    if (!template || templateId === template.id) return;
    loadTemplate(template);
  }, [loadTemplate, template, templateId]);

  const { fitWidth } = useTemplateZoom({
    pageSettings: editor.pageSettings,
    viewportRef,
    onZoomChange: editor.setZoom
  });

  const dragAndDrop = useTemplateDragAndDrop({
    pageRef,
    pageSettings: editor.pageSettings,
    zoom: editor.zoom,
    onAddElement: editor.addElement,
    onAddVariable: editor.addVariableElement
  });

  useTemplateKeyboardShortcuts({
    selectedElements: editor.selectedElements,
    onMoveSelectedElements: editor.moveSelectedElements,
    onDeleteSelectedElements: editor.deleteSelectedElements,
    onDuplicateSelectedElements: editor.duplicateSelectedElements,
    onClearSelection: editor.clearSelection,
    onSelectAllOnPage: editor.selectAllOnPage
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['document-template', id] });
    await queryClient.invalidateQueries({ queryKey: ['document-templates'] });
    await refetchVersions();
  };

  const { mutate: saveTemplate, isPending: saving } = useMutation({
    mutationFn: (status?: DOCUMENT_TEMPLATE_STATUS) => {
      if (!template) throw new Error('Template is not loaded');
      const nextSchema = editor.buildSaveSchema();
      if (!nextSchema) throw new Error('Template schema is not loaded');

      return api.documentTemplate.update(template.id, {
        name: editor.templateName,
        documentType: template.documentType,
        status: status || template.status,
        templateSchema: nextSchema,
        pageSettings: nextSchema.pageSettings,
        variablesConfig: nextSchema.variables
      });
    },
    onSuccess: async (savedTemplate) => {
      toast.success(tSettings('pdf_editor.messages.save_success'));
      editor.loadTemplate(savedTemplate, { force: true });
      await invalidate();
    },
    onError: (error) => toast.error(getErrorMessage('settings', error, tSettings('pdf_editor.messages.save_error')))
  });

  const { mutate: previewTemplate, isPending: previewing } = useMutation({
    mutationFn: () => {
      const nextSchema = editor.buildSaveSchema();
      return api.documentTemplate.preview(id, {
        persist: false,
        templateSchema: nextSchema || undefined
      });
    },
    onSuccess: (blob) => {
      setPreviewBlob(blob);
      setPreviewOpen(true);
    },
    onError: (error) => toast.error(getErrorMessage('settings', error, tSettings('pdf_editor.messages.preview_error')))
  });

  const { mutate: generatePdf, isPending: generating } = useMutation({
    mutationFn: () => {
      if (editor.isDirty) {
        throw new Error(tSettings('pdf_editor.messages.save_before_generate'));
      }
      return api.documentTemplate.generatePdf(id, { persist: true }, `${editor.templateName || 'template'}.pdf`);
    },
    onSuccess: () => toast.success(tSettings('pdf_editor.messages.generate_success')),
    onError: (error) => toast.error(getErrorMessage('settings', error, tSettings('pdf_editor.messages.generate_error')))
  });

  const { mutate: setDefault, isPending: settingDefault } = useMutation({
    mutationFn: () => {
      if (editor.isDirty) {
        throw new Error(tSettings('pdf_editor.messages.save_before_default'));
      }
      return api.documentTemplate.setDefault(id);
    },
    onSuccess: async () => {
      toast.success(tSettings('pdf_editor.messages.set_default_success'));
      await invalidate();
    },
    onError: (error) => toast.error(getErrorMessage('settings', error, tSettings('pdf_editor.messages.set_default_error')))
  });

  const {
    mutate: restoreVersion,
    isPending: restoring,
    variables: restoringVersionId
  } = useMutation({
    mutationFn: (versionId: number) => api.documentTemplate.restoreVersion(id, versionId),
    onSuccess: async (restored) => {
      toast.success(tSettings('pdf_editor.messages.restore_success'));
      editor.loadTemplate(restored, { force: true });
      await invalidate();
    },
    onError: (error) => toast.error(getErrorMessage('settings', error, tSettings('pdf_editor.messages.restore_error')))
  });

  const publishTemplate = () => {
    if (!template) return;
    const validation = validateTemplateForPublish({
      name: editor.templateName,
      documentType: template.documentType,
      schema: editor.schema
    });

    if (validation.errors.length) {
      toast.error(validation.errors[0]);
      return;
    }

    if (validation.warnings.length) {
      toast.warning(validation.warnings[0]);
    }

    saveTemplate(DOCUMENT_TEMPLATE_STATUS.PUBLISHED);
  };

  if (isPending || !template || !editor.schema) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Spinner show />
      </div>
    );
  }

  const editorGridColumns = `${leftPanelCollapsed ? '48px' : '280px'} minmax(0,1fr) ${
    rightPanelCollapsed ? '48px' : '360px'
  }`;

  return (
    <DndContext
      sensors={dragAndDrop.sensors}
      onDragStart={dragAndDrop.handleDragStart}
      onDragEnd={dragAndDrop.handleDragEnd}
      onDragCancel={dragAndDrop.handleDragCancel}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <TemplateHeader
          templateName={editor.templateName}
          status={template.status}
          isDirty={editor.isDirty}
          canSave={editor.canSave}
          canSetDefault={!template.isDefault && template.status === DOCUMENT_TEMPLATE_STATUS.PUBLISHED}
          saving={saving || settingDefault}
          previewing={previewing}
          generating={generating}
          onBack={() => router.push('/settings/pdf/templates')}
          onSaveDraft={() => saveTemplate(DOCUMENT_TEMPLATE_STATUS.DRAFT)}
          onPublish={publishTemplate}
          onPreview={() => previewTemplate()}
          onGeneratePdf={() => generatePdf()}
          onSetDefault={() => setDefault()}
        />

        <div
          className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto transition-[grid-template-columns] duration-200 lg:[grid-template-columns:var(--template-editor-columns)] lg:overflow-hidden"
          style={
            {
              '--template-editor-columns': editorGridColumns
            } as React.CSSProperties
          }
        >
          <aside
            className={cn(
              'min-h-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:border-b-0 lg:border-r',
              leftPanelCollapsed
                ? 'overflow-hidden p-2'
                : 'overflow-y-auto overflow-x-hidden p-4'
            )}
          >
            {leftPanelCollapsed ? (
              <div className="flex h-full min-h-[96px] items-start justify-center pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  title="Open left panel"
                  onClick={() => setLeftPanelCollapsed(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-5 pb-8">
                <section className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/30">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Template information
                    </h2>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      title="Collapse left panel"
                      onClick={() => setLeftPanelCollapsed(true)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input
                      value={editor.templateName}
                      onChange={(event) => editor.setTemplateName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Document type</Label>
                    <TemplateDocumentTypeSelector
                      value={template.documentType}
                      onChange={() => undefined}
                      disabled
                    />
                  </div>
                </section>
                <TemplateElementsPanel onAddElement={editor.addElement} />
              </div>
            )}
          </aside>

          <main className="flex min-h-[640px] flex-col overflow-hidden lg:min-h-0">
            <TemplateCanvasToolbar
              pageSettings={editor.pageSettings}
              zoom={editor.zoom}
              showGrid={editor.showGrid}
              onZoomChange={editor.setZoom}
              onFitWidth={fitWidth}
              onToggleGrid={editor.setShowGrid}
              onPageSettingsChange={editor.setPageSettings}
            />
            <TemplateEditorCanvas
              pageSettings={editor.pageSettings}
              elements={editor.elements}
              selectedElementId={editor.selectedElementId}
              selectedElementIds={editor.selectedElementIds}
              zoom={editor.zoom}
              showGrid={editor.showGrid}
              pageRef={pageRef}
              viewportRef={viewportRef}
              onSelectElement={editor.selectOnlyElement}
              onToggleElementSelection={editor.toggleElementSelection}
              onAddElementToSelection={editor.addElementToSelection}
              onSetSelectedElementIds={editor.setSelectedElementIds}
              onClearSelection={editor.clearSelection}
              onUpdateElement={editor.updateElement}
              onUpdateElements={editor.updateElements}
            />
          </main>

          <aside className="flex min-h-[520px] flex-col overflow-hidden border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:min-h-0 lg:border-l lg:border-t-0">
            {rightPanelCollapsed ? (
              <div className="flex h-full min-h-[96px] items-start justify-center p-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  title="Open right panel"
                  onClick={() => setRightPanelCollapsed(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Tabs
                value={editor.activeRightTab}
                onValueChange={(value) => editor.setActiveRightTab(value as TemplateRightTab)}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="shrink-0 border-b border-zinc-200 bg-white p-4 pb-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center gap-2">
                    <TabsList className="grid min-w-0 flex-1 grid-cols-4 rounded-md border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                      <TabsTrigger value="properties">Props</TabsTrigger>
                      <TabsTrigger value="variables">Vars</TabsTrigger>
                      <TabsTrigger value="layers">Layers</TabsTrigger>
                      <TabsTrigger value="versions">History</TabsTrigger>
                    </TabsList>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      title="Collapse right panel"
                      onClick={() => setRightPanelCollapsed(true)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              <TabsContent value="properties" className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4 data-[state=inactive]:hidden">
                <TemplatePropertiesPanel
                  element={editor.selectedElement}
                  selectedElements={editor.selectedElements}
                  pageSettings={editor.pageSettings}
                  onUpdateElement={editor.updateElement}
                  onDeleteElement={editor.deleteElement}
                  onDuplicateElement={editor.duplicateElement}
                  onMoveSelectedElements={editor.moveSelectedElements}
                  onDeleteSelectedElements={editor.deleteSelectedElements}
                  onDuplicateSelectedElements={editor.duplicateSelectedElements}
                  onLockSelectedElements={editor.lockSelectedElements}
                  onUnlockSelectedElements={editor.unlockSelectedElements}
                  onHideSelectedElements={editor.hideSelectedElements}
                  onShowSelectedElements={editor.showSelectedElements}
                  onAlignSelectedElements={editor.alignSelectedElements}
                />
              </TabsContent>
              <TabsContent value="variables" className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4 data-[state=inactive]:hidden">
                <TemplateVariablesPanel
                  documentType={template.documentType}
                  selectedElement={editor.selectedElement}
                  onBindVariable={editor.bindVariable}
                  onInsertVariable={editor.addVariableElement}
                />
              </TabsContent>
              <TabsContent value="layers" className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4 data-[state=inactive]:hidden">
                <TemplateLayersPanel
                  elements={editor.elements}
                  selectedElementId={editor.selectedElementId}
                  selectedElementIds={editor.selectedElementIds}
                  onSelectElement={editor.selectOnlyElement}
                  onToggleElementSelection={editor.toggleElementSelection}
                  onAddElementToSelection={editor.addElementToSelection}
                  onUpdateElement={editor.updateElement}
                  onDuplicateElement={editor.duplicateElement}
                  onDeleteElement={editor.deleteElement}
                  onDuplicateSelectedElements={editor.duplicateSelectedElements}
                  onDeleteSelectedElements={editor.deleteSelectedElements}
                  onLockSelectedElements={editor.lockSelectedElements}
                  onUnlockSelectedElements={editor.unlockSelectedElements}
                  onHideSelectedElements={editor.hideSelectedElements}
                  onShowSelectedElements={editor.showSelectedElements}
                />
              </TabsContent>
              <TabsContent value="versions" className="mt-0 min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4 data-[state=inactive]:hidden">
                <TemplateVersionHistory
                  versions={versions}
                  restoringVersionId={restoring ? restoringVersionId : undefined}
                  onRestoreVersion={restoreVersion}
                />
              </TabsContent>
              </Tabs>
            )}
          </aside>
        </div>

        <TemplatePreviewModal
          open={previewOpen}
          loading={previewing}
          previewBlob={previewBlob}
          filename={`${editor.templateName || 'template'}-preview.pdf`}
          onClose={() => setPreviewOpen(false)}
        />
      </div>

      <DragOverlay>
        {dragAndDrop.activeDragData ? (
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            {dragAndDrop.activeDragData.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof responseData === 'string') return responseData;
  if (responseData && typeof responseData === 'object') {
    const message = (responseData as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
};
