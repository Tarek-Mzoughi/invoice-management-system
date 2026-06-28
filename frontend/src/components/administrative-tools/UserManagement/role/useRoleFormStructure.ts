import {
  Field,
  FieldVariant,
  FormStructure,
  TextFieldProps,
  TextareaFieldProps,
  CustomFieldProps
} from '@/components/shared/form-builder/types';
import { useTranslation } from 'react-i18next';
import React from 'react';

interface UseRoleFormStructureProps {
  roleManager: any;
  permissionFormFragment: React.ReactNode;
}

export const useRoleFormStructure = ({
  roleManager,
  permissionFormFragment
}: UseRoleFormStructureProps) => {
  const { t: tSettings } = useTranslation('settings');

  const labelField: Field<TextFieldProps> = {
    id: 'label',
    label: `${tSettings('roles.attributes.label')} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. Awesome Administrator',
    props: {
      value: roleManager.label,
      onChange: (value) => roleManager.set('label', value)
    }
  };

  const descriptionField: Field<TextareaFieldProps> = {
    id: 'description',
    label: `${tSettings('roles.attributes.description')} (*)`,
    variant: FieldVariant.TEXTAREA,
    placeholder: 'This is awesome!',
    props: {
      value: roleManager.description,
      onChange: (value) => roleManager.set('description', value),
      rows: 7
    }
  };

  const permissionsField: Field<CustomFieldProps> = {
    id: 'permissions',
    label: `${tSettings('roles.attributes.permissions')} (*)`,
    variant: FieldVariant.CUSTOM,
    props: {
      children: permissionFormFragment
    }
  };

  const roleFormStructure: FormStructure = {
    orientation: 'vertical',
    fieldsets: [
      {
        rows: [
          {
            fields: [labelField]
          },
          {
            fields: [descriptionField]
          },
          {
            fields: [permissionsField]
          }
        ]
      }
    ]
  };

  return { roleFormStructure };
};
