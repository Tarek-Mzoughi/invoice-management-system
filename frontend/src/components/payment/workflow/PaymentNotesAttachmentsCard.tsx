import { Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploader } from '@/components/ui/file-uploader';
import { Textarea } from '@/components/ui/textarea';
import { PaymentWorkflowField } from './payment-workflow-ui';

interface PaymentNotesAttachmentsCardProps {
  files: File[];
  filesLabel: string;
  notes: string;
  notesLabel: string;
  onFilesChange: (files: File[]) => void;
  onNotesChange: (value: string) => void;
  title: string;
}

export const PaymentNotesAttachmentsCard = ({
  files,
  filesLabel,
  notes,
  notesLabel,
  onFilesChange,
  onNotesChange,
  title
}: PaymentNotesAttachmentsCardProps) => (
  <Card>
    <CardHeader className="p-5 pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Paperclip className="h-4 w-4" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="grid gap-5 p-5 pt-0 lg:grid-cols-2">
      <PaymentWorkflowField label={notesLabel}>
        <Textarea
          value={notes || ''}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder={notesLabel}
          className="min-h-[180px] resize-none"
        />
      </PaymentWorkflowField>
      <PaymentWorkflowField label={filesLabel}>
        <FileUploader
          accept={{
            'image/*': [],
            'application/pdf': [],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
            'application/msword': [],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
            'application/vnd.ms-excel': []
          }}
          maxFileCount={Infinity}
          value={files}
          onValueChange={onFilesChange}
        />
      </PaymentWorkflowField>
    </CardContent>
  </Card>
);
