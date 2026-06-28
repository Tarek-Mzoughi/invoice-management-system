import axios from './axios';
import { CompanyOnboardingPayload, CompanyOnboardingResponse } from '@/types/onboarding';

const completeCompanyOnboarding = async (
  payload: CompanyOnboardingPayload
): Promise<CompanyOnboardingResponse> => {
  const response = await axios.post<CompanyOnboardingResponse>(
    'public/onboarding/company',
    payload
  );
  return response.data;
};

export const onboarding = {
  completeCompanyOnboarding
};
