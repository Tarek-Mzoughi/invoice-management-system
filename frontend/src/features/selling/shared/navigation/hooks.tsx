import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';

export const useSellingRouteId = (paramName = 'id') => {
  const router = useRouter();
  return router.query[paramName] as string;
};

export const useSellingFirmId = () => {
  const params = useSearchParams();
  return params.get('firmId') || undefined;
};
