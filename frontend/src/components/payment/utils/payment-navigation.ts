type PaymentRouteType = 'selling' | 'buying';

const normalizeId = (id?: number | string | null) => {
  if (id === undefined || id === null || id === '') return undefined;
  return encodeURIComponent(String(id));
};

export const getPaymentEditPath = (id?: number | string | null) => {
  const normalizedId = normalizeId(id);
  return normalizedId ? `/payments/${normalizedId}/edit` : '/payments';
};

export const getPaymentNewPath = (type?: PaymentRouteType, firmId?: number | string | null) => {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (firmId !== undefined && firmId !== null && firmId !== '') {
    params.set('firmId', String(firmId));
  }

  const queryString = params.toString();
  return queryString ? `/payments/new?${queryString}` : '/payments/new';
};
