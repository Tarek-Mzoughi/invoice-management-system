import {
  Field,
  FieldVariant,
  FormStructure,
  TextFieldProps
} from '@/components/shared/form-builder/types';
import { useActivityManager } from './hooks/useActivityManager';
import { useTranslation } from 'react-i18next';

export const useActivityFormStructure = () => {
  const { t: tSettings } = useTranslation('settings');
  const activityManager = useActivityManager();

  const labelField: Field<TextFieldProps> = {
    id: 'activity-label',
    label: tSettings('activity.attributes.label'),
    required: true,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. Service',
    props: {
      value: activityManager.label,
      onChange: (e: string) => activityManager.set('label', e)
    }
  };

  const activityFormStructure: FormStructure = {
    title: tSettings('activity.singular'),
    orientation: 'horizontal',
    fieldsets: [
      {
        rows: [
          {
            fields: [labelField]
          }
        ]
      }
    ]
  };

  return { activityFormStructure };
};
