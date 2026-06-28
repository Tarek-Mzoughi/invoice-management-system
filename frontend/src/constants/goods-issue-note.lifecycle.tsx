import { GOODS_ISSUE_NOTE_STATUS } from '@/types';
import {
  Archive,
  Copy,
  FilePlus,
  Printer,
  Save,
  Send,
  Trash,
  X
} from 'lucide-react';

export interface GoodsIssueNoteLifecycle {
  label: string;
  variant: 'default' | 'outline';
  icon: React.ReactNode;
  when: { set: (GOODS_ISSUE_NOTE_STATUS | undefined)[]; membership: 'IN' | 'OUT' };
}

export const GOODS_ISSUE_NOTE_LIFECYCLE_ACTIONS: Record<string, GoodsIssueNoteLifecycle> = {
  save: {
    label: 'commands.save',
    variant: 'default',
    icon: <Save className="h-5 w-5" />,
    when: {
      membership: 'OUT',
      set: [undefined]
    }
  },
  draft: {
    label: 'commands.draft',
    variant: 'default',
    icon: <Save className="h-5 w-5" />,
    when: { membership: 'IN', set: [undefined] }
  },
  created: {
    label: 'commands.create',
    variant: 'default',
    icon: <FilePlus className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [undefined, GOODS_ISSUE_NOTE_STATUS.Draft]
    }
  },
  issued: {
    label: 'goodsIssueNote.status.issued',
    variant: 'default',
    icon: <Send className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [
        undefined,
        GOODS_ISSUE_NOTE_STATUS.Draft,
        GOODS_ISSUE_NOTE_STATUS.Created
      ]
    }
  },
  cancelled: {
    label: 'commands.cancel',
    variant: 'default',
    icon: <X className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [GOODS_ISSUE_NOTE_STATUS.Draft, GOODS_ISSUE_NOTE_STATUS.Created]
    }
  },
  duplicate: {
    label: 'commands.duplicate',
    variant: 'default',
    icon: <Copy className="h-5 w-5" />,
    when: {
      membership: 'OUT',
      set: [undefined]
    }
  },
  download: {
    label: 'commands.download',
    variant: 'default',
    icon: <Printer className="h-5 w-5" />,
    when: {
      membership: 'OUT',
      set: [undefined]
    }
  },
  delete: {
    label: 'commands.delete',
    variant: 'default',
    icon: <Trash className="h-5 w-5" />,
    when: {
      membership: 'OUT',
      set: [undefined, GOODS_ISSUE_NOTE_STATUS.Issued]
    }
  },
  archive: {
    label: 'commands.archive',
    variant: 'outline',
    icon: <Archive className="h-5 w-5" />,
    when: { set: [], membership: 'OUT' }
  },
  reset: {
    label: 'commands.initialize',
    variant: 'outline',
    icon: <X className="h-5 w-5" />,
    when: {
      membership: 'OUT',
      set: [undefined]
    }
  }
};
