import { DeliveryNoteCreateForm } from '@/components/buying/goods-receipt-note/DeliveryNoteCreateForm';

interface GoodsReceiptNoteCreateFormProps {
  firmId?: string;
}

export const GoodsReceiptNoteCreateForm = ({ firmId }: GoodsReceiptNoteCreateFormProps) => (
  <DeliveryNoteCreateForm firmId={firmId} listPath="/buying/bons-reception" />
);
