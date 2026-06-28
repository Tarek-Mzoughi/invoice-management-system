import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { Country } from '@/types';
import { useCabinetManager } from '@/components/settings/Cabinet/hooks/useCabinetManager';
import { useTranslation } from 'react-i18next';
import { useCabinetFormStructure } from './useCabinetFormStructure';
import { FormBuilder } from '@/components/shared/form-builder/FormBuilder';

interface GeneralInformationProps {
  className?: string;
  countries?: Country[];
  isPending?: boolean;
}

export const GeneralInformation: React.FC<GeneralInformationProps> = ({
  className,
  isPending,
  countries = []
}) => {
  const cabinetManager = useCabinetManager();
  const { t: tSettings } = useTranslation('settings');
  const { cabinetFormStructure } = useCabinetFormStructure({
    cabinetManager,
    countries,
    isPending
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Building2 />
            {tSettings('cabinet.general_information')}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormBuilder structure={cabinetFormStructure} />
      </CardContent>
    </Card>
  );
};
