import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Edit, Plus, Star, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { api } from '@/api';
import { Spinner } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIntro } from '@/context/IntroContext';
import { useBreadcrumb } from '@/context/BreadcrumbContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
  DOCUMENT_TEMPLATE_STATUS,
  DocumentTemplate
} from '@/types';
import {
  DOCUMENT_TEMPLATE_STATUS_OPTIONS,
  DOCUMENT_TEMPLATE_TYPE_OPTIONS
} from '../constants';

export const TemplateListPage = () => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [documentType, setDocumentType] = React.useState<
    DOCUMENT_TEMPLATE_DOCUMENT_TYPE | 'all'
  >('all');
  const [status, setStatus] = React.useState<DOCUMENT_TEMPLATE_STATUS | 'all'>('all');

  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes?.([
      { title: tCommon('menu.settings'), href: '/settings' },
      { title: tSettings('pdf_templates.title') }
    ]);
  }, [router.locale, tCommon, tSettings, setRoutes]);

  const { data, isPending } = useQuery({
    queryKey: ['document-templates', page, search, documentType, status],
    queryFn: () =>
      api.documentTemplate.findPaginated(page, 10, 'DESC', 'id', {
        search,
        documentType,
        status
      })
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['document-templates'] });

  const { mutate: duplicateTemplate, isPending: duplicating } = useMutation({
    mutationFn: (id: number) => api.documentTemplate.duplicate(id),
    onSuccess: (template) => {
      toast.success(tSettings('pdf_templates.messages.duplicate_success'));
      invalidate();
      router.push(`/settings/pdf/templates/${template.id}`);
    },
    onError: () => toast.error(tSettings('pdf_templates.messages.duplicate_error'))
  });

  const { mutate: deleteTemplate, isPending: deleting } = useMutation({
    mutationFn: (id: number) => api.documentTemplate.remove(id),
    onSuccess: () => {
      toast.success(tSettings('pdf_templates.messages.delete_success'));
      invalidate();
    },
    onError: () => toast.error(tSettings('pdf_templates.messages.delete_error'))
  });

  const { mutate: setDefaultTemplate, isPending: settingDefault } = useMutation({
    mutationFn: (id: number) => api.documentTemplate.setDefault(id),
    onSuccess: () => {
      toast.success(tSettings('pdf_templates.messages.set_default_success'));
      invalidate();
    },
    onError: () => toast.error(tSettings('pdf_templates.messages.set_default_error'))
  });

  const { clearIntro, clearFloating } = useIntro();

  React.useEffect(() => {
    return () => {
      clearIntro?.();
      clearFloating?.();
    };
  }, [clearIntro, clearFloating]);

  const templates = data?.data || [];
  const pageCount = data?.meta.pageCount || 1;
  const busy = isPending || duplicating || deleting || settingDefault;

  return (
    <div className="flex flex-1 flex-col overflow-auto px-4 py-5 lg:px-8 lg:py-6">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        <div className="flex flex-wrap items-start gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-lg px-4 text-sm font-medium transition-all"
            onClick={() => router.push('/settings')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon('commands.back')}
          </Button>
        </div>

        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
            {tSettings('pdf_templates.title')}
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            {tSettings('pdf_templates.description')}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold">{tSettings('pdf_templates.library')}</h2>
            <Button
              className="h-9 rounded-md px-4 font-medium"
              onClick={() => router.push('/settings/pdf/templates/new')}
            >
              <Plus className="mr-2 h-4 w-4" />
              {tSettings('pdf_templates.new_template')}
            </Button>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_180px]">
            <Input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder={tSettings('pdf_templates.search_placeholder')}
              className="h-9"
            />
            <Select
              value={documentType}
              onValueChange={(next) => {
                setPage(1);
                setDocumentType(next as DOCUMENT_TEMPLATE_DOCUMENT_TYPE | 'all');
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tSettings('pdf_templates.all_document_types')}</SelectItem>
                {DOCUMENT_TEMPLATE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(next) => {
                setPage(1);
                setStatus(next as DOCUMENT_TEMPLATE_STATUS | 'all');
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tSettings('pdf_templates.all_statuses')}</SelectItem>
                {DOCUMENT_TEMPLATE_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">{tSettings('pdf_templates.table.name')}</TableHead>
                  <TableHead className="font-semibold">{tSettings('pdf_templates.table.type')}</TableHead>
                  <TableHead className="font-semibold">{tSettings('pdf_templates.table.status')}</TableHead>
                  <TableHead className="font-semibold">{tSettings('pdf_templates.table.version')}</TableHead>
                  <TableHead className="text-right font-semibold">{tSettings('pdf_templates.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {busy && templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center">
                      <Spinner show />
                    </TableCell>
                  </TableRow>
                ) : null}
                {!busy && templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-sm text-muted-foreground">
                      {tSettings('pdf_templates.no_templates')}
                    </TableCell>
                  </TableRow>
                ) : null}
                {templates.map((template) => (
                  <TemplateRow
                    key={template.id}
                    template={template}
                    onEdit={() => router.push(`/settings/pdf/templates/${template.id}`)}
                    onDuplicate={() => duplicateTemplate(template.id)}
                    onSetDefault={() => setDefaultTemplate(template.id)}
                    onDelete={() => deleteTemplate(template.id)}
                    tSettings={tSettings}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              {tCommon('pagination.page', { page, total: pageCount })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-md"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {tCommon('pagination.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-md"
                disabled={page >= pageCount}
                onClick={() => setPage((current) => current + 1)}
              >
                {tCommon('pagination.next')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TemplateRow = ({
  template,
  onEdit,
  onDuplicate,
  onSetDefault,
  onDelete,
  tSettings
}: {
  template: DocumentTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  tSettings: any;
}) => (
  <TableRow className="hover:bg-muted/30">
    <TableCell>
      <div className="flex items-center gap-2">
        <span className="font-medium">{template.name}</span>
        {template.isDefault ? (
          <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
            <Star className="h-3 w-3 fill-current" />
            {tSettings('pdf_templates.badges.default')}
          </Badge>
        ) : null}
      </div>
    </TableCell>
    <TableCell className="capitalize">{template.documentType.replace(/_/g, ' ').toLowerCase()}</TableCell>
    <TableCell>
      <Badge variant={template.status === DOCUMENT_TEMPLATE_STATUS.PUBLISHED ? 'default' : 'outline'} className="capitalize">
        {template.status.toLowerCase()}
      </Badge>
    </TableCell>
    <TableCell className="text-muted-foreground">v{template.versionNumber}</TableCell>
    <TableCell>
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title={tSettings('pdf_templates.actions.edit')} onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title={tSettings('pdf_templates.actions.duplicate')} onClick={onDuplicate}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-8 w-8", template.isDefault ? "text-amber-500" : "text-muted-foreground hover:text-amber-500")}
          title={tSettings('pdf_templates.actions.set_default')} 
          onClick={onSetDefault}
          disabled={template.isDefault || template.status !== DOCUMENT_TEMPLATE_STATUS.PUBLISHED}
        >
          <Star className={cn("h-4 w-4", template.isDefault && "fill-current")} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          title={tSettings('pdf_templates.actions.delete')} 
          onClick={onDelete}
          disabled={template.isDefault}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
);
