import React from 'react';
import { GenericDuplicateDialog } from '@/features/invoicing/shared/dialogs';
interface CustomerOrderDuplicateDialogProps {
  className?: string;
  id: number;
  sequential: string;
  open: boolean;
  duplicateCustomerOrder: (includeFiles: boolean) => void;
  isDuplicationPending?: boolean;
  scope?: 'selling' | 'buying';
  onClose: () => void;
}
export const CustomerOrderDuplicateDialog: React.FC<CustomerOrderDuplicateDialogProps> = ({
  sequential,
  open,
  duplicateCustomerOrder,
  isDuplicationPending,
  scope = 'buying',
  onClose,
  className
}) => (
  <GenericDuplicateDialog
    sequential={sequential}
    documentLabel={'la commande fournisseur'}
    fileDuplicationLabel="Inclure les fichiers joints"
    open={open}
    onDuplicate={duplicateCustomerOrder}
    isPending={isDuplicationPending}
    onClose={onClose}
    className={className}
  />
);
