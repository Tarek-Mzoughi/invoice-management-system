import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE, DOCUMENT_TEMPLATE_ELEMENT_TYPE } from '@/types';
import { TemplateVariableGroup } from '../types/template-editor.types';

const supplierDocumentTypes = new Set<DOCUMENT_TEMPLATE_DOCUMENT_TYPE>([
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.PURCHASE_ORDER,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_INVOICE,
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_CREDIT_NOTE
]);

export const getTemplateVariableGroups = (
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE
): TemplateVariableGroup[] => {
  const partyPrefix = supplierDocumentTypes.has(documentType) ? 'supplier' : 'client';
  const partyLabel = supplierDocumentTypes.has(documentType) ? 'Supplier' : 'Client';

  return [
    {
      label: 'Company',
      variables: [
        { key: 'company.name', label: 'Company name', example: 'Invoicing System SARL' },
        { key: 'company.address', label: 'Company address', example: 'Avenue Habib Bourguiba' },
        {
          key: 'company.logo',
          label: 'Logo de l’entreprise',
          example: 'Logo image',
          valueType: 'image',
          elementType: DOCUMENT_TEMPLATE_ELEMENT_TYPE.LOGO
        },
        { key: 'company.taxNumber', label: 'Tax number', example: 'MF-1234567/A/M/000' },
        { key: 'company.email', label: 'Company email', example: 'contact@invoicing-system.tn' },
        { key: 'company.phone', label: 'Company phone', example: '+216 71 000 000' }
      ]
    },
    {
      label: 'Signature & Stamp',
      variables: [
        {
          key: 'signature.stamp',
          label: 'Cachet de l’entreprise',
          example: 'Stamp image',
          valueType: 'image',
          elementType: DOCUMENT_TEMPLATE_ELEMENT_TYPE.STAMP
        },
        {
          key: 'signature.signature',
          label: 'Signature de l’entreprise',
          example: 'Signature image',
          valueType: 'image',
          elementType: DOCUMENT_TEMPLATE_ELEMENT_TYPE.SIGNATURE
        }
      ]
    },
    {
      label: partyLabel,
      variables: [
        { key: `${partyPrefix}.name`, label: `${partyLabel} name`, example: `${partyLabel} Exemple` },
        { key: `${partyPrefix}.address`, label: `${partyLabel} address`, example: 'Rue du Lac, Tunis' },
        { key: `${partyPrefix}.email`, label: `${partyLabel} email`, example: 'billing@example.tn' },
        { key: `${partyPrefix}.phone`, label: `${partyLabel} phone`, example: '+216 70 000 000' },
        { key: `${partyPrefix}.taxNumber`, label: `${partyLabel} tax number`, example: 'MF-7654321/B/M/000' }
      ]
    },
    {
      label: 'Document',
      variables: [
        { key: 'document.number', label: 'Document number', example: 'INV-2026-0001' },
        { key: 'document.date', label: 'Document date', example: '2026-04-28' },
        { key: 'document.dueDate', label: 'Due date', example: '2026-05-28' },
        { key: 'document.status', label: 'Status', example: 'Draft' },
        { key: 'document.currency', label: 'Currency', example: 'TND' },
        { key: 'document.notes', label: 'Notes', example: 'Merci pour votre confiance.' }
      ]
    },
    {
      label: 'Items',
      variables: [
        { key: 'items[].reference', label: 'Item reference', example: 'ART-001' },
        { key: 'items[].name', label: 'Item name', example: 'Consulting service' },
        { key: 'items[].quantity', label: 'Quantity', example: '2' },
        { key: 'items[].unitPrice', label: 'Unit price', example: '450,000' },
        { key: 'items[].totalTTC', label: 'Total TTC', example: '1 071,000' }
      ]
    },
    {
      label: 'Totals',
      variables: [
        { key: 'totals.totalHT', label: 'Total HT', example: '1 200,000' },
        { key: 'totals.totalTVA', label: 'Total TVA', example: '228,000' },
        { key: 'totals.totalTTC', label: 'Total TTC', example: '1 428,000' },
        { key: 'totals.paid', label: 'Paid amount', example: '0,000' },
        { key: 'totals.remaining', label: 'Remaining', example: '1 428,000' }
      ]
    },
    {
      label: 'Payments',
      variables: [
        { key: 'payments[].date', label: 'Payment date', example: '2026-04-28' },
        { key: 'payments[].method', label: 'Payment method', example: 'Bank transfer' },
        { key: 'payments[].amount', label: 'Payment amount', example: '500,000' },
        { key: 'payments[].reference', label: 'Payment reference', example: 'VIR-0001' }
      ]
    },
    {
      label: 'Bank',
      variables: [
        { key: 'bank.name', label: 'Bank name', example: 'Banque Exemple' },
        { key: 'bank.rib', label: 'RIB', example: '12345678901234567890' },
        { key: 'bank.iban', label: 'IBAN', example: 'TN5910006035183598478831' },
        { key: 'bank.swift', label: 'SWIFT', example: 'BKTNTNTT' }
      ]
    }
  ];
};
