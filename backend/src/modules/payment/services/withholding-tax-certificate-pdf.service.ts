import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import {
  GenericDocumentTemplateData,
  TemplateEngineService,
} from 'src/modules/document-template/interfaces/template-engine.interface';
import { TemplateImageResolverService } from 'src/modules/document-template/services/template-image-resolver.service';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../entities/payment.entity';
import { createDefaultWithholdingTaxCertificateTemplateSchema } from '../templates/withholding-tax-certificate-default-template';

export interface WithholdingTaxCertificatePdfResult {
  pdfBuffer: Buffer;
  filename: string;
}

@Injectable()
export class WithholdingTaxCertificatePdfService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly templateEngineService: TemplateEngineService,
    private readonly templateImageResolverService: TemplateImageResolverService,
  ) {}

  async generateCertificatePdf(
    paymentId: number,
  ): Promise<WithholdingTaxCertificatePdfResult> {
    const payment = await this.paymentRepository.findOne({
      where: { id: Number(paymentId) },
      relations: [
        'currency',
        'firm',
        'firm.currency',
        'firm.cabinet',
        'firm.cabinet.address',
        'firm.cabinet.stamp',
        'firm.invoicingAddress',
        'firm.deliveryAddress',
        'taxWithholding',
        'invoices',
        'invoices.invoice',
        'invoices.invoice.currency',
        'invoices.invoice.cabinet',
        'invoices.invoice.cabinet.address',
        'invoices.invoice.cabinet.stamp',
      ],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (this.toNumber(payment.taxWithholdingAmount) <= 0) {
      throw new BadRequestException(
        'Payment does not contain withholding tax.',
      );
    }

    const data = this.toCertificateData(payment);
    const filename = this.buildFilename(data);
    const schema = createDefaultWithholdingTaxCertificateTemplateSchema();
    const resolved =
      await this.templateImageResolverService.resolveTemplateImages(
        schema,
        data,
        {
          filename,
        },
      );
    const pdfBuffer = await this.templateEngineService.generatePdf(
      resolved.schema,
      resolved.data,
      {
        filename,
      },
    );

    return { pdfBuffer, filename };
  }

  private toCertificateData(
    payment: PaymentEntity,
  ): GenericDocumentTemplateData {
    const isBuying = payment.activityType === ACTIVITY_TYPE.BUYING;
    const cabinet = this.resolveCabinet(payment);
    const firm = payment.firm;
    const certificateRef = this.getCertificateReference(payment);
    const currency = this.getCurrencyLabel(payment.currency);
    const documents = (payment.invoices || []).map((entry, index) => {
      const invoice = entry.invoice;
      return {
        index: index + 1,
        id: entry.invoiceId,
        reference:
          (isBuying
            ? invoice?.reference || invoice?.sequential
            : invoice?.sequential) ||
          invoice?.reference ||
          `DOC-${entry.invoiceId}`,
        type: isBuying ? 'Facture fournisseur' : 'Facture client',
        date: this.formatDate(invoice?.date),
        amount: this.toNumber(entry.amount),
        currency: this.getCurrencyLabel(invoice?.currency || payment.currency),
      };
    });
    const baseAmount = documents.reduce(
      (sum, document) => sum + this.toNumber(document.amount),
      0,
    );
    const withholdingAmount = this.toNumber(payment.taxWithholdingAmount);
    const inferredRate =
      baseAmount > 0 ? (withholdingAmount / baseAmount) * 100 : 0;
    const rate = this.toNumber(payment.taxWithholding?.rate, inferredRate);
    const companyParty = {
      name: cabinet?.enterpriseName || '',
      taxNumber: cabinet?.taxIdNumber || '',
      address: this.formatAddress(cabinet?.address),
      phone: cabinet?.phone || '',
      email: cabinet?.email || '',
    };
    const partnerParty = {
      name: firm?.name || '',
      taxNumber: firm?.taxIdNumber || '',
      address: this.formatAddress(
        firm?.invoicingAddress || firm?.deliveryAddress,
      ),
      phone: firm?.phone || '',
    };

    return {
      certificate: {
        reference: certificateRef,
        date: this.formatDate(payment.taxWithholdingDate || payment.date),
        paymentReference: payment.reference || `PAY-${payment.id}`,
        documentReference: this.getDocumentReference(documents),
        activity: payment.activityType,
      },
      document: {
        currency,
      },
      payer: isBuying ? companyParty : partnerParty,
      beneficiary: isBuying ? partnerParty : companyParty,
      partner: partnerParty,
      company: companyParty,
      withholding: {
        id: payment.taxWithholdingId,
        label: payment.taxWithholding?.label || 'Retenue a la source',
        rate,
        rateLabel: `${this.formatNumber(rate, 2)} %`,
      },
      totals: {
        baseAmount,
        withholdingAmount,
        netAmount: Math.max(baseAmount - withholdingAmount, 0),
        currency,
      },
      documents,
      signature: {
        stamp: this.mapStorageReference(cabinet?.stamp),
      },
    };
  }

  private resolveCabinet(payment: PaymentEntity) {
    return (
      payment.firm?.cabinet ||
      payment.invoices?.find((entry) => entry.invoice?.cabinet)?.invoice
        ?.cabinet ||
      null
    );
  }

  private getCertificateReference(payment: PaymentEntity): string {
    const date = this.parseDate(payment.taxWithholdingDate || payment.date);
    const year = date?.getFullYear() || new Date().getFullYear();
    return `RSC-${year}-${String(payment.id).padStart(5, '0')}`;
  }

  private getDocumentReference(
    documents: Array<{ reference?: string | null }>,
  ): string {
    if (!documents.length) return 'Document non renseigne';
    if (documents.length > 1) return `${documents.length} documents`;
    return documents[0].reference || 'Document non renseigne';
  }

  private buildFilename(data: GenericDocumentTemplateData): string {
    const certificate = data.certificate as Record<string, unknown> | undefined;
    const reference = String(certificate?.reference || 'RSC')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `CERTIFICAT-RS-${reference || Date.now()}.pdf`;
  }

  private getCurrencyLabel(
    currency?: { code?: string; symbol?: string; label?: string } | null,
  ): string {
    return currency?.code || currency?.symbol || currency?.label || '';
  }

  private formatDate(value?: Date | string | null): string {
    const date = this.parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('fr-TN').format(date);
  }

  private parseDate(value?: Date | string | null): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
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

  private formatNumber(value: number, digits = 3): string {
    return Number(value || 0).toLocaleString('fr-TN', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  private toNumber(value?: number | string | null, fallback = 0): number {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
