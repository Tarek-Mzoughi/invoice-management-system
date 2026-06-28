import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '@/types';
import { DOCUMENT_TEMPLATE_TYPE_OPTIONS } from '../constants';

interface TemplateDocumentTypeSelectorProps {
  value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;
  onChange: (value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE) => void;
  disabled?: boolean;
}

export const TemplateDocumentTypeSelector = ({
  value,
  onChange,
  disabled
}: TemplateDocumentTypeSelectorProps) => (
  <Select value={value} onValueChange={(next) => onChange(next as DOCUMENT_TEMPLATE_DOCUMENT_TYPE)} disabled={disabled}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {DOCUMENT_TEMPLATE_TYPE_OPTIONS.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
