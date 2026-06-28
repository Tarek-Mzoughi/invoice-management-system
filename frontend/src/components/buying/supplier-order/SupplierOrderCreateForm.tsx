import { CustomerOrderCreateForm } from '@/components/buying/supplier-order/CustomerOrderCreateForm';

interface SupplierOrderCreateFormProps {
  firmId?: string;
}

export const SupplierOrderCreateForm = ({ firmId }: SupplierOrderCreateFormProps) => (
  <CustomerOrderCreateForm firmId={firmId} listPath="/buying/commandes-fournisseurs" />
);
