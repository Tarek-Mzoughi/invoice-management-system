export type HookQueryOptions = {
  enabled?: boolean;
  silentForbiddenToast?: boolean;
};

export const normalizeHookQueryOptions = (
  options?: boolean | HookQueryOptions
): HookQueryOptions & { enabled: boolean } => {
  if (typeof options === 'boolean') {
    return { enabled: options };
  }

  return {
    enabled: options?.enabled ?? true,
    silentForbiddenToast: options?.silentForbiddenToast
  };
};
