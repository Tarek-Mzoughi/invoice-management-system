import { DeliveryNoteUpdateForm } from '@/components/buying/goods-receipt-note/DeliveryNoteUpdateForm';

interface GoodsReceiptNoteUpdateFormProps {
  goodsReceiptNoteId: string;
}

export const GoodsReceiptNoteUpdateForm = ({
  goodsReceiptNoteId
}: GoodsReceiptNoteUpdateFormProps) => (
  <DeliveryNoteUpdateForm deliveryNoteId={goodsReceiptNoteId} listPath="/buying/bons-reception" />
);
