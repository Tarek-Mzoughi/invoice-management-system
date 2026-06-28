import { useRouter } from 'next/router';

export const clearQueryParams = (router: ReturnType<typeof useRouter>) => {
  router.replace(window.location.pathname, undefined, { shallow: true });
};

export const setQueryParams = (
  router: ReturnType<typeof useRouter>,
  params: Record<string, string | string[] | undefined>
) => {
  const pathname = router.pathname;
  const query = { ...router.query, ...params };

  Object.keys(query).forEach((key) => {
    if (query[key] === undefined) delete query[key];
  });

  router.replace(
    {
      pathname,
      query
    },
    undefined,
    { shallow: true }
  );
};
