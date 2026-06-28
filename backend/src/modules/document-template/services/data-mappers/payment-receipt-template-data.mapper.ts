import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { PaymentEntity } from 'src/modules/payment/entities/payment.entity';
import { PAYMENT_COLLECTION_STATUS } from 'src/modules/payment/enums/payment-collection-status.enum';
import { PAYMENT_MODE } from 'src/modules/payment/enums/payment-mode.enum';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';
import { Repository } from 'typeorm';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../../enums/document-template-document-type.enum';
import { GenericDocumentTemplateData } from '../../interfaces/template-engine.interface';
import { TemplateDocumentDataMapper } from '../../interfaces/template-document-data-mapper.interface';
import { getSampleTemplateData } from './sample-template-data';

@Injectable()
export class PaymentReceiptTemplateDataMapper
  implements TemplateDocumentDataMapper
{
  readonly documentType = DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RECEIPT;

  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  async map(
    documentId?: number,
    cabinetId?: number,
  ): Promise<GenericDocumentTemplateData> {
    if (!documentId) return getSampleTemplateData(this.documentType);

    const expectedCabinetId = cabinetId ? Number(cabinetId) : undefined;
    const payment = await this.paymentRepository.findOne({
      where: expectedCabinetId
        ? { id: Number(documentId), cabinetId: expectedCabinetId }
        : { id: Number(documentId) },
      relations: [
        'currency',
        'firm',
        'firm.currency',
        'firm.cabinet',
        'firm.cabinet.address',
        'firm.cabinet.logo',
        'firm.cabinet.signature',
        'firm.cabinet.stamp',
        'firm.invoicingAddress',
        'firm.deliveryAddress',
        'treasuryAccount',
        'treasuryAccount.currency',
        'originTreasuryAccount',
        'originTreasuryAccount.currency',
        'taxWithholding',
        'uploads',
        'uploads.upload',
        'invoices',
        'invoices.invoice',
        'invoices.invoice.currency',
        'invoices.invoice.cabinet',
        'invoices.invoice.cabinet.address',
        'invoices.invoice.cabinet.logo',
        'invoices.invoice.cabinet.signature',
        'invoices.invoice.cabinet.stamp',
        'creditNotes',
        'creditNotes.creditNote',
        'creditNotes.creditNote.currency',
        'creditNotes.creditNote.cabinet',
        'creditNotes.creditNote.cabinet.address',
        'creditNotes.creditNote.cabinet.logo',
        'creditNotes.creditNote.cabinet.signature',
        'creditNotes.creditNote.cabinet.stamp',
        'creditNotes.originalCurrency',
        'creditNotes.convertedCurrency',
      ],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const resolvedCabinet = this.resolveCabinet(payment);
    const resolvedCabinetId = resolvedCabinet?.id || payment.cabinetId;

    if (!resolvedCabinetId) {
      throw new NotFoundException('Payment not found');
    }

    if (expectedCabinetId && resolvedCabinetId !== expectedCabinetId) {
      throw new NotFoundException('Payment not found');
    }

    return this.toTemplateData(payment, resolvedCabinetId);
  }

  private toTemplateData(
    payment: PaymentEntity,
    cabinetId: number,
  ): GenericDocumentTemplateData {
    const cabinet = this.resolveCabinet(payment);
    const firm = payment.firm;
    const isBuying = payment.activityType === ACTIVITY_TYPE.BUYING;
    const currency = this.getCurrencyLabel(payment.currency);
    const moneyAmount = this.toNumber(payment.amount);
    const fee = this.toNumber(payment.fee);
    const withholdingAmount = this.toNumber(payment.taxWithholdingAmount);
    const creditNoteUsedAmount = (payment.creditNotes || []).reduce(
      (sum, entry) =>
        sum +
        this.toNumber(
          entry.convertedAmount == null ? entry.amount : entry.convertedAmount,
        ),
      0,
    );
    const totalDocumentCoverage = (payment.invoices || []).reduce(
      (sum, entry) => sum + this.toNumber(entry.amount),
      0,
    );
    const receiptNumber = this.getReceiptNumber(payment);

    const partner = {
      id: firm?.id || null,
      type: isBuying ? 'supplier' : 'client',
      label: isBuying ? 'Fournisseur' : 'Client',
      name: firm?.name || '',
      address: this.formatAddress(firm?.invoicingAddress),
      billingAddress: this.formatAddress(firm?.invoicingAddress),
      deliveryAddress: this.formatAddress(firm?.deliveryAddress),
      phone: firm?.phone || '',
      taxNumber: firm?.taxIdNumber || '',
      currency: this.getCurrencyLabel(firm?.currency),
    };

    const allocations = (payment.invoices || []).map((entry, index) => {
      const invoice = entry.invoice;
      const invoiceTotal = this.toNumber(invoice?.total);
      const settled = this.toNumber(
        invoice?.amountSettled || invoice?.amountPaid,
      );
      return {
        index: index + 1,
        id: entry.id,
        invoiceId: entry.invoiceId,
        reference:
          (isBuying
            ? invoice?.reference || invoice?.sequential
            : invoice?.sequential) ||
          invoice?.reference ||
          `DOC-${entry.invoiceId}`,
        documentType: isBuying ? 'Facture fournisseur' : 'Facture client',
        date: this.formatDate(invoice?.date),
        dueDate: this.formatDate(invoice?.dueDate),
        status: invoice?.status || '',
        currency: this.getCurrencyLabel(invoice?.currency),
        amount: this.toNumber(entry.amount),
        total: invoiceTotal,
        remaining: Math.max(invoiceTotal - settled, 0),
      };
    });

    const creditNotes = (payment.creditNotes || []).map((entry, index) => {
      const creditNote = entry.creditNote;
      const originalAmount = this.toNumber(entry.amount);
      const convertedAmount = this.toNumber(
        entry.convertedAmount == null ? entry.amount : entry.convertedAmount,
      );
      const remainingCredit = Math.max(
        this.toNumber(creditNote?.total) -
          this.toNumber(creditNote?.amountPaid),
        0,
      );

      return {
        index: index + 1,
        id: entry.id,
        creditNoteId: entry.creditNoteId,
        reference:
          creditNote?.sequential ||
          creditNote?.reference ||
          `AVOIR-${entry.creditNoteId}`,
        originalCurrency: this.getCurrencyLabel(
          entry.originalCurrency || creditNote?.currency,
        ),
        originalAmount,
        exchangeRateToPaymentCurrency: this.toNumber(
          entry.exchangeRateToPaymentCurrency || 1,
        ),
        convertedAmount,
        convertedCurrency: this.getCurrencyLabel(
          entry.convertedCurrency || payment.currency,
        ),
        remainingCredit,
        status: creditNote?.status || '',
      };
    });

    const attachments = (payment.uploads || []).map((entry, index) => ({
      index: index + 1,
      id: entry.uploadId,
      filename: entry.upload?.filename || '',
      mimeType: entry.upload?.mimeType || '',
    }));

    return {
      company: {
        id: cabinetId,
        name: cabinet?.enterpriseName || '',
        address: this.formatAddress(cabinet?.address),
        logo: this.mapStorageReference(cabinet?.logo),
        taxNumber: cabinet?.taxIdNumber || '',
        email: cabinet?.email || '',
        phone: cabinet?.phone || '',
        website: cabinet?.website || '',
      },
      partner,
      client: isBuying ? null : partner,
      supplier: isBuying ? partner : null,
      document: {
        id: payment.id,
        type: this.documentType,
        title: 'RECU DE PAIEMENT',
        number: receiptNumber,
        reference: payment.reference || receiptNumber,
        date: this.formatDate(payment.date),
        currency,
      },
      payment: {
        id: payment.id,
        number: receiptNumber,
        reference: payment.reference || receiptNumber,
        date: this.formatDate(payment.date),
        rawMode: payment.mode || '',
        modeLabel: this.getModeLabel(payment.mode),
        rawStatus: payment.collectionStatus || '',
        statusLabel: this.getCollectionStatusLabel(payment.collectionStatus),
        direction: isBuying ? 'Paiement fournisseur' : 'Encaissement client',
        activity: payment.activityType,
        externalReference: payment.reference || '',
        notes: payment.notes || '',
        convertionRate: this.toNumber(payment.convertionRate || 1),
      },
      totals: {
        moneyAmount,
        fee,
        withholdingAmount,
        creditNoteUsedAmount,
        totalDocumentCoverage,
        finalTreasuryAmount: moneyAmount,
        treasuryMovementAmount: moneyAmount,
        currency,
      },
      allocations,
      creditNotes,
      treasury: {
        accountName: payment.treasuryAccount?.name || '',
        accountType: payment.treasuryAccount?.type || '',
        movementId: payment.encashmentMovementId || null,
        movementReference: payment.encashmentMovementId
          ? `TR-${payment.encashmentMovementId}`
          : '',
        amount: moneyAmount,
        currency,
      },
      attachments: {
        count: attachments.length,
        files: attachments,
        names: attachments.map((attachment) => attachment.filename).join(', '),
      },
      signature: {
        signature: this.mapStorageReference(cabinet?.signature),
        stamp: this.mapStorageReference(cabinet?.stamp),
      },
    };
  }

  private resolveCabinet(payment: PaymentEntity) {
    return (
      payment.firm?.cabinet ||
      payment.invoices?.find((entry) => entry.invoice?.cabinet)?.invoice
        ?.cabinet ||
      payment.creditNotes?.find((entry) => entry.creditNote?.cabinet)
        ?.creditNote?.cabinet ||
      null
    );
  }

  private getReceiptNumber(payment: PaymentEntity): string {
    return payment.reference?.trim() || `PAY-${payment.id}`;
  }

  private getCurrencyLabel(
    currency?: { code?: string; symbol?: string; label?: string } | null,
  ): string {
    return currency?.code || currency?.symbol || currency?.label || '';
  }

  private getModeLabel(mode?: PAYMENT_MODE | null): string {
    switch (mode) {
      case PAYMENT_MODE.Cash:
        return 'Especes';
      case PAYMENT_MODE.CreditCard:
        return 'Carte bancaire';
      case PAYMENT_MODE.Check:
        return 'Cheque';
      case PAYMENT_MODE.BillOfExchange:
        return 'Traite';
      case PAYMENT_MODE.BankTransfer:
        return 'Remise bancaire';
      case PAYMENT_MODE.WireTransfer:
        return 'Virement bancaire';
      case PAYMENT_MODE.CreditNoteSettlement:
        return 'Avoir / Compensation par avoir';
      default:
        return mode || '';
    }
  }

  private getCollectionStatusLabel(
    status?: PAYMENT_COLLECTION_STATUS | null,
  ): string {
    switch (status) {
      case PAYMENT_COLLECTION_STATUS.PAID:
      case PAYMENT_COLLECTION_STATUS.PAID_SUPPLIER:
        return 'Paye';
      case PAYMENT_COLLECTION_STATUS.DEPOSITED:
      case PAYMENT_COLLECTION_STATUS.DEPOSITED_SUPPLIER:
        return 'Depose';
      case PAYMENT_COLLECTION_STATUS.REJECTED:
        return 'Rejete';
      case PAYMENT_COLLECTION_STATUS.CANCELLED:
        return 'Annule';
      case PAYMENT_COLLECTION_STATUS.PENDING:
        return 'En attente';
      default:
        return status || '';
    }
  }

  private formatDate(value?: Date | string | null): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('fr-TN').format(date);
  }

  private formatAddress(
    address?: {
      address?: string;
      address2?: string;
      region?: string;
      zipcode?: string;
      country?: unknown;
    } | null,
  ): string {
    if (!address) return '';
    const country =
      address.country && typeof address.country === 'object'
        ? (address.country as Record<string, unknown>)
        : null;
    return [
      address.address,
      address.address2,
      address.region,
      address.zipcode,
      country?.name ||
        country?.label ||
        country?.alpha2Code ||
        country?.alpha3Code,
    ]
      .filter(Boolean)
      .join(', ');
  }

  private mapStorageReference(
    storage?: StorageEntity | null,
  ): Record<string, unknown> | string {
    if (!storage) return '';
    return {
      id: storage.id,
      slug: storage.slug,
      relativePath: storage.relativePath,
      mimeType: storage.mimeType,
      filename: storage.filename,
      size: storage.size,
    };
  }

  private toNumber(value?: number | string | null): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
