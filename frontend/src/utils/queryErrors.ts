export const isForbiddenError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;

  const maybeError = error as {
    response?: { status?: number };
    status?: number;
  };

  return maybeError.response?.status === 403 || maybeError.status === 403;
};

export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  if (isForbiddenError(error)) return false;
  return failureCount < 2;
};
