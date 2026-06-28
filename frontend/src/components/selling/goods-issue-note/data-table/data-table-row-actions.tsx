import { useRouter } from 'next/router';
import { GOODS_ISSUE_NOTE_STATUS, GoodsIssueNote } from '@/types';
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
import { Copy, Download, Settings2, Telescope, Trash2 } from 'lucide-react';
import { useGoodsIssueNoteManager } from '../hooks/useGoodsIssueNoteManager';
import { useGoodsIssueNoteActions } from './ActionsContext';

interface DataTableRowActionsProps {
  row: Row<GoodsIssueNote>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const goodsIssueNote = row.original;
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const goodsIssueNoteManager = useGoodsIssueNoteManager();
  const { openDeleteDialog, openDownloadDialog, openDuplicateDialog } = useGoodsIssueNoteActions();

  const targetGoodsIssueNote = () => {
    goodsIssueNoteManager.set('id', goodsIssueNote?.id);
    goodsIssueNoteManager.set('sequential', goodsIssueNote?.sequential);
    goodsIssueNoteManager.set('status', goodsIssueNote?.status);
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
        <DropdownMenuItem
          onClick={() => router.push('/selling/goods-issue-note/' + goodsIssueNote.id)}
        >
          <Telescope className="h-5 w-5 mr-2" /> {tCommon('commands.inspect')}
        </DropdownMenuItem>
        {/* Print */}
        <DropdownMenuItem
          onClick={() => {
            targetGoodsIssueNote();
            openDownloadDialog?.();
          }}
        >
          <Download className="h-5 w-5 mr-2" /> {tCommon('commands.download')}
        </DropdownMenuItem>
        {/* Duplicate */}
        <DropdownMenuItem
          onClick={() => {
            targetGoodsIssueNote();
            openDuplicateDialog?.();
          }}
        >
          <Copy className="h-5 w-5 mr-2" /> {tCommon('commands.duplicate')}
        </DropdownMenuItem>
        {(goodsIssueNote.status == GOODS_ISSUE_NOTE_STATUS.Draft ||
          goodsIssueNote.status == GOODS_ISSUE_NOTE_STATUS.Validated ||
          goodsIssueNote.status == GOODS_ISSUE_NOTE_STATUS.Sent) && (
          <DropdownMenuItem
            onClick={() => router.push('/selling/goods-issue-note/' + goodsIssueNote.id)}
          >
            <Settings2 className="h-5 w-5 mr-2" /> {tCommon('commands.modify')}
          </DropdownMenuItem>
        )}
        {goodsIssueNote.status != GOODS_ISSUE_NOTE_STATUS.Sent && (
          <DropdownMenuItem
            onClick={() => {
              targetGoodsIssueNote();
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
