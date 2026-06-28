import { DELIVERY_NOTE_STATUS } from '@/types';
import {
  Copy,
  FileCheck,
  FilePlus,
  Printer,
  Save,
  Trash,
  Truck,
  X
} from 'lucide-react';

export interface DeliveryNoteLifecycle {
  label: string;
  variant: 'default' | 'outline';
  icon: React.ReactNode;
  when: { set: (DELIVERY_NOTE_STATUS | undefined)[]; membership: 'IN' | 'OUT' };
}

export const DELIVERY_NOTE_LIFECYCLE_ACTIONS: Record<string, DeliveryNoteLifecycle> = {
  save: {
    label: 'commands.save',
    variant: 'default',
    icon: <Save className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [DELIVERY_NOTE_STATUS.Draft, DELIVERY_NOTE_STATUS.Created]
    }
  },
  draft: {
    label: 'commands.save',
    variant: 'default',
    icon: <Save className="h-5 w-5" />,
    when: { membership: 'IN', set: [undefined] }
  },
  created: {
    label: 'commands.validate',
    variant: 'default',
    icon: <FilePlus className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [undefined, DELIVERY_NOTE_STATUS.Draft]
    }
  },
  delivered: {
    label: 'commands.deliver',
    variant: 'default',
    icon: <Truck className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [DELIVERY_NOTE_STATUS.Draft, DELIVERY_NOTE_STATUS.Created]
    }
  },
  cancel: {
    label: 'commands.cancel',
    variant: 'default',
    icon: <X className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [DELIVERY_NOTE_STATUS.Draft, DELIVERY_NOTE_STATUS.Created]
    }
  },
  invoiced: {
    label: 'commands.to_invoice',
    variant: 'default',
    icon: <FileCheck className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [DELIVERY_NOTE_STATUS.Draft, DELIVERY_NOTE_STATUS.Created]
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
      membership: 'IN',
      set: [DELIVERY_NOTE_STATUS.Draft, DELIVERY_NOTE_STATUS.Created]
    }
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
