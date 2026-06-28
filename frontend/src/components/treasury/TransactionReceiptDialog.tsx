import React from 'react';
import { Download, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  TreasuryMovement,
  TREASURY_MOVEMENT_DIRECTION,
  TREASURY_MOVEMENT_KIND
} from '@/types';

const getIntlLocale = (language?: string) =>
  language?.toLowerCase().startsWith('fr') ? 'fr-FR' : 'en-US';

const formatReference = (movement: TreasuryMovement) => {
  const date = movement.movementDate ? new Date(movement.movementDate) : new Date(movement.createdAt || '');
  const year = date.getFullYear();
  const id = String(movement.id ?? 0).padStart(5, '0');
  return `TX-${year}-${id}`;
};

const formatDate = (movement: TreasuryMovement, locale: string) => {
  const date = movement.movementDate ? new Date(movement.movementDate) : null;
  if (!date) return '';

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const formatAmount = (
  amount: number,
  locale: string,
  currency?: { digitAfterComma?: number; symbol?: string; code?: string }
) => {
  const digits = currency?.digitAfterComma ?? 3;
  const symbol = currency?.symbol || currency?.code || 'DT';
  return `${amount.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })} ${symbol}`;
};

const getKindIcon = (kind?: TREASURY_MOVEMENT_KIND) => {
  switch (kind) {
    case TREASURY_MOVEMENT_KIND.EXPENSE:
      return '💰';
    case TREASURY_MOVEMENT_KIND.INCOME:
      return '📥';
    case TREASURY_MOVEMENT_KIND.TRANSFER:
      return '🔄';
    case TREASURY_MOVEMENT_KIND.ADJUSTMENT:
      return '⚙️';
    default:
      return '';
  }
};

const getKindTranslationKey = (kind?: TREASURY_MOVEMENT_KIND) => {
  switch (kind) {
    case TREASURY_MOVEMENT_KIND.EXPENSE:
      return 'expense';
    case TREASURY_MOVEMENT_KIND.INCOME:
      return 'income';
    case TREASURY_MOVEMENT_KIND.TRANSFER:
      return 'transfer';
    case TREASURY_MOVEMENT_KIND.ADJUSTMENT:
      return 'adjustment';
    default:
      return undefined;
  }
};

const getDirectionTranslationKey = (direction?: TREASURY_MOVEMENT_DIRECTION) => {
  switch (direction) {
    case TREASURY_MOVEMENT_DIRECTION.IN:
      return 'in';
    case TREASURY_MOVEMENT_DIRECTION.OUT:
      return 'out';
    default:
      return undefined;
  }
};

interface TransactionReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: TreasuryMovement | null;
  companyName?: string;
}

export const TransactionReceiptDialog: React.FC<TransactionReceiptDialogProps> = ({
  open,
  onClose,
  transaction,
  companyName
}) => {
  const { t: tCommon, i18n } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const locale = React.useMemo(
    () => getIntlLocale(i18n.resolvedLanguage || i18n.language),
    [i18n.language, i18n.resolvedLanguage]
  );

  if (!transaction) return null;

  const currency = transaction.currency || transaction.account?.currency;
  const amount = transaction.amount ?? 0;
  const isCredit = transaction.direction === TREASURY_MOVEMENT_DIRECTION.IN;
  const amountLabel = isCredit
    ? tSettings('treasury_transaction.receipt.amount_in_label')
    : tSettings('treasury_transaction.receipt.amount_out_label');
  const amountFieldLabel = isCredit
    ? tSettings('treasury_transaction.receipt.credit_amount_label')
    : tSettings('treasury_transaction.receipt.debit_amount_label');
  const reference = formatReference(transaction);
  const resolvedCompanyName =
    companyName || tSettings('treasury_transaction.receipt.company_fallback');
  const kindKey = getKindTranslationKey(transaction.kind);
  const directionKey = getDirectionTranslationKey(transaction.direction);

  const openPrintWindow = (autoPrint: boolean) => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${tSettings('treasury_transaction.receipt.window_title', { reference })}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; }
            .receipt { max-width: 700px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
            .company-name { font-size: 18px; font-weight: 600; }
            .receipt-title { font-size: 22px; font-weight: 700; text-align: right; }
            .receipt-meta { text-align: right; font-size: 12px; color: #666; margin-top: 4px; }
            .amount-box { border: 1px solid #e5e5e5; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 24px; }
            .amount-label { font-size: 13px; color: #666; margin-bottom: 6px; }
            .amount-value { font-size: 28px; font-weight: 700; }
            .details-title { font-size: 14px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px; margin-bottom: 16px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
            .detail-label { font-size: 11px; color: #888; margin-bottom: 2px; }
            .detail-value { font-size: 13px; font-weight: 500; }
            .category-badge { display: inline-flex; align-items: center; gap: 4px; background: #fef9c3; padding: 4px 10px; border-radius: 4px; font-size: 12px; }
            .section-border { border: 1px solid #e5e5e5; border-radius: 6px; padding: 20px; margin-bottom: 24px; }
            .motif-title { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
            .motif-value { font-size: 13px; color: #444; }
            .signatures { display: flex; justify-content: space-around; margin-top: 48px; padding-top: 24px; }
            .signature-block { text-align: center; }
            .signature-label { font-size: 12px; font-weight: 600; color: #555; }
            .signature-line { width: 180px; border-bottom: 1px solid #ccc; margin-top: 60px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    if (autoPrint) {
      printWindow.print();
      printWindow.close();
      return;
    }

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handlePrint = () => {
    openPrintWindow(true);
  };

  const handleDownload = () => {
    openPrintWindow(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        hideCloseButton
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto p-0"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {tSettings('treasury_transaction.receipt.title')}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1.5 rounded-sm border-zinc-200 text-sm dark:border-zinc-700"
              onClick={onClose}
            >
              {tCommon('commands.close')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1.5 rounded-sm border-zinc-200 text-sm dark:border-zinc-700"
              onClick={handleDownload}
            >
              <Download className="h-3.5 w-3.5" />
              {tCommon('commands.download')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1.5 rounded-sm border-zinc-200 text-sm dark:border-zinc-700"
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5" />
              {tCommon('commands.print')}
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div
            ref={receiptRef}
            className="mx-auto max-w-[660px] rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-white"
          >
            <div className="receipt">
              <div
                className="header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '32px'
                }}
              >
                <div className="company-name" style={{ fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
                  {resolvedCompanyName}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="receipt-title" style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a' }}>
                    {tSettings('treasury_transaction.receipt.header_title')}
                  </div>
                  <div className="receipt-meta" style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {tSettings('treasury_transaction.receipt.reference_label')} : {reference}
                    <br />
                    {tSettings('treasury_transaction.receipt.date_label')} : {formatDate(transaction, locale)}
                  </div>
                </div>
              </div>

              <div
                className="amount-box"
                style={{
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: '24px'
                }}
              >
                <div className="amount-label" style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                  {amountLabel}
                </div>
                <div className="amount-value" style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a' }}>
                  {formatAmount(amount, locale, currency)}
                </div>
              </div>

              <div
                className="section-border"
                style={{
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  padding: '20px',
                  marginBottom: '24px'
                }}
              >
                <div
                  className="details-title"
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e5e5e5',
                    paddingBottom: '8px',
                    marginBottom: '16px',
                    color: '#1a1a1a'
                  }}
                >
                  {tSettings('treasury_transaction.receipt.details_title')}
                </div>

                <div
                  className="details-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}
                >
                  <div className="detail-item">
                    <div className="detail-label" style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>
                      {tSettings('treasury_transaction.receipt.account_label')}
                    </div>
                    <div className="detail-value" style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>
                      {transaction.account?.name || '-'}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label" style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>
                      {tSettings('treasury_transaction.receipt.operation_date_label')}
                    </div>
                    <div className="detail-value" style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>
                      {formatDate(transaction, locale)}
                    </div>
                  </div>
                </div>

                <div
                  className="details-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}
                >
                  <div className="detail-item">
                    <div className="detail-label" style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>
                      {tSettings('treasury_transaction.receipt.type_label')}
                    </div>
                    <div className="detail-value" style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>
                      {directionKey ? tSettings(`treasury_transaction.directions.${directionKey}`) : ''}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label" style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>
                      {amountFieldLabel}
                    </div>
                    <div className="detail-value" style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>
                      {formatAmount(amount, locale, currency)}
                    </div>
                  </div>
                </div>

                {kindKey ? (
                  <div style={{ marginBottom: '0' }}>
                    <div className="detail-label" style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
                      {tSettings('treasury_transaction.receipt.category_label')}
                    </div>
                    <div
                      className="category-badge"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#fef9c3',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#1a1a1a'
                      }}
                    >
                      {getKindIcon(transaction.kind)} {tSettings(`treasury_transaction.kinds.${kindKey}`)}
                    </div>
                  </div>
                ) : null}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div className="motif-title" style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#1a1a1a' }}>
                  {tSettings('treasury_transaction.receipt.reason_label')}
                </div>
                <div className="motif-value" style={{ fontSize: '13px', color: '#444' }}>
                  {transaction.notes || transaction.label || '-'}
                </div>
              </div>

              <div
                className="signatures"
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  marginTop: '48px',
                  paddingTop: '24px'
                }}
              >
                <div className="signature-block" style={{ textAlign: 'center' }}>
                  <div className="signature-label" style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>
                    {tSettings('treasury_transaction.receipt.payer_signature')}
                  </div>
                  <div
                    className="signature-line"
                    style={{ width: '180px', borderBottom: '1px solid #ccc', marginTop: '60px' }}
                  />
                </div>
                <div className="signature-block" style={{ textAlign: 'center' }}>
                  <div className="signature-label" style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>
                    {tSettings('treasury_transaction.receipt.beneficiary_signature')}
                  </div>
                  <div
                    className="signature-line"
                    style={{ width: '180px', borderBottom: '1px solid #ccc', marginTop: '60px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
