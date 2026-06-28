import type { Firm } from '@/types';

export const getMainFirmInterlocutorEntry = (firm: Firm) =>
  firm.interlocutorsToFirm?.find((entry) => entry.isMain);

export const getMainFirmInterlocutorName = (firm: Firm) => {
  const mainEntry = getMainFirmInterlocutorEntry(firm);
  const interlocutor = mainEntry?.interlocutor;

  return [interlocutor?.title, interlocutor?.name, interlocutor?.surname]
    .filter(Boolean)
    .join(' ');
};

export const getFirmPhone = (firm: Firm) => {
  const mainEntry = getMainFirmInterlocutorEntry(firm);
  return firm.phone || mainEntry?.interlocutor?.phone || '';
};

export const getFirmSecondaryText = (firm: Firm, fallback: string) =>
  firm.website || firm.taxIdNumber || fallback;

