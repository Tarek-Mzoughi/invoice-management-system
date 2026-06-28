import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  Building2,
  GripVertical,
  Image as ImageIcon,
  Search,
  Table2,
  TextCursorInput,
  Type,
  UserRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DOCUMENT_TEMPLATE_ELEMENT_TYPE } from '@/types';
import { useTranslation } from 'react-i18next';

interface TemplateElementsPanelProps {
  onAddElement: (type: DOCUMENT_TEMPLATE_ELEMENT_TYPE) => void;
}

const icons: Partial<Record<DOCUMENT_TEMPLATE_ELEMENT_TYPE, React.ReactNode>> = {
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.TEXT]: <Type className="h-4 w-4" />,
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.DYNAMIC_TEXT]: <TextCursorInput className="h-4 w-4" />,
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.IMAGE]: <ImageIcon className="h-4 w-4" />,
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.LOGO]: <ImageIcon className="h-4 w-4" />,
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE]: <Table2 className="h-4 w-4" />,
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.COMPANY_BLOCK]: <Building2 className="h-4 w-4" />,
  [DOCUMENT_TEMPLATE_ELEMENT_TYPE.CLIENT_BLOCK]: <UserRound className="h-4 w-4" />
};

export const TemplateElementsPanel = ({ onAddElement }: TemplateElementsPanelProps) => {
  const { t: tSettings } = useTranslation('settings');
  const [search, setSearch] = React.useState('');
  const normalizedSearch = search.trim().toLowerCase();

  const elementSections = React.useMemo(() => [
    {
      label: tSettings('pdf_editor.left_panel.sections.elements'),
      items: [
        { 
          type: DOCUMENT_TEMPLATE_ELEMENT_TYPE.TEXT, 
          label: tSettings('pdf_editor.left_panel.types.text'), 
          description: tSettings('pdf_editor.left_panel.descriptions.text') 
        },
        {
          type: DOCUMENT_TEMPLATE_ELEMENT_TYPE.DYNAMIC_TEXT,
          label: tSettings('pdf_editor.left_panel.types.dynamic'),
          description: tSettings('pdf_editor.left_panel.descriptions.dynamic')
        },
        { 
          type: DOCUMENT_TEMPLATE_ELEMENT_TYPE.LOGO, 
          label: tSettings('pdf_editor.left_panel.types.logo'), 
          description: tSettings('pdf_editor.left_panel.descriptions.logo') 
        },
        { 
          type: DOCUMENT_TEMPLATE_ELEMENT_TYPE.IMAGE, 
          label: tSettings('pdf_editor.left_panel.types.image'), 
          description: tSettings('pdf_editor.left_panel.descriptions.image') 
        },
        { 
          type: DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE, 
          label: tSettings('pdf_editor.left_panel.types.table'), 
          description: tSettings('pdf_editor.left_panel.descriptions.table') 
        }
      ]
    },
    {
      label: tSettings('pdf_editor.left_panel.sections.blocks'),
      items: [
        {
          type: DOCUMENT_TEMPLATE_ELEMENT_TYPE.COMPANY_BLOCK,
          label: tSettings('pdf_editor.left_panel.types.company_block'),
          description: tSettings('pdf_editor.left_panel.descriptions.company_block')
        },
        {
          type: DOCUMENT_TEMPLATE_ELEMENT_TYPE.CLIENT_BLOCK,
          label: tSettings('pdf_editor.left_panel.types.client_block'),
          description: tSettings('pdf_editor.left_panel.descriptions.client_block')
        }
      ]
    }
  ], [tSettings]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{tSettings('pdf_editor.left_panel.elements')}</h2>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tSettings('pdf_editor.left_panel.search_placeholder')}
            className="pl-8"
          />
        </div>
      </div>

      {elementSections.map((section) => {
        const items = section.items.filter(
          (item) =>
            !normalizedSearch ||
            item.label.toLowerCase().includes(normalizedSearch) ||
            item.description.toLowerCase().includes(normalizedSearch)
        );
        if (items.length === 0) return null;

        return (
          <section key={section.label} className="space-y-2">
            <p className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
              {section.label}
            </p>
            <div className="space-y-2">
              {items.map((item) => (
                <DraggableElementButton
                  key={item.type}
                  type={item.type}
                  label={item.label}
                  description={item.description}
                  onAddElement={onAddElement}
                  tSettings={tSettings}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

const DraggableElementButton = ({
  type,
  label,
  description,
  onAddElement,
  tSettings
}: {
  type: DOCUMENT_TEMPLATE_ELEMENT_TYPE;
  label: string;
  description: string;
  onAddElement: (type: DOCUMENT_TEMPLATE_ELEMENT_TYPE) => void;
  tSettings: any;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-element-${type}`,
    data: {
      kind: 'element',
      elementType: type,
      label
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-950',
        'hover:border-zinc-300 hover:bg-zinc-50/70 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60',
        isDragging && 'opacity-60 ring-2 ring-blue-500/20'
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-9 w-8 shrink-0 cursor-grab items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 transition group-hover:text-zinc-700 active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-950 dark:group-hover:text-zinc-300"
          {...attributes}
          {...listeners}
          title={`Drag ${label}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => onAddElement(type)}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {icons[type] || <Type className="h-4 w-4" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {label}
            </span>
            <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
              {description}
            </span>
          </span>
        </button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 px-2.5"
          onClick={() => onAddElement(type)}
        >
          {tSettings('pdf_editor.left_panel.add')}
        </Button>
      </div>
    </div>
  );
};
