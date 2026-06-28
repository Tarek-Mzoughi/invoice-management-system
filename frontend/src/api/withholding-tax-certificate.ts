import axios from './axios';

const fetchCertificateBlob = async (
  paymentId: number,
  action: 'preview' | 'download'
): Promise<Blob> => {
  const response = await axios.get<Blob>(
    `public/withholding-tax/certificates/${paymentId}/${action}`,
    {
      responseType: 'blob'
    }
  );
  return new Blob([response.data], { type: 'application/pdf' });
};

const preview = async (paymentId: number): Promise<Blob> =>
  fetchCertificateBlob(paymentId, 'preview');

const download = async (paymentId: number): Promise<Blob> =>
  fetchCertificateBlob(paymentId, 'download');

export const withholdingTaxCertificate = {
  preview,
  download
};
