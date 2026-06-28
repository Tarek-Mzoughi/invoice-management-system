import {
  DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
  DOCUMENT_TEMPLATE_ELEMENT_TYPE,
  DOCUMENT_TEMPLATE_STATUS
} from '@/types';

export const DOCUMENT_TEMPLATE_TYPE_OPTIONS = [
  { value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.INVOICE, label: 'Invoice' },
  { value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.QUOTE, label: 'Quote' },
  { value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CUSTOMER_ORDER, label: 'Customer order' },
  { value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.DELIVERY_NOTE, label: 'Delivery note' },
  { value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.GOODS_ISSUE_NOTE, label: 'Goods issue note' },
  { value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CREDIT_NOTE, label: 'Credit note' },
  { value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RETURN_NOTE, label: 'Return note' },
  { value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.PURCHASE_ORDER, label: 'Purchase order' },
  { value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_INVOICE, label: 'Supplier invoice' },
  {
    value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_CREDIT_NOTE,
    label: 'Supplier credit note'
  },
  { value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RECEIPT, label: 'Receipt' },
  { value: DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CUSTOM_DOCUMENT, label: 'Custom document' }
];

export const DOCUMENT_TEMPLATE_STATUS_OPTIONS = [
  { value: DOCUMENT_TEMPLATE_STATUS.DRAFT, label: 'Draft' },
  { value: DOCUMENT_TEMPLATE_STATUS.PUBLISHED, label: 'Published' },
  { value: DOCUMENT_TEMPLATE_STATUS.ARCHIVED, label: 'Archived' }
];

export const TEMPLATE_ELEMENT_OPTIONS = [
  { type: DOCUMENT_TEMPLATE_ELEMENT_TYPE.TEXT, label: 'Text' },
  { type: DOCUMENT_TEMPLATE_ELEMENT_TYPE.DYNAMIC_TEXT, label: 'Dynamic text' },
  { type: DOCUMENT_TEMPLATE_ELEMENT_TYPE.LOGO, label: 'Logo' },
  { type: DOCUMENT_TEMPLATE_ELEMENT_TYPE.IMAGE, label: 'Image' },
  { type: DOCUMENT_TEMPLATE_ELEMENT_TYPE.TABLE, label: 'Table' }
];

export const TEMPLATE_VARIABLE_GROUPS = [
  {
    label: 'Company',
    variables: [
      'company.name',
      'company.address',
      'company.logo',
      'company.taxNumber',
      'company.email',
      'company.phone',
      'company.website'
    ]
  },
  {
    label: 'Client',
    variables: [
      'client.name',
      'client.address',
      'client.email',
      'client.phone',
      'client.taxNumber'
    ]
  },
  {
    label: 'Supplier',
    variables: [
      'supplier.name',
      'supplier.address',
      'supplier.email',
      'supplier.phone',
      'supplier.taxNumber'
    ]
  },
  {
    label: 'Document',
    variables: [
      'document.number',
      'document.date',
      'document.dueDate',
      'document.status',
      'document.currency',
      'document.notes',
      'document.terms'
    ]
  },
  {
    label: 'Totals',
    variables: [
      'totals.subtotal',
      'totals.discount',
      'totals.tax',
      'totals.totalHT',
      'totals.totalTVA',
      'totals.totalTTC',
      'totals.paid',
      'totals.remaining',
      'totals.amountInWords'
    ]
  },
  {
    label: 'Line items',
    variables: [
      'items[].reference',
      'items[].name',
      'items[].description',
      'items[].quantity',
      'items[].unit',
      'items[].unitPrice',
      'items[].discount',
      'items[].taxRate',
      'items[].totalHT',
      'items[].totalTTC'
    ]
  },
  {
    label: 'Payments',
    variables: [
      'payments[].date',
      'payments[].method',
      'payments[].amount',
      'payments[].reference'
    ]
  },
  {
    label: 'Bank',
    variables: ['bank.name', 'bank.rib', 'bank.iban', 'bank.swift']
  }
];
