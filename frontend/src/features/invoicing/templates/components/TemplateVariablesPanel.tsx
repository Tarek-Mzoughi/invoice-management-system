import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  Calendar,
  CheckCircle2,
  GripVertical,
  Hash,
  Mail,
  MapPin,
  Phone,
  Search,
  Type,
  UserRound,
  Image as ImageIcon,
  Plus,
  Link2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { TemplateVariableDefinition } from '../types/template-editor.types';

interface TemplateVariablesPanelProps {
  documentType?: unknown;
  selectedElement?: unknown;
  onInsertVariable: (variable: TemplateVariableDefinition) => void;
  onBindVariable: (path: string) => void;
}

interface Variable {
  path: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'address' | 'phone' | 'image' | 'status';
}

const variables: Variable[] = [
  // Document
  { path: 'document.number', label: 'Document number', type: 'text' },
  { path: 'document.date', label: 'Date', type: 'date' },
  { path: 'document.dueDate', label: 'Due date', type: 'date' },
  { path: 'document.object', label: 'Object', type: 'text' },
  { path: 'document.status', label: 'Status', type: 'status' },
  { path: 'document.totalHT', label: 'Total HT', type: 'number' },
  { path: 'document.totalTTC', label: 'Total TTC', type: 'number' },
  { path: 'document.totalTax', label: 'Total Tax', type: 'number' },
  { path: 'document.currency', label: 'Currency', type: 'text' },
  { path: 'document.notes', label: 'Notes', type: 'text' },
  { path: 'document.terms', label: 'Terms & Conditions', type: 'text' },

  // Company
  { path: 'company.name', label: 'Company name', type: 'text' },
  { path: 'company.logo', label: 'Company logo', type: 'image' },
  { path: 'company.address', label: 'Company address', type: 'address' },
  { path: 'company.email', label: 'Company email', type: 'email' },
  { path: 'company.phone', label: 'Company phone', type: 'phone' },
  { path: 'company.taxNumber', label: 'Tax number', type: 'text' },
  { path: 'company.website', label: 'Company website', type: 'text' },

  // Client
  { path: 'client.name', label: 'Client name', type: 'text' },
  { path: 'client.address', label: 'Client address', type: 'address' },
  { path: 'client.email', label: 'Client email', type: 'email' },
  { path: 'client.phone', label: 'Client phone', type: 'phone' },
  { path: 'client.taxNumber', label: 'Client tax number', type: 'text' },

  // Supplier
  { path: 'supplier.name', label: 'Supplier name', type: 'text' },
  { path: 'supplier.address', label: 'Supplier address', type: 'address' },
  { path: 'supplier.email', label: 'Supplier email', type: 'email' },
  { path: 'supplier.phone', label: 'Supplier phone', type: 'phone' },
  { path: 'supplier.taxNumber', label: 'Supplier tax number', type: 'text' },

  // Totals
  { path: 'totals.subtotal', label: 'Subtotal', type: 'number' },
  { path: 'totals.discount', label: 'Discount', type: 'number' },
  { path: 'totals.tax', label: 'Tax amount', type: 'number' },
  { path: 'totals.totalHT', label: 'Total HT', type: 'number' },
  { path: 'totals.totalTVA', label: 'Total TVA', type: 'number' },
  { path: 'totals.totalTTC', label: 'Total TTC', type: 'number' },
  { path: 'totals.paid', label: 'Amount paid', type: 'number' },
  { path: 'totals.remaining', label: 'Amount remaining', type: 'number' },
  { path: 'totals.amountInWords', label: 'Amount in words', type: 'text' },

  // Line items
  { path: 'items[].reference', label: 'Item reference', type: 'text' },
  { path: 'items[].name', label: 'Item name', type: 'text' },
  { path: 'items[].description', label: 'Item description', type: 'text' },
  { path: 'items[].quantity', label: 'Item quantity', type: 'number' },
  { path: 'items[].unit', label: 'Item unit', type: 'text' },
  { path: 'items[].unitPrice', label: 'Item unit price', type: 'number' },
  { path: 'items[].discount', label: 'Item discount', type: 'number' },
  { path: 'items[].taxRate', label: 'Item tax rate', type: 'number' },
  { path: 'items[].totalHT', label: 'Item total HT', type: 'number' },
  { path: 'items[].totalTTC', label: 'Item total TTC', type: 'number' },

  // Payments
  { path: 'payments[].date', label: 'Payment date', type: 'date' },
  { path: 'payments[].method', label: 'Payment method', type: 'text' },
  { path: 'payments[].amount', label: 'Payment amount', type: 'number' },
  { path: 'payments[].reference', label: 'Payment reference', type: 'text' },

  // Bank
  { path: 'bank.name', label: 'Bank name', type: 'text' },
  { path: 'bank.rib', label: 'Bank RIB', type: 'text' },
  { path: 'bank.iban', label: 'Bank IBAN', type: 'text' },
  { path: 'bank.swift', label: 'Bank BIC/SWIFT', type: 'text' },
  { path: 'bank.agency', label: 'Bank agency', type: 'text' },
  { path: 'bank.details', label: 'Bank details text', type: 'text' },

  // Partner (Generic)
  { path: 'partner.name', label: 'Partner name', type: 'text' },
  { path: 'partner.address', label: 'Partner address', type: 'address' },
  { path: 'partner.email', label: 'Partner email', type: 'email' },
  { path: 'partner.phone', label: 'Partner phone', type: 'phone' },
  { path: 'partner.taxNumber', label: 'Partner tax number', type: 'text' },
  { path: 'partner.contactName', label: 'Partner contact name', type: 'text' },

  // Signature & Stamp
  { path: 'signature.signature', label: 'Signature image', type: 'image' },
  { path: 'signature.stamp', label: 'Stamp image (Cachet)', type: 'image' }
];

const icons: Record<Variable['type'], React.ReactNode> = {
  text: <Type className="h-3.5 w-3.5" />,
  number: <Hash className="h-3.5 w-3.5" />,
  date: <Calendar className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  address: <MapPin className="h-3.5 w-3.5" />,
  phone: <Phone className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
  status: <CheckCircle2 className="h-3.5 w-3.5" />
};

const toVariableDefinition = (variable: Variable): TemplateVariableDefinition => ({
  key: variable.path,
  label: variable.label,
  example: `{{${variable.path}}}`,
  valueType: variable.type === 'image' ? 'image' : 'text'
});

export const TemplateVariablesPanel = ({
  onInsertVariable,
  onBindVariable
}: TemplateVariablesPanelProps) => {
  const { t: tSettings } = useTranslation('settings');
  const [search, setSearch] = React.useState('');

  const filteredVariables = variables.filter(
    (v) =>
      v.label.toLowerCase().includes(search.toLowerCase()) ||
      v.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col space-y-4 overflow-hidden">
      <div className="space-y-2 px-1">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{tSettings('pdf_editor.right_panel.vars.title')}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {tSettings('pdf_editor.right_panel.vars.description')}
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tSettings('pdf_editor.left_panel.search_placeholder')}
            className="h-9 pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1.5 px-1 pb-4">
          {filteredVariables.map((variable) => (
            <DraggableVariableItem
              key={variable.path}
              variable={variable}
              onInsert={onInsertVariable}
              onBind={onBindVariable}
              tSettings={tSettings}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

const DraggableVariableItem = ({
  variable,
  onInsert,
  onBind,
  tSettings
}: {
  variable: Variable;
  onInsert: (variable: TemplateVariableDefinition) => void;
  onBind: (path: string) => void;
  tSettings: any;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-variable-${variable.path}`,
    data: {
      kind: 'variable',
      variable: toVariableDefinition(variable),
      label: variable.label
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-2 transition dark:border-zinc-800 dark:bg-zinc-950',
        'hover:border-zinc-300 hover:bg-zinc-50/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/50',
        isDragging && 'opacity-50 ring-2 ring-blue-500/20'
      )}
    >
      <div
        className="flex h-7 w-6 shrink-0 cursor-grab items-center justify-center rounded bg-zinc-50 text-zinc-400 transition group-hover:text-zinc-600 active:cursor-grabbing dark:bg-zinc-900"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-50">
            {variable.label}
          </span>
          {variable.type === 'image' && (
            <Badge variant="outline" className="h-4 px-1 text-[9px] font-normal uppercase leading-none">
              {tSettings('pdf_editor.right_panel.vars.image_badge')}
            </Badge>
          )}
        </div>
        <code className="block truncate text-[10px] text-zinc-400 dark:text-zinc-500">
          {variable.path}
        </code>
      </div>

      <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600 dark:hover:bg-zinc-800"
          onClick={() => onInsert(toVariableDefinition(variable))}
          title={tSettings('pdf_editor.right_panel.vars.insert')}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600 dark:hover:bg-zinc-800"
          onClick={() => onBind(variable.path)}
          title={tSettings('pdf_editor.right_panel.vars.bind')}
        >
          <Link2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
