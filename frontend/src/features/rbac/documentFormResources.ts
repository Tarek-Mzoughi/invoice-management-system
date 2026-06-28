export const getDocumentFirmChoiceParams = (canReadDocumentSettings: boolean) => [
  'interlocutorsToFirm',
  'interlocutorsToFirm.interlocutor',
  ...(canReadDocumentSettings ? ['paymentCondition'] : []),
  'invoicingAddress',
  'deliveryAddress',
  'currency'
];
