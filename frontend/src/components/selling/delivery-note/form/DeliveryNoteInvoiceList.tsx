import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Invoice } from '@/types';
import useSellingInvoiceLabels from '@/hooks/content/useSellingInvoiceLabels';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface DeliveryNoteInvoiceListProps {
  className?: string;
  invoices: Invoice[];
  detailPathPrefix?: string;
}

export const DeliveryNoteInvoiceList = ({
  className,
  invoices,
  detailPathPrefix = '/selling/invoice'
}: DeliveryNoteInvoiceListProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const isBuying = detailPathPrefix.startsWith('/buying');
  const invoiceLabels = useSellingInvoiceLabels({
    enabled: !isBuying,
    scope: isBuying ? 'buying' : 'selling'
  });
  return (
    <Accordion type="multiple" className={cn(className)}>
      <AccordionItem value="invoice-list">
        <AccordionTrigger>
          <h1 className="font-bold">{tInvoicing('invoice.invoice_list')}</h1>
        </AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc list-inside space-y-0.5">
            {invoices
              .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
              .map((invoice, index) => (
                <li key={invoice.id} className="font-medium">
                  <Label>
                    <span>{`${invoiceLabels.singular} ${(index + 1).toString().padStart(2, '0')} : `}</span>
                  </Label>
                  <Link
                    className="underline cursor-pointer"
                    href={`${detailPathPrefix}/${invoice.id}`}
                  >
                    {(isBuying ? invoice.reference || invoice.sequential : invoice.sequential) ||
                      '-'}
                  </Link>
                </li>
              ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
