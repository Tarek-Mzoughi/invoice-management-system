import React from 'react';
import { SequenceSettingsContent } from './SequenceSettingsContent';

interface SequentialPortalProps {
  className?: string;
}

export const SequentialPortal: React.FC<SequentialPortalProps> = ({ className }) => {
  return <SequenceSettingsContent className={className} />;
};
