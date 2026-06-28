import { DOCUMENT_TEMPLATE_DOCUMENT_TYPE } from '../../enums/document-template-document-type.enum';
import { GenericDocumentTemplateData } from '../../interfaces/template-engine.interface';

const documentLabels: Record<DOCUMENT_TEMPLATE_DOCUMENT_TYPE, string> = {
  [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.INVOICE]: 'Facture',
  [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.QUOTE]: 'Devis',
  [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CUSTOMER_ORDER]: 'Commande client',
  [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.DELIVERY_NOTE]: 'Bon de livraison',
  [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.GOODS_ISSUE_NOTE]: 'Bon de sortie',
  [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CREDIT_NOTE]: 'Avoir',
  [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RETURN_NOTE]: 'Bon de retour',
  [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.PURCHASE_ORDER]: 'Commande fournisseur',
  [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_INVOICE]: 'Facture fournisseur',
  [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.SUPPLIER_CREDIT_NOTE]: 'Avoir fournisseur',
  [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.RECEIPT]: 'Recu',
  [DOCUMENT_TEMPLATE_DOCUMENT_TYPE.CUSTOM_DOCUMENT]: 'Document',
};

export function getSampleTemplateData(
  documentType: DOCUMENT_TEMPLATE_DOCUMENT_TYPE,
): GenericDocumentTemplateData {
  const label = documentLabels[documentType] || 'Document';

  return {
    company: {
      name: 'Invoicing System SARL',
      address: 'Immeuble Horizon, Avenue Habib Bourguiba, Tunis',
      logo: '',
      taxNumber: 'MF-1234567/A/M/000',
      email: 'contact@invoicing-system.tn',
      phone: '+216 71 000 000',
      website: 'https://invoicing-system.tn',
    },
    client: {
      name: 'Client Exemple SA',
      address: 'Rue du Lac, Les Berges du Lac, Tunis',
      billingAddress: 'Rue du Lac, Les Berges du Lac, Tunis',
      shippingAddress: 'Zone logistique, Tunis',
      email: 'finance@client-exemple.tn',
      phone: '+216 70 000 000',
      taxNumber: 'MF-7654321/B/M/000',
    },
    supplier: {
      name: 'Fournisseur Exemple',
      address: 'Zone Industrielle, Sfax',
      email: 'billing@fournisseur.tn',
      phone: '+216 74 000 000',
      taxNumber: 'MF-1122334/C/M/000',
    },
    document: {
      type: documentType,
      label,
      number: `${documentType.slice(0, 3)}-2026-0001`,
      date: '2026-04-27',
      dueDate: '2026-05-27',
      status: 'DRAFT',
      currency: 'TND',
      object: 'Prestations et fournitures',
      notes: 'Merci pour votre confiance.',
      terms: 'Paiement a 30 jours.',
    },
    totals: {
      subtotal: '1 200,000',
      discount: '0,000',
      tax: '228,000',
      totalHT: '1 200,000',
      totalTVA: '228,000',
      totalTTC: '1 428,000',
      paid: '0,000',
      remaining: '1 428,000',
      amountInWords: 'Mille quatre cent vingt-huit dinars',
    },
    items: [
      {
        reference: 'SERV-001',
        name: 'Service de conseil',
        description: 'Prestation mensuelle',
        quantity: 2,
        unit: 'Jour',
        unitPrice: '450,000',
        discount: '0%',
        taxRate: '19%',
        totalHT: '900,000',
        totalTTC: '1 071,000',
      },
      {
        reference: 'ART-002',
        name: 'Licence logicielle',
        description: 'Abonnement annuel',
        quantity: 1,
        unit: 'Piece',
        unitPrice: '300,000',
        discount: '0%',
        taxRate: '19%',
        totalHT: '300,000',
        totalTTC: '357,000',
      },
    ],
    payments: [
      {
        date: '2026-04-27',
        method: 'Virement bancaire',
        amount: '0,000',
        reference: 'VIR-0001',
      },
    ],
    bank: {
      name: 'Banque Exemple',
      rib: '12345678901234567890',
      iban: 'TN5910006035183598478831',
      swift: 'BKTNTNTT',
    },
    signature: {
      signature: '',
      stamp: '',
    },
  };
}
