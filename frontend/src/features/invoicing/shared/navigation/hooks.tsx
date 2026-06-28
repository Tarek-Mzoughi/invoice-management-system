import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';

export const useInvoicingRouteId = (paramName = 'id') => {
  const router = useRouter();
  return router.query[paramName] as string;
};

export const useInvoicingFirmId = () => {
  const params = useSearchParams();
  return params.get('firmId') || undefined;
};
