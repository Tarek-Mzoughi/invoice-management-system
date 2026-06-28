import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  Table2,
  TextCursorInput,
  Trash2,
  Type,
  Unlock,
  UserRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { DOCUMENT_TEMPLATE_ELEMENT_TYPE, TemplateElement } from '@/types';
import { useTranslation } from 'react-i18next';

interface TemplateLayersPanelProps {
  elements: TemplateElement[];
  selectedElementId?: string;
  selectedElementIds: string[];
  onSelectElement: (id: string, multi?: boolean) => void;
  onToggleElementSelection?: (id: string) => void;
  onAddElementToSelection?: (id: string) => void;
  onUpdateElement: (element: TemplateElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onDuplicateSelectedElements?: () => void;
  onDeleteSelectedElements?: () => void;
  onLockSelectedElements?: () => void;
  onUnlockSelectedElements?: () => void;
  onHideSelectedElements?: () => void;
  onShowSelectedElements?: () => void;
  onReorderElements?: (startIndex: number, endIndex: number) => void;
}

const icons: Partial<Record<DOCUMENT_TEMPLATE_ELEMENT_TYPE, React.ReactNode>> = {
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.TEXT]: <Type className="h-3.5 w-3.5" />,
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.DYNAMIC_TEXT]: <TextCursorInput className="h-3.5 w-3.5" />,
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.IMAGE]: <ImageIcon className="h-3.5 w-3.5" />,
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.LOGO]: <ImageIcon className="h-3.5 w-3.5" />,
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE]: <Table2 className="h-3.5 w-3.5" />,
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.COMPANY_BLOCK]: <Building2 className="h-3.5 w-3.5" />,
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.CLIENT_BLOCK]: <UserRound className="h-3.5 w-3.5" />
};

export const TemplateLayersPanel = ({
  elements,
  selectedElementIds,
  onSelectElement,
  onToggleElementSelection,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElements = () => {}
}: TemplateLayersPanelProps) => {
  const { t: tSettings } = useTranslation('settings');
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="flex h-full flex-col space-y-4 overflow-hidden">
      <div className="space-y-1 px-1">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{tSettings('pdf_editor.right_panel.layers.title')}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {tSettings('pdf_editor.right_panel.layers.description')}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 px-1 pb-4">
          {sortedElements.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-200 p-4 text-center dark:border-zinc-800">
              <p className="text-xs text-zinc-500">{tSettings('pdf_editor.right_panel.layers.no_layers')}</p>
            </div>
          ) : (
            sortedElements.map((element, index) => (
              <LayerItem
                key={element.id}
                element={element}
                isSelected={selectedElementIds.includes(element.id)}
                onSelect={(multi) => {
                  if (multi && onToggleElementSelection) {
                    onToggleElementSelection(element.id);
                    return;
                  }
                  onSelectElement(element.id, multi);
                }}
                onToggleVisibility={() => onUpdateElement({ ...element, visible: !element.visible })}
                onToggleLock={() => onUpdateElement({ ...element, locked: !element.locked })}
                onDelete={() => onDeleteElement(element.id)}
                onDuplicate={() => onDuplicateElement(element.id)}
                onMoveUp={index > 0 ? () => onReorderElements(index, index - 1) : undefined}
                onMoveDown={
                  index < sortedElements.length - 1
                    ? () => onReorderElements(index, index + 1)
                    : undefined
                }
                tSettings={tSettings}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const LayerItem = ({
  element,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  tSettings
}: {
  element: TemplateElement;
  isSelected: boolean;
  onSelect: (multi: boolean) => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  tSettings: any;
}) => (
  <div
    className={cn(
      'group flex items-center gap-2 rounded-md border p-1.5 transition-all',
      isSelected
        ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20'
        : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
    )}
    onClick={(e) => onSelect(e.shiftKey || e.metaKey || e.ctrlKey)}
  >
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
      {icons[element.type] || <Type className="h-3.5 w-3.5" />}
    </div>

    <div className="min-w-0 flex-1">
      <span
        className={cn(
          'block truncate text-xs font-medium',
          isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-700 dark:text-zinc-300',
          !element.visible && 'text-zinc-400 opacity-60'
        )}
      >
        {element.name}
      </span>
      <span className="block text-[10px] text-zinc-400">Layer {element.zIndex}</span>
    </div>

    <div className="flex items-center gap-0.5">
      <TooltipProvider delayDuration={400}>
        <TooltipItem
          icon={element.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          label={element.visible ? tSettings('pdf_editor.right_panel.layers.tooltips.hide') : tSettings('pdf_editor.right_panel.layers.tooltips.show')}
        />
        <TooltipItem
          icon={element.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          label={element.locked ? tSettings('pdf_editor.right_panel.layers.tooltips.unlock') : tSettings('pdf_editor.right_panel.layers.tooltips.lock')}
        />
        <div className="flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <TooltipItem
            icon={<ArrowUp className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp?.();
            }}
            disabled={!onMoveUp}
            label={tSettings('pdf_editor.right_panel.layers.tooltips.move_up')}
          />
          <TooltipItem
            icon={<ArrowDown className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown?.();
            }}
            disabled={!onMoveDown}
            label={tSettings('pdf_editor.right_panel.layers.tooltips.move_down')}
          />
        </div>
      </TooltipProvider>
    </div>
  </div>
);

const TooltipItem = ({
  icon,
  label,
  onClick,
  disabled
}: {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        onClick={onClick}
        disabled={disabled}
      >
        {icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top">
      <p className="text-xs">{label}</p>
    </TooltipContent>
  </Tooltip>
);
