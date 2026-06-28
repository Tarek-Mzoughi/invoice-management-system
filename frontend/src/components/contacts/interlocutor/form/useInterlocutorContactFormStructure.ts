import {
  Field,
  FieldVariant,
  FormStructure,
  SelectFieldProps,
  TelFieldProps,
  TextFieldProps
} from '@/components/shared/form-builder/types';
import { useTranslation } from 'react-i18next';
import { SOCIAL_TITLE } from '@/types/enums/social-titles';

interface UseInterlocutorContactFormStructureProps {
  interlocutorManager: any;
  loading?: boolean;
}

export const useInterlocutorContactFormStructure = ({
  interlocutorManager,
  loading
}: UseInterlocutorContactFormStructureProps) => {
  const { t: tContacts } = useTranslation('contacts');
  const { t: tSocial } = useTranslation('social-title');

  const titleField: Field<SelectFieldProps> = {
    id: 'title',
    label: `${tContacts('interlocutor.attributes.title')} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: tContacts('interlocutor.attributes.title'),
    props: {
      value: interlocutorManager?.title,
      onValueChange: (value) => interlocutorManager.set('title', value),
      options: Object.values(SOCIAL_TITLE).map((title) => ({
        label: tSocial(title),
        value: title
      })),
      disabled: loading
    }
  };

  const nameField: Field<TextFieldProps> = {
    id: 'name',
    label: `${tContacts('interlocutor.attributes.name')} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. John',
    props: {
      value: interlocutorManager?.name,
      onChange: (value) => interlocutorManager.set('name', value),
      disabled: loading
    }
  };

  const surnameField: Field<TextFieldProps> = {
    id: 'surname',
    label: `${tContacts('interlocutor.attributes.surname')} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. Doe',
    props: {
      value: interlocutorManager?.surname,
      onChange: (value) => interlocutorManager.set('surname', value),
      disabled: loading
    }
  };

  const emailField: Field<TextFieldProps> = {
    id: 'email',
    label: tContacts('interlocutor.attributes.email'),
    variant: FieldVariant.EMAIL,
    placeholder: 'Ex. contact@invoicing-system.tn',
    props: {
      value: interlocutorManager?.email,
      onChange: (value) => interlocutorManager.set('email', value),
      disabled: loading
    }
  };

  const phoneField: Field<TelFieldProps> = {
    id: 'phone',
    label: tContacts('interlocutor.attributes.phone'),
    variant: FieldVariant.TEL,
    placeholder: 'Ex. +216 72 398 389',
    props: {
      value: interlocutorManager?.phone,
      onChange: (value) => interlocutorManager.set('phone', value),
      disabled: loading
    }
  };

  const positionField: Field<TextFieldProps> = {
    id: 'position',
    label: tContacts('interlocutor.attributes.position'),
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. CEO',
    props: {
      value: interlocutorManager?.position,
      onChange: (value) => interlocutorManager.set('position', value),
      disabled: loading
    }
  };

  const interlocutorContactFormStructure: FormStructure = {
    orientation: 'vertical',
    fieldsets: [
      {
        rows: [
          {
            fields: [titleField, nameField, surnameField]
          },
          {
            fields: [emailField, phoneField]
          },
          {
            fields: [positionField]
          }
        ]
      }
    ]
  };

  return { interlocutorContactFormStructure };
};
