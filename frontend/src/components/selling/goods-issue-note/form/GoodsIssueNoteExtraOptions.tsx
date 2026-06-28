import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { FileUploader } from '@/components/ui/file-uploader';
import { Textarea } from '@/components/ui/textarea';
import { Files, NotebookTabs } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGoodsIssueNoteManager } from '../hooks/useGoodsIssueNoteManager';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import React from 'react';

interface GoodsIssueNoteExtraOptionsProps {
  className?: string;
  loading?: boolean;
  mode?: 'all' | 'notes' | 'files';
}

export const GoodsIssueNoteExtraOptions = ({
  className,
  loading,
  mode = 'all'
}: GoodsIssueNoteExtraOptionsProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const goodsIssueNoteManager = useGoodsIssueNoteManager();

  const handleFilesChange = (files: File[]) => {
    if (files.length > goodsIssueNoteManager.uploadedFiles.length) {
      const newFiles = files.filter(
        (file) =>
          !goodsIssueNoteManager.uploadedFiles.some((uploadedFile) => uploadedFile.file === file)
      );
      goodsIssueNoteManager.set('uploadedFiles', [
        ...goodsIssueNoteManager.uploadedFiles,
        ...newFiles.map((file) => ({ file }))
      ]);
    } else {
      const updatedFiles = goodsIssueNoteManager.uploadedFiles.filter((uploadedFile) =>
        files.some((file) => file === uploadedFile.file)
      );
      goodsIssueNoteManager.set('uploadedFiles', updatedFiles);
    }
  };

  const filesContent = (
    <FileUploader
      accept={{
        'image/*': [],
        'application/pdf': [],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
        'application/msword': [],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
        'application/vnd.ms-excel': []
      }}
      className="my-2"
      maxFileCount={Infinity}
      value={goodsIssueNoteManager.uploadedFiles?.map((d) => d.file)}
      onValueChange={handleFilesChange}
    />
  );

  const notesContent = (
    <Textarea
      placeholder={tInvoicing('goodsIssueNote.attributes.notes')}
      className={cn('min-h-[180px] resize-none', className)}
      value={goodsIssueNoteManager.notes}
      onChange={(e) => goodsIssueNoteManager.set('notes', e.target.value)}
      isPending={loading}
      rows={7}
    />
  );

  if (mode === 'notes') {
    return notesContent;
  }

  if (mode === 'files') {
    return (
      <Accordion type="single" collapsible className={cn(className)}>
        <AccordionItem
          value="files"
          className="rounded-lg border border-zinc-200 px-5 dark:border-zinc-800"
        >
          <AccordionTrigger className="py-4 hover:no-underline">
            <div className="flex gap-2 items-center">
              <Files className="h-4 w-4" />
              <Label>{tInvoicing('goodsIssueNote.attributes.files')}</Label>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">{filesContent}</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Accordion type="multiple" className={cn(className, 'mx-1 border-b')}>
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex gap-2 justify-center items-center">
            <Files />
            <Label>{tInvoicing('goodsIssueNote.attributes.files')}</Label>
          </div>
        </AccordionTrigger>
        <AccordionContent className="m-5">{filesContent}</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <div className="flex gap-2 justify-center items-center">
            <NotebookTabs />
            <Label>{tInvoicing('goodsIssueNote.attributes.notes')}</Label>
          </div>
        </AccordionTrigger>
        <AccordionContent className="m-5">{notesContent}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
