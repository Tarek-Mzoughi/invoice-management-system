import React from 'react';
import { TemplatePageSettings } from '@/types';
import { clamp, getPixelsPerUnit } from '../utils/coordinates';

export const ZOOM_PRESETS = [0.5, 0.75, 1] as const;

export const useTemplateZoom = ({
  pageSettings,
  viewportRef,
  onZoomChange
}: {
  pageSettings?: TemplatePageSettings;
  viewportRef: React.RefObject<HTMLElement>;
  onZoomChange: (zoom: number) => void;
}) => {
  const fitWidth = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !pageSettings) return;

    const availableWidth = Math.max(240, viewport.clientWidth - 80);
    const pageWidthAt100 = pageSettings.width * getPixelsPerUnit(1, pageSettings.unit);
    onZoomChange(roundZoom(clamp(availableWidth / pageWidthAt100, 0.35, 1.5)));
  }, [onZoomChange, pageSettings, viewportRef]);

  return { presets: ZOOM_PRESETS, fitWidth };
};

const roundZoom = (zoom: number) => Math.round(zoom * 100) / 100;
