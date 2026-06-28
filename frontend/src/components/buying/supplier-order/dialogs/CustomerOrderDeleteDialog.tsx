import React from 'react';
import { GenericDeleteDialog } from '@/features/invoicing/shared/dialogs';
interface CustomerOrderDeleteDialogProps {
  className?: string;
  id?: number;
  sequential: string;
  open: boolean;
  deleteCustomerOrder: () => void;
  isDeletionPending?: boolean;
  scope?: 'selling' | 'buying';
  onClose: () => void;
}
export const CustomerOrderDeleteDialog: React.FC<CustomerOrderDeleteDialogProps> = ({
  id,
  sequential,
  open,
  deleteCustomerOrder,
  isDeletionPending,
  scope = 'buying',
  onClose,
  className
}) => (
  <GenericDeleteDialog
    id={id}
    sequential={sequential}
    documentLabel={'la commande fournisseur'}
    open={open}
    onDelete={deleteCustomerOrder}
    isPending={isDeletionPending}
    onClose={onClose}
    className={className}
  />
);
