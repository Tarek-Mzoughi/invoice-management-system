import { BadRequestException, NotFoundException } from '@nestjs/common';
import { format } from 'date-fns';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { StorageEntity } from 'src/shared/storage/entities/storage.entity';
import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../../enums/document-template-document-type.enum';
import { GenericDocumentTemplateData } from '../../interfaces/template-engine.interface';
import { TemplateDocumentDataMapper } from '../../interfaces/template-document-data-mapper.interface';
import { getSampleTemplateData } from './sample-template-data';

export abstract class BaseDocumentTemplateDataMapper
  implements TemplateDocumentDataMapper
{
  abstract readonly documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE;
  abstract readonly defaultTitle: string;
  abstract readonly entriesKey: string;
  abstract readonly metaDataKey: string;

  constructor(protected readonly service: any) {}

  async map(
    documentId?: number,
    cabinetId?: number,
  ): Promise<GenericDocumentTemplateData> {
    if (!documentId) return getSampleTemplateData(this.documentType);

    const filters = [`id||$eq||${documentId}`];
    if (cabinetId) filters.push(`cabinetId||$eq||${cabinetId}`);

    const entrySuffix = this.getEntrySuffix();
    const entity = await this.service.findOneByCondition({
      filter: filters.join(';'),
      join: [
        'firm',
        'cabinet',
        'currency',
        'bankAccount',
        'interlocutor',
        'cabinet.address',
        'cabinet.logo',
        'cabinet.signature',
        'cabinet.stamp',
        this.metaDataKey,
        'firm.deliveryAddress',
        'firm.invoicingAddress',
        this.entriesKey,
        `${this.entriesKey}.article`,
        `${this.entriesKey}.article${entrySuffix}Taxes`,
        `${this.entriesKey}.article${entrySuffix}Taxes.tax`,
      ].join(','),
    });

    if (!entity) {
      throw new NotFoundException(`${this.defaultTitle} not found`);
    }

    if (cabinetId && entity.cabinetId !== cabinetId) {
      throw new NotFoundException(`${this.defaultTitle} not found`);
    }

    return this.toTemplateData(entity);
  }

  protected abstract getEntrySuffix(): string;

  protected toTemplateData(entity: any): GenericDocumentTemplateData {
    const cabinet = entity.cabinet;
    const firm = entity.firm;
    const isBuying = entity.activityType === ACTIVITY_TYPE.BUYING;
    const visibleNumber = isBuying
      ? entity.reference || entity.sequential
      : entity.sequential;
    const paid = this.toNumber(entity.amountPaid || entity.amountSettled || 0);
    const totalHT = this.toNumber(entity.subTotal);
    const totalTTC = this.toNumber(entity.total);
    const totalTVA = Math.max(totalTTC - totalHT, 0);

    const partner = {
      name: firm?.name || '',
      address: this.formatAddress(firm?.invoicingAddress),
      billingAddress: this.formatAddress(firm?.invoicingAddress),
      shippingAddress: this.formatAddress(firm?.deliveryAddress),
      deliveryAddress: this.formatAddress(firm?.deliveryAddress),
      email: entity.interlocutor?.email || '',
      phone: entity.interlocutor?.phone || firm?.phone || '',
      taxNumber: firm?.taxIdNumber || '',
      contactName: this.formatContact(entity.interlocutor),
    };

    const entries = entity[this.entriesKey] || [];

    return {
      company: {
        name: cabinet?.enterpriseName || '',
        address: this.formatAddress(cabinet?.address),
        logo: this.mapStorageReference(cabinet?.logo),
        taxNumber: cabinet?.taxIdNumber || '',
        email: cabinet?.email || '',
        phone: cabinet?.phone || '',
        website: cabinet?.website || '',
      },
      client: isBuying ? null : partner,
      supplier: isBuying ? partner : null,
      partner, // Added at root for generic template binding
      document: {
        id: entity.id,
        title: isBuying
          ? `${this.defaultTitle} FOURNISSEUR`
          : this.defaultTitle,
        number: visibleNumber || '',
        sequential: entity.sequential || '',
        reference: entity.reference || '',
        date: this.formatDate(entity.date),
        dueDate: this.formatDate(entity.dueDate),
        status: entity.status || '',
        currency:
          entity.currency?.code ||
          entity.currency?.symbol ||
          entity.currency?.label ||
          '',
        object: entity.object || '',
        notes: entity.notes || '',
        generalConditions: entity.generalConditions || '',
      },
      items: entries.map((entry: any, index: number) =>
        this.mapItem(entry, index),
      ),
      totals: {
        totalHT,
        totalTVA,
        totalTTC,
        paid,
        remaining: Math.max(totalTTC - paid, 0),
        amountInWords: String(totalTTC),
        discount: this.toNumber(entity.discount),
        taxWithholding: this.toNumber(entity.taxWithholdingAmount || 0),
      },
      payments: (entity.payments || []).map((entry: any) => ({
        amount: this.toNumber(entry.amount),
        date: this.formatDate(entry.payment?.date),
        mode: entry.payment?.mode || '',
        reference: entry.payment?.reference || '',
        notes: entry.payment?.notes || '',
      })),
      bank: {
        name: entity.bankAccount?.name || '',
        rib: entity.bankAccount?.rib || '',
        iban: entity.bankAccount?.iban || '',
        swift: entity.bankAccount?.bic || '',
        agency: entity.bankAccount?.agency || '',
        details: this.formatBankDetails(entity.bankAccount),
      },
      signature: {
        signature: this.mapStorageReference(cabinet?.signature),
        stamp: this.mapStorageReference(cabinet?.stamp),
      },
    };
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

  private mapItem(entry: any, index: number): Record<string, unknown> {
    const article = entry.article;
    return {
      index: index + 1,
      reference: article?.reference || '',
      name: article?.title || '',
      description: article?.description || '',
      quantity: this.toNumber(entry.quantity),
      unit: article?.unit || '',
      unitPrice: this.toNumber(entry.unit_price),
      discount: this.toNumber(entry.discount),
      taxRate: this.resolveTaxRate(entry),
      totalHT: this.toNumber(entry.subTotal),
      totalTTC: this.toNumber(entry.total),
    };
  }

  private resolveTaxRate(entry: any): number {
    const entrySuffix = this.getEntrySuffix();
    const taxesKey = `article${entrySuffix}Taxes`;
    const taxes = entry[taxesKey] || [];
    const tax = taxes[0]?.tax;
    if (!tax) return 0;
    const value = this.toNumber(tax.value);
    return tax.isRate && value <= 1 ? value * 100 : value;
  }

  private formatDate(value?: Date | string | null): string {
    if (!value) return '';
    try {
      return format(new Date(value), 'dd/MM/yyyy');
    } catch {
      return '';
    }
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

  private formatContact(
    contact?: { name?: string; surname?: string; email?: string } | null,
  ): string {
    if (!contact) return '';
    return (
      [contact.surname, contact.name].filter(Boolean).join(' ') ||
      contact.email ||
      ''
    );
  }

  private formatBankDetails(bankAccount?: any): string {
    if (!bankAccount) return '';
    return [
      bankAccount.name ? `Banque: ${bankAccount.name}` : '',
      bankAccount.agency ? `Agence: ${bankAccount.agency}` : '',
      bankAccount.rib ? `RIB: ${bankAccount.rib}` : '',
      bankAccount.iban ? `IBAN: ${bankAccount.iban}` : '',
      bankAccount.bic || bankAccount.swift
        ? `SWIFT: ${bankAccount.bic || bankAccount.swift}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private toNumber(value?: number | string | null): number {
    const parsed = Number(value ?? 0);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException('Invalid numeric value');
    }
    return parsed;
  }
}
