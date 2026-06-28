import React from 'react';

import { api } from '@/api';

interface UseUploadPreviewUrlParams {
  id?: number;
  slug?: string;
}

export const useUploadPreviewUrl = ({ id, slug }: UseUploadPreviewUrlParams) => {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!slug && !id) {
      setPreviewUrl(null);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    const fetchBlob = slug ? api.upload.fetchBlobBySlug(slug) : api.upload.fetchBlobById(id);

    fetchBlob
      .then((blob) => {
        if (!active) return;
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setPreviewUrl(objectUrl);
        } else {
          setPreviewUrl(null);
        }
      })
      .catch(() => {
        if (active) setPreviewUrl(null);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, slug]);

  return previewUrl;
};
