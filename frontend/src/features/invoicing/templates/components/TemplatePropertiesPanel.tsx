import type React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Copy, Eye, EyeOff, Lock, Trash2, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  createDefaultTableConfig,
  DOCUMENT_TEMPLATE_ELEMENT_TYPE,
  TemplateElement,
  TemplatePageSettings,
  TemplateTableColumn,
  TemplateTableConfig
} from '@/types';
import { getElementsBoundingBox, getPageSize } from '../utils/coordinates';
import { useTranslation } from 'react-i18next';

interface TemplatePropertiesPanelProps {
  element?: TemplateElement;
  selectedElements?: TemplateElement[];
  pageSettings: TemplatePageSettings;
  onUpdateElement: (element: TemplateElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onMoveSelectedElements?: (deltaX: number, deltaY: number) => void;
  onDeleteSelectedElements?: () => void;
  onDuplicateSelectedElements?: () => void;
  onLockSelectedElements?: () => void;
  onUnlockSelectedElements?: () => void;
  onHideSelectedElements?: () => void;
  onShowSelectedElements?: () => void;
  onAlignSelectedElements?: (
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ) => void;
}

export const TemplatePropertiesPanel = ({
  element,
  selectedElements = element ? [element] : [],
  pageSettings,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onMoveSelectedElements,
  onDeleteSelectedElements,
  onDuplicateSelectedElements,
  onLockSelectedElements,
  onUnlockSelectedElements,
  onHideSelectedElements,
  onShowSelectedElements,
  onAlignSelectedElements
}: TemplatePropertiesPanelProps) => {
  const { t: tSettings } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  if (selectedElements.length > 1) {
    return (
      <MultiSelectionPanel
        elements={selectedElements}
        onMoveSelectedElements={onMoveSelectedElements}
        onDeleteSelectedElements={onDeleteSelectedElements}
        onDuplicateSelectedElements={onDuplicateSelectedElements}
        onLockSelectedElements={onLockSelectedElements}
        onUnlockSelectedElements={onUnlockSelectedElements}
        onHideSelectedElements={onHideSelectedElements}
        onShowSelectedElements={onShowSelectedElements}
        onAlignSelectedElements={onAlignSelectedElements}
        tSettings={tSettings}
      />
    );
  }

  if (!element) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30">
        <p className="font-medium text-zinc-700 dark:text-zinc-200">{tSettings('pdf_editor.right_panel.props.no_selection')}</p>
        <p className="mt-1 text-xs">{tSettings('pdf_editor.right_panel.props.select_to_edit')}</p>
      </div>
    );
  }

  const page = getPageSize(pageSettings);
  const update = (patch: Partial<TemplateElement>) => onUpdateElement({ ...element, ...patch });
  const updateStyle = (patch: Partial<TemplateElement['style']>) =>
    update({ style: { ...element.style, ...patch } });
  const tableConfig = getNormalizedTableConfig(element.tableConfig);
  const updateTableConfig = (patch: Partial<TemplateTableConfig>) =>
    update({ tableConfig: { ...tableConfig, ...patch } });
  const updateTableColumn = (index: number, patch: Partial<TemplateTableColumn>) =>
    updateTableConfig({
      columns: tableConfig.columns.map((column, columnIndex) =>
        columnIndex === index ? { ...column, ...patch } : column
      )
    });

  return (
    <div className="space-y-3 pb-2">
      <PanelSection title={tSettings('pdf_editor.right_panel.props.sections.basic')}>
        <Field label={tSettings('pdf_editor.right_panel.props.fields.layer_name')}>
          <Input value={element.name} onChange={(event) => update({ name: event.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <ToggleField
            label={tSettings('pdf_editor.right_panel.props.fields.visible')}
            checked={element.visible}
            onCheckedChange={(visible) => update({ visible })}
            icon={
              element.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />
            }
          />
          <ToggleField
            label={tSettings('pdf_editor.right_panel.props.fields.locked')}
            checked={element.locked}
            onCheckedChange={(locked) => update({ locked })}
            icon={
              element.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />
            }
          />
        </div>
      </PanelSection>

      <PanelSection title={tSettings('pdf_editor.right_panel.props.sections.content')}>
        <Field label={tSettings('pdf_editor.right_panel.props.fields.text_content')}>
          <Textarea
            value={element.content || ''}
            onChange={(event) => update({ content: event.target.value })}
            rows={3}
          />
        </Field>
        <Field label={tSettings('pdf_editor.right_panel.props.fields.variable_binding')}>
          <Input
            value={element.binding?.path || ''}
            onChange={(event) =>
              update({ binding: { ...element.binding, path: event.target.value } })
            }
            placeholder="company.name"
          />
        </Field>
      </PanelSection>

      <PanelSection title={tSettings('pdf_editor.right_panel.props.sections.position_size')}>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label={tSettings('pdf_editor.right_panel.props.fields.x')}
            value={element.position.x}
            min={0}
            max={page.width - element.size.width}
            onChange={(value) => update({ position: { ...element.position, x: value } })}
          />
          <NumberField
            label={tSettings('pdf_editor.right_panel.props.fields.y')}
            value={element.position.y}
            min={0}
            max={page.height - element.size.height}
            onChange={(value) => update({ position: { ...element.position, y: value } })}
          />
          <NumberField
            label={tSettings('pdf_editor.right_panel.props.fields.width')}
            value={element.size.width}
            min={1}
            max={page.width}
            onChange={(value) => update({ size: { ...element.size, width: value } })}
          />
          <NumberField
            label={tSettings('pdf_editor.right_panel.props.fields.height')}
            value={element.size.height}
            min={1}
            max={page.height}
            onChange={(value) => update({ size: { ...element.size, height: value } })}
          />
          <NumberField
            label={tSettings('pdf_editor.right_panel.props.fields.layer_depth')}
            value={element.zIndex}
            min={0}
            onChange={(value) => update({ zIndex: value })}
          />
        </div>
      </PanelSection>

      <PanelSection title={tSettings('pdf_editor.right_panel.props.sections.typography')}>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label={tSettings('pdf_editor.right_panel.props.fields.font_size')}
            value={element.style.fontSize || 10}
            min={1}
            onChange={(value) => updateStyle({ fontSize: value })}
          />
          <Field label={tSettings('pdf_editor.right_panel.props.fields.weight')}>
            <Select
              value={element.style.fontWeight || '400'}
              onValueChange={(fontWeight) => updateStyle({ fontWeight })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="400">{tSettings('pdf_editor.right_panel.props.options.regular')}</SelectItem>
                <SelectItem value="500">{tSettings('pdf_editor.right_panel.props.options.medium')}</SelectItem>
                <SelectItem value="600">{tSettings('pdf_editor.right_panel.props.options.semibold')}</SelectItem>
                <SelectItem value="700">{tSettings('pdf_editor.right_panel.props.options.bold')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={tSettings('pdf_editor.right_panel.props.fields.align')}>
            <Select
              value={element.style.textAlign || 'left'}
              onValueChange={(textAlign) =>
                updateStyle({ textAlign: textAlign as TemplateElement['style']['textAlign'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">{tSettings('pdf_editor.right_panel.props.options.left')}</SelectItem>
                <SelectItem value="center">{tSettings('pdf_editor.right_panel.props.options.center')}</SelectItem>
                <SelectItem value="right">{tSettings('pdf_editor.right_panel.props.options.right')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </PanelSection>

      <PanelSection title={tSettings('pdf_editor.right_panel.props.sections.colors')}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={tSettings('pdf_editor.right_panel.props.fields.text_color')}>
            <Input
              type="color"
              value={element.style.color || '#111827'}
              onChange={(event) => updateStyle({ color: event.target.value })}
            />
          </Field>
          <Field label={tSettings('pdf_editor.right_panel.props.fields.fill_color')}>
            <Input
              type="color"
              value={element.style.backgroundColor || '#ffffff'}
              onChange={(event) => updateStyle({ backgroundColor: event.target.value })}
            />
          </Field>
        </div>
      </PanelSection>

      <PanelSection title={tSettings('pdf_editor.right_panel.props.sections.border')}>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label={tSettings('pdf_editor.right_panel.props.fields.width')}
            value={element.style.borderWidth || 0}
            min={0}
            onChange={(value) => updateStyle({ borderWidth: value })}
          />
          <Field label={tSettings('pdf_editor.right_panel.props.fields.border_color')}>
            <Input
              type="color"
              value={element.style.borderColor || '#d4d4d8'}
              onChange={(event) => updateStyle({ borderColor: event.target.value })}
            />
          </Field>
        </div>
      </PanelSection>

      {element.type === DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE ? (
        <PanelSection title={tSettings('pdf_editor.right_panel.props.sections.table_design')}>
          <Field label={tSettings('pdf_editor.right_panel.props.fields.data_binding')}>
            <Input
              value={tableConfig.binding || element.binding?.path || 'items'}
              onChange={(event) => {
                const binding = event.target.value || 'items';
                update({
                  binding: { ...element.binding, path: binding },
                  tableConfig: { ...tableConfig, binding }
                });
              }}
              placeholder="items"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={tSettings('pdf_editor.right_panel.props.fields.header_fill')}>
              <Input
                type="color"
                value={tableConfig.headerStyle.backgroundColor || '#111827'}
                onChange={(event) =>
                  updateTableConfig({
                    headerStyle: {
                      ...tableConfig.headerStyle,
                      backgroundColor: event.target.value
                    }
                  })
                }
              />
            </Field>
            <Field label={tSettings('pdf_editor.right_panel.props.fields.header_text')}>
              <Input
                type="color"
                value={tableConfig.headerStyle.color || '#ffffff'}
                onChange={(event) =>
                  updateTableConfig({
                    headerStyle: {
                      ...tableConfig.headerStyle,
                      color: event.target.value
                    }
                  })
                }
              />
            </Field>
            <NumberField
              label={tSettings('pdf_editor.right_panel.props.fields.row_height')}
              value={tableConfig.rowHeight || 10}
              min={6}
              max={18}
              onChange={(rowHeight) => updateTableConfig({ rowHeight })}
            />
            <NumberField
              label={tSettings('pdf_editor.right_panel.props.fields.padding')}
              value={tableConfig.padding || 1.5}
              min={0}
              max={5}
              onChange={(padding) => updateTableConfig({ padding })}
            />
            <NumberField
              label={tSettings('pdf_editor.right_panel.props.fields.row_font')}
              value={tableConfig.rowStyle.fontSize || 7}
              min={5}
              max={14}
              onChange={(fontSize) =>
                updateTableConfig({
                  rowStyle: { ...tableConfig.rowStyle, fontSize }
                })
              }
            />
            <Field label={tSettings('pdf_editor.right_panel.props.fields.border_color')}>
              <Input
                type="color"
                value={tableConfig.borderColor || '#d4d4d8'}
                onChange={(event) => updateTableConfig({ borderColor: event.target.value })}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{tSettings('pdf_editor.right_panel.props.sections.columns')}</p>
            {tableConfig.columns.map((column, index) => (
              <div
                key={`${column.key}-${index}`}
                className="grid grid-cols-[1fr_72px_44px] items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50/60 p-2 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <div className="min-w-0">
                  <Input
                    value={column.label}
                    onChange={(event) => updateTableColumn(index, { label: event.target.value })}
                    className="h-8"
                  />
                  <p className="mt-1 truncate text-[11px] text-zinc-500">{column.key}</p>
                </div>
                <Input
                  type="number"
                  value={Number.isFinite(column.width) ? column.width : 16}
                  min={6}
                  step="1"
                  onChange={(event) =>
                    updateTableColumn(index, { width: Number(event.target.value || 6) })
                  }
                  className="h-8"
                />
                <Switch
                  checked={column.visible !== false}
                  onCheckedChange={(visible) => updateTableColumn(index, { visible })}
                />
              </div>
            ))}
          </div>
        </PanelSection>
      ) : null}

      <PanelSection title={tSettings('pdf_editor.right_panel.props.sections.actions')}>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => onDuplicateElement(element.id)}>
            <Copy className="h-4 w-4" />
            {tSettings('pdf_editor.right_panel.layers.tooltips.duplicate')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => onDeleteElement(element.id)}
            disabled={element.locked}
          >
            <Trash2 className="h-4 w-4" />
            {tSettings('pdf_editor.right_panel.layers.tooltips.delete')}
          </Button>
        </div>
      </PanelSection>
    </div>
  );
};

const MultiSelectionPanel = ({
  elements,
  onMoveSelectedElements,
  onDeleteSelectedElements,
  onDuplicateSelectedElements,
  onLockSelectedElements,
  onUnlockSelectedElements,
  onHideSelectedElements,
  onShowSelectedElements,
  onAlignSelectedElements,
  tSettings
}: {
  elements: TemplateElement[];
  onMoveSelectedElements?: (deltaX: number, deltaY: number) => void;
  onDeleteSelectedElements?: () => void;
  onDuplicateSelectedElements?: () => void;
  onLockSelectedElements?: () => void;
  onUnlockSelectedElements?: () => void;
  onHideSelectedElements?: () => void;
  onShowSelectedElements?: () => void;
  onAlignSelectedElements?: (
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ) => void;
  tSettings: any;
}) => {
  const bounds = getElementsBoundingBox(elements);
  const lockedCount = elements.filter((element) => element.locked).length;
  const visibleCount = elements.filter((element) => element.visible).length;

  return (
    <div className="space-y-3 pb-2">
      <PanelSection title={tSettings('pdf_editor.right_panel.props.sections.selection')}>
        <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
          <p className="font-medium">{tSettings('pdf_editor.right_panel.props.multi_selection.elements_selected', { count: elements.length })}</p>
          <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-200">
            {tSettings('pdf_editor.right_panel.props.multi_selection.status_summary', { visible: visibleCount, locked: lockedCount })}
          </p>
        </div>
        {bounds ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Metric label={tSettings('pdf_editor.right_panel.props.fields.x')} value={bounds.x} />
            <Metric label={tSettings('pdf_editor.right_panel.props.fields.y')} value={bounds.y} />
            <Metric label={tSettings('pdf_editor.right_panel.props.fields.width')} value={bounds.width} />
            <Metric label={tSettings('pdf_editor.right_panel.props.fields.height')} value={bounds.height} />
          </div>
        ) : null}
      </PanelSection>

      <PanelSection title={tSettings('pdf_editor.right_panel.props.sections.move')}>
        <div className="grid grid-cols-3 gap-2">
          <span />
          <Button variant="outline" size="icon" onClick={() => onMoveSelectedElements?.(0, -1)}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <span />
          <Button variant="outline" size="icon" onClick={() => onMoveSelectedElements?.(-1, 0)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onMoveSelectedElements?.(0, 1)}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onMoveSelectedElements?.(1, 0)}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </PanelSection>

      <PanelSection title={tSettings('pdf_editor.right_panel.props.sections.align')}>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => onAlignSelectedElements?.('left')} className="text-xs">
            {tSettings('pdf_editor.right_panel.props.options.left')}
          </Button>
          <Button variant="outline" onClick={() => onAlignSelectedElements?.('center')} className="text-xs">
            {tSettings('pdf_editor.right_panel.props.options.center')}
          </Button>
          <Button variant="outline" onClick={() => onAlignSelectedElements?.('right')} className="text-xs">
            {tSettings('pdf_editor.right_panel.props.options.right')}
          </Button>
          <Button variant="outline" onClick={() => onAlignSelectedElements?.('top')} className="text-xs">
            {tSettings('pdf_editor.right_panel.props.options.top')}
          </Button>
          <Button variant="outline" onClick={() => onAlignSelectedElements?.('middle')} className="text-xs">
            {tSettings('pdf_editor.right_panel.props.options.middle')}
          </Button>
          <Button variant="outline" onClick={() => onAlignSelectedElements?.('bottom')} className="text-xs">
            {tSettings('pdf_editor.right_panel.props.options.bottom')}
          </Button>
        </div>
      </PanelSection>

      <PanelSection title={tSettings('pdf_editor.right_panel.props.sections.actions')}>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => onDuplicateSelectedElements?.()} className="text-xs">
            <Copy className="h-4 w-4" />
            {tSettings('pdf_editor.right_panel.layers.tooltips.duplicate')}
          </Button>
          <Button variant="destructive" onClick={() => onDeleteSelectedElements?.()} className="text-xs">
            <Trash2 className="h-4 w-4" />
            {tSettings('pdf_editor.right_panel.layers.tooltips.delete')}
          </Button>
          <Button variant="outline" onClick={() => onLockSelectedElements?.()} className="text-xs">
            <Lock className="h-4 w-4" />
            {tSettings('pdf_editor.right_panel.layers.tooltips.lock')}
          </Button>
          <Button variant="outline" onClick={() => onUnlockSelectedElements?.()} className="text-xs">
            <Unlock className="h-4 w-4" />
            {tSettings('pdf_editor.right_panel.layers.tooltips.unlock')}
          </Button>
          <Button variant="outline" onClick={() => onHideSelectedElements?.()} className="text-xs">
            <EyeOff className="h-4 w-4" />
            {tSettings('pdf_editor.right_panel.layers.tooltips.hide')}
          </Button>
          <Button variant="outline" onClick={() => onShowSelectedElements?.()} className="text-xs">
            <Eye className="h-4 w-4" />
            {tSettings('pdf_editor.right_panel.layers.tooltips.show')}
          </Button>
        </div>
      </PanelSection>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/40">
    <span className="block text-[10px] uppercase text-zinc-500">{label}</span>
    <span className="font-mono text-xs text-zinc-800 dark:text-zinc-100">
      {Number(value).toFixed(1)}
    </span>
  </div>
);

const PanelSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {title}
    </h3>
    {children}
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-zinc-500 dark:text-zinc-400">{label}</Label>
    {children}
  </div>
);

const ToggleField = ({
  label,
  checked,
  icon,
  onCheckedChange
}: {
  label: string;
  checked: boolean;
  icon: React.ReactNode;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50/60 px-2 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
    <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
      {icon}
      {label}
    </span>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

const getNormalizedTableConfig = (config?: TemplateTableConfig): TemplateTableConfig => {
  const defaults = createDefaultTableConfig();
  return {
    ...defaults,
    ...config,
    headerStyle: { ...defaults.headerStyle, ...(config?.headerStyle || {}) },
    rowStyle: { ...defaults.rowStyle, ...(config?.rowStyle || {}) },
    columns: config?.columns?.length
      ? config.columns.map((column) => ({ ...column, visible: column.visible ?? true }))
      : defaults.columns
  };
};

const NumberField = ({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) => (
  <Field label={label}>
    <Input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      min={min}
      max={max}
      step="0.5"
      onChange={(event) => onChange(Number(event.target.value || 0))}
    />
  </Field>
);
