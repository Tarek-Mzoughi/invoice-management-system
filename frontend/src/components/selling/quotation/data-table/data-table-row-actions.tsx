import { useRouter } from 'next/router';
import { QUOTATION_STATUS, Quotation } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Copy, Download, FileCheck, Settings2, Telescope, Trash2 } from 'lucide-react';
import { useQuotationManager } from '../hooks/useQuotationManager';
import { useQuotationActions } from './ActionsContext';

interface DataTableRowActionsProps {
  row: Row<Quotation>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const quotation = row.original;
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const quotationManager = useQuotationManager();
  const { openDeleteDialog, openDownloadDialog, openDuplicateDialog, openInvoiceDialog } =
    useQuotationActions();

  const targetQuotation = () => {
    quotationManager.set('id', quotation?.id);
    quotationManager.set('sequential', quotation?.sequential);
    quotationManager.set('status', quotation?.status);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-[160px]">
        <DropdownMenuLabel className="text-center">{tCommon('commands.actions')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Inspect */}
        <DropdownMenuItem onClick={() => router.push('/selling/quotation/' + quotation.id)}>
          <Telescope className="h-5 w-5 mr-2" /> {tCommon('commands.inspect')}
        </DropdownMenuItem>
        {/* Print */}
        <DropdownMenuItem
          onClick={() => {
            targetQuotation();
            openDownloadDialog?.();
          }}
        >
          <Download className="h-5 w-5 mr-2" /> {tCommon('commands.download')}
        </DropdownMenuItem>
        {/* Duplicate */}
        <DropdownMenuItem
          onClick={() => {
            targetQuotation();
            openDuplicateDialog?.();
          }}
        >
          <Copy className="h-5 w-5 mr-2" /> {tCommon('commands.duplicate')}
        </DropdownMenuItem>
        {(quotation.status == QUOTATION_STATUS.Draft ||
          quotation.status == QUOTATION_STATUS.Validated ||
          quotation.status == QUOTATION_STATUS.Sent) && (
          <DropdownMenuItem onClick={() => router.push('/selling/quotation/' + quotation.id)}>
            <Settings2 className="h-5 w-5 mr-2" /> {tCommon('commands.modify')}
          </DropdownMenuItem>
        )}
        {(quotation.status == QUOTATION_STATUS.Accepted ||
          quotation.status == QUOTATION_STATUS.Invoiced) && (
          <DropdownMenuItem
            onClick={() => {
              targetQuotation();
              openInvoiceDialog?.();
            }}
          >
            <FileCheck className="h-5 w-5 mr-2" /> {tCommon('commands.to_invoice')}
          </DropdownMenuItem>
        )}
        {quotation.status != QUOTATION_STATUS.Sent && (
          <DropdownMenuItem
            onClick={() => {
              targetQuotation();
              openDeleteDialog?.();
            }}
          >
            <Trash2 className="h-5 w-5 mr-2" /> {tCommon('commands.delete')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
