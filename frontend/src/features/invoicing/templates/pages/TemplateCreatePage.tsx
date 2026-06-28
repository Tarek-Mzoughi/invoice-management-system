import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import {
  createDefaultTemplateSchema,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
  DOCUMENT_TEMPLATE_STATUS,
  TemplatePreset
} from '@/types';
import { TemplateDocumentTypeSelector } from '../components/TemplateDocumentTypeSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export const TemplateCreatePage = () => {
  const router = useRouter();
  const { t: tSettings } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  const templatePresetOptions: { value: TemplatePreset; label: string; description: string }[] = React.useMemo(() => [
    {
      value: 'classic',
      label: tSettings('pdf_templates.form.presets.classic.label'),
      description: tSettings('pdf_templates.form.presets.classic.description')
    },
    {
      value: 'modern',
      label: tSettings('pdf_templates.form.presets.modern.label'),
      description: tSettings('pdf_templates.form.presets.modern.description')
    },
    {
      value: 'minimal',
      label: tSettings('pdf_templates.form.presets.minimal.label'),
      description: tSettings('pdf_templates.form.presets.minimal.description')
    }
  ], [tSettings]);

  const [name, setName] = React.useState(tSettings('pdf_templates.form.name_placeholder'));
  const [documentType, setDocumentType] = React.useState<DOCUMENT_TEMPLATE_DOCUMENT_TYPE>(
    DOCUMENT_TEMPLATE_DOCUMENT_TYPE.INVOICE
  );
  const [preset, setPreset] = React.useState<TemplatePreset>('classic');

  const { mutate: createTemplate, isPending } = useMutation({
    mutationFn: () =>
      api.documentTemplate.create({
        name,
        documentType,
        status: DOCUMENT_TEMPLATE_STATUS.DRAFT,
        templateSchema: createDefaultTemplateSchema(documentType, name, preset)
      }),
    onSuccess: (template) => {
      toast.success(tSettings('pdf_templates.messages.create_success'));
      router.push(`/settings/pdf/templates/${template.id}`);
    },
    onError: () => toast.error(tSettings('pdf_templates.messages.create_error'))
  });

  return (
    <div className="flex flex-1 items-center justify-center p-4 min-h-[calc(100vh-120px)]">
      <Card className="w-full max-w-2xl shadow-lg border-border/60">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => router.push('/settings/pdf/templates')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl font-bold tracking-tight">
              {tSettings('pdf_templates.create_title')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{tSettings('pdf_templates.form.name')}</Label>
            <Input 
              value={name} 
              onChange={(event) => setName(event.target.value)}
              className="h-10 focus-visible:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{tSettings('pdf_templates.form.document_type')}</Label>
            <TemplateDocumentTypeSelector value={documentType} onChange={setDocumentType} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{tSettings('pdf_templates.form.preset')}</Label>
            <Select value={preset} onValueChange={(value) => setPreset(value as TemplatePreset)}>
              <SelectTrigger className="h-10 focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templatePresetOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="rounded-md">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[13px] text-muted-foreground bg-muted/30 p-2.5 rounded-md border border-border/40">
              {templatePresetOptions.find((option) => option.value === preset)?.description}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button 
              variant="outline" 
              className="h-10 px-6 rounded-md"
              onClick={() => router.push('/settings/pdf/templates')}
            >
              {tCommon('commands.cancel')}
            </Button>
            <Button 
              className="h-10 px-8 rounded-md"
              onClick={() => createTemplate()} 
              disabled={!name.trim() || isPending}
            >
              {isPending ? <Spinner size="small" /> : <Save className="mr-2 h-4 w-4" />}
              {tCommon('commands.create')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
