import React from 'react';
import _ from 'lodash';

interface UseInitializedStateProps {
  data: any;
  getCurrentData: () => any;
  setFormData: (data: any) => void;
  resetData: () => void;
  loading: boolean;
  /** When this value changes, form state is cleared and re-initialized from `data`. */
  resetKey?: string | number | null;
}

const useInitializedState = ({
  data,
  getCurrentData,
  setFormData,
  resetData,
  loading,
  resetKey
}: UseInitializedStateProps) => {
  const [initialData, setInitialData] = React.useState<any | null>(null);
  const [isDataLoaded, setIsDataLoaded] = React.useState(false);
  const lastInitializedData = React.useRef<any>(null);
  const hasInitializableData =
    data !== null &&
    data !== undefined &&
    (!_.isPlainObject(data) || !_.isEmpty(data));

  const resetDataRef = React.useRef(resetData);
  resetDataRef.current = resetData;
  const setFormDataRef = React.useRef(setFormData);
  setFormDataRef.current = setFormData;
  const getCurrentDataRef = React.useRef(getCurrentData);
  getCurrentDataRef.current = getCurrentData;
  const prevResetKeyRef = React.useRef<typeof resetKey>(resetKey);

  const initializeData = () => {
    if (hasInitializableData && !_.isEqual(lastInitializedData.current, data)) {
      setFormDataRef.current(data);
      setInitialData(getCurrentDataRef.current());
      setIsDataLoaded(true);
      lastInitializedData.current = data;
    }
  };

  React.useEffect(() => {
    if (resetKey === undefined) return;
    if (prevResetKeyRef.current === resetKey) return;

    prevResetKeyRef.current = resetKey;
    resetDataRef.current();
    lastInitializedData.current = null;
    setInitialData(null);
    setIsDataLoaded(false);
  }, [resetKey]);

  React.useEffect(() => {
    if (!loading && hasInitializableData && !_.isEqual(lastInitializedData.current, data)) {
      initializeData();
    }
  }, [data, hasInitializableData, loading]);

  const globalReset = () => {
    resetData();
    lastInitializedData.current = null; // Allow re-initialization
    initializeData();
  };

  const isDisabled = React.useMemo(() => {
    if (!isDataLoaded || loading) return true;
    return _.isEqual(initialData, getCurrentData());
  }, [initialData, getCurrentData, isDataLoaded, loading]);

  return {
    isDisabled,
    globalReset,
    setInitialData,
    isDataLoaded
  };
};

export default useInitializedState;
