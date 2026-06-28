import { CustomerOrderUpdateForm } from '@/components/buying/supplier-order/CustomerOrderUpdateForm';

interface SupplierOrderUpdateFormProps {
  supplierOrderId: string;
}

export const SupplierOrderUpdateForm = ({ supplierOrderId }: SupplierOrderUpdateFormProps) => (
  <CustomerOrderUpdateForm
    customerOrderId={supplierOrderId}
    listPath="/buying/commandes-fournisseurs"
  />
);
