import { DeliveryNotePortal } from '@/components/buying/goods-receipt-note/DeliveryNotePortal';

interface GoodsReceiptNotePortalProps {
  className?: string;
}

export const GoodsReceiptNotePortal = ({ className = 'py-6' }: GoodsReceiptNotePortalProps) => (
  <DeliveryNotePortal
    className={className}
    rootPath="/buying"
    listPath="/buying/bons-reception"
    newPath="/buying/nouveau-bon-reception"
    detailPathPrefix="/buying/bon-reception"
    linkedInvoicePathPrefix="/buying/facture-achat"
  />
);
