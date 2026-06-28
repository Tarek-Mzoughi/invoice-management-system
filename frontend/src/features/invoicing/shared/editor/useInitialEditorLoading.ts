import React from 'react';

export const useInitialEditorLoading = (loading: boolean) => {
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = React.useState(!loading);

  React.useEffect(() => {
    if (!loading) {
      setHasCompletedInitialLoad(true);
    }
  }, [loading]);

  return !hasCompletedInitialLoad && loading;
};
