import { CheckedState } from '@radix-ui/react-checkbox';

export interface FormStructure {
  title?: string;
  description?: string;
  orientation?: 'vertical' | 'horizontal';
  layout?: 'default' | 'stacked';
  includeHeader?: boolean;
  fieldsets: Fieldset[];
}

export interface Fieldset {
  title?: string;
  description?: string;
  includeHeader?: boolean;
  rows: FieldsetRow[];
}

export interface FieldsetRow {
  className?: string;
  fields: Field[];
}

export enum FieldVariant {
  TEXT = 'text',
  EMAIL = 'email',
  TEL = 'tel',
  NUMBER = 'number',
  URL = 'url',
  PASSWORD = 'password',
  DATE = 'date',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  SWITCH = 'switch',
  TEXTAREA = 'textarea',
  IMAGE = 'image',
  IMAGE_GALLERY = 'image_gallery',
  FILE = 'file',
  EMPTY = 'empty',
  CUSTOM = 'custom'
}

export interface Field<T = any> {
  id: string;
  label?: string;
  className?: string;
  wrapperClassName?: string;
  variant: FieldVariant;
  required?: boolean;
  description?: string;
  placeholder?: string;
  hidden?: boolean;
  error?: string;
  props?: T;
}

export interface BaseFieldProps {
  disabled?: boolean;
}

export interface TextFieldProps extends BaseFieldProps {
  value?: string | null;
  onChange?: (e: string) => void;
}

export interface EmailFieldProps extends BaseFieldProps {
  value?: string | null;
  onChange?: (e: string) => void;
}

export interface TelFieldProps extends BaseFieldProps {
  value?: string | null;
  onChange?: (e: string) => void;
}

export interface NumberFieldProps extends BaseFieldProps {
  value?: number | null;
  onChange?: (e: number) => void;
  min?: number;
  max?: number;
}

export interface PasswordFieldProps extends BaseFieldProps {
  value?: string;
  onChange?: (e: string) => void;
}

export interface DateFieldProps extends BaseFieldProps {
  value?: Date | null;
  onDateChange?: (e: Date | null) => void;
  nullable?: boolean;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface RadioOption {
  label: string;
  value: string;
}

export interface RadioFieldProps extends BaseFieldProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options?: RadioOption[];
}

export interface SelectFieldProps extends BaseFieldProps {
  value?: string | null;
  onValueChange?: (value: string) => void;
  options?: SelectOption[];
}

export interface MultiSelectFieldProps extends BaseFieldProps {
  value?: string[];
  onValueChange?: (value: string[]) => void;
  options?: SelectOption[];
}

export interface CheckboxFieldProps extends BaseFieldProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (e: CheckedState) => void;
}

export interface SwitchFieldProps extends BaseFieldProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (e: boolean) => void;
}

export interface TextareaFieldProps extends BaseFieldProps {
  value?: string;
  onChange?: (e: string) => void;
  cols?: number;
  rows?: number;
  resizable?: boolean;
}

export interface ImageFieldProps extends BaseFieldProps {
  image?: File | null;
  accept?: string;
  progress?: number;
  placeholder?: string;
  fallback?: string;
  onFileChange?: (e: File) => void;
  onUpload?: (file: File, onProgress: (percent: number) => void) => void;
}

export interface SingleFileFieldProps extends BaseFieldProps {
  file?: File | null;
  accept?: string;
  progress?: number;
  onFileChange?: (e: File) => void;
  onUpload?: (file: File, onProgress: (percent: number) => void) => void;
}

export interface ImageGalleryFieldProps extends BaseFieldProps {
  images: ImageFile[];
  onFilesChange?: (e: ImageFile[]) => void;
  onUpload?: (file: File, onProgress: (percent: number) => void) => void;
}

export interface ImageFile {
  id: string;
  image?: File | null;
  url?: string;
  name: string;
  progress: number;
}

export interface CustomFieldProps extends BaseFieldProps {
  className?: string;
  children: React.ReactNode;
  includeLabel?: boolean;
}

export interface EmptyFieldProps {}
