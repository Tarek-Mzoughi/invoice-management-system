import { BankAccount, Tax } from '@/types';
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
import { Settings2, Trash2 } from 'lucide-react';
import { useTaxManager } from '../hooks/useTaxManager';
import { useTaxActions } from './ActionDialogContext';

interface DataTableRowActionsProps {
  row: Row<Tax>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const tax = row.original;
  const { t: tCommon } = useTranslation('common');
  const taxManager = useTaxManager();
  const { openUpdateTaxSheet, openDeleteTaxDialog } = useTaxActions();
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
        <DropdownMenuItem
          onClick={() => {
            taxManager.setTax(tax);
            openUpdateTaxSheet();
          }}>
          <Settings2 className="h-5 w-5 mr-2" /> {tCommon('commands.modify')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            taxManager.setTax(tax);
            openDeleteTaxDialog();
          }}>
          <Trash2 className="h-5 w-5 mr-2" /> {tCommon('commands.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
