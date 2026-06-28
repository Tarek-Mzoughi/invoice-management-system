import { CUSTOMER_ORDER_STATUS } from '@/types';
import {
  Copy,
  FileCheck,
  FilePlus,
  Printer,
  Save,
  Trash,
  X
} from 'lucide-react';

export interface CustomerOrderLifecycle {
  label: string;
  variant: 'default' | 'outline';
  icon: React.ReactNode;
  when: { set: (CUSTOMER_ORDER_STATUS | undefined)[]; membership: 'IN' | 'OUT' };
}

export const CUSTOMER_ORDER_LIFECYCLE_ACTIONS: Record<string, CustomerOrderLifecycle> = {
  save: {
    label: 'commands.save',
    variant: 'default',
    icon: <Save className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [CUSTOMER_ORDER_STATUS.Draft, CUSTOMER_ORDER_STATUS.Created]
    }
  },
  draft: {
    label: 'commands.save',
    variant: 'default',
    icon: <Save className="h-5 w-5" />,
    when: { membership: 'IN', set: [undefined] }
  },
  validated: {
    label: 'commands.validate',
    variant: 'default',
    icon: <FilePlus className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [undefined, CUSTOMER_ORDER_STATUS.Draft]
    }
  },
  cancel: {
    label: 'commands.cancel',
    variant: 'default',
    icon: <X className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [CUSTOMER_ORDER_STATUS.Draft, CUSTOMER_ORDER_STATUS.Created]
    }
  },
  invoiced: {
    label: 'commands.to_invoice',
    variant: 'default',
    icon: <FileCheck className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [CUSTOMER_ORDER_STATUS.Draft, CUSTOMER_ORDER_STATUS.Created]
    }
  },
  to_delivery_note: {
    label: 'commands.to_delivery_note',
    variant: 'default',
    icon: <FileCheck className="h-5 w-5" />,
    when: {
      membership: 'IN',
      set: [CUSTOMER_ORDER_STATUS.Draft, CUSTOMER_ORDER_STATUS.Created]
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
      set: [CUSTOMER_ORDER_STATUS.Draft, CUSTOMER_ORDER_STATUS.Created]
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
