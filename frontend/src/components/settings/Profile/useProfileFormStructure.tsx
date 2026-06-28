import {
  DateFieldProps,
  Field,
  FieldVariant,
  FormStructure,
  PasswordFieldProps,
  RadioFieldProps,
  SwitchFieldProps,
  TelFieldProps,
  TextareaFieldProps,
  TextFieldProps
} from '@/components/shared/form-builder/types';
import { UserStore } from '@/hooks/stores/useUserStore';
import { Gender } from '@/types';
import { useTranslation } from 'react-i18next';

interface UseProfileFormStructureProps {
  userManager: UserStore;
  isPending?: boolean;
}

export const useProfileFormStructure = ({
  userManager,
  isPending
}: UseProfileFormStructureProps) => {
  const { t: tSettings } = useTranslation('settings');

  const firstNameField: Field<TextFieldProps> = {
    id: 'firstName',
    label: tSettings('users.attributes.first_name'),
    variant: FieldVariant.TEXT,
    placeholder: tSettings('profile.placeholders.first_name'),
    required: true,
    props: {
      value: userManager.firstName || '',
      onChange: (value) => userManager.set('firstName', value),
      disabled: isPending
    }
  };

  const lastNameField: Field<TextFieldProps> = {
    id: 'lastName',
    label: tSettings('users.attributes.last_name'),
    variant: FieldVariant.TEXT,
    placeholder: tSettings('profile.placeholders.last_name'),
    required: true,
    props: {
      value: userManager.lastName || '',
      onChange: (value) => userManager.set('lastName', value),
      disabled: isPending
    }
  };

  const usernameField: Field<TextFieldProps> = {
    id: 'username',
    label: tSettings('users.attributes.username'),
    variant: FieldVariant.TEXT,
    placeholder: 'johndoe',
    required: true,
    props: {
      value: userManager.username || '',
      onChange: (value) => userManager.set('username', value),
      disabled: isPending
    }
  };

  const emailField: Field<TextFieldProps> = {
    id: 'email',
    label: tSettings('users.attributes.email'),
    variant: FieldVariant.EMAIL,
    placeholder: tSettings('profile.placeholders.email'),
    required: true,
    props: {
      value: userManager.email || '',
      onChange: (value) => userManager.set('email', value),
      disabled: isPending
    }
  };

  const dateOfBirthField: Field<DateFieldProps> = {
    id: 'dateOfBirth',
    label: tSettings('users.attributes.date_of_birth'),
    variant: FieldVariant.DATE,
    props: {
      value: userManager.dateOfBirth,
      onDateChange: (value) => userManager.set('dateOfBirth', value || undefined),
      disabled: isPending
    }
  };

  const currentPasswordField: Field<PasswordFieldProps> = {
    id: 'currentPassword',
    label: tSettings('profile.attributes.current_password'),
    variant: FieldVariant.PASSWORD,
    placeholder: tSettings('profile.placeholders.current_password'),
    props: {
      value: userManager.currentPassword || '',
      onChange: (value) => userManager.set('currentPassword', value),
      disabled: isPending
    }
  };

  const passwordField: Field<PasswordFieldProps> = {
    id: 'password',
    label: tSettings('profile.attributes.new_password'),
    variant: FieldVariant.PASSWORD,
    placeholder: tSettings('profile.placeholders.new_password'),
    props: {
      value: userManager.password || '',
      onChange: (value) => userManager.set('password', value),
      disabled: isPending
    }
  };

  const confirmPasswordField: Field<PasswordFieldProps> = {
    id: 'confirmPassword',
    label: tSettings('profile.attributes.confirm_password'),
    variant: FieldVariant.PASSWORD,
    placeholder: tSettings('profile.placeholders.confirm_password'),
    props: {
      value: userManager.confirmPassword || '',
      onChange: (value) => userManager.set('confirmPassword', value),
      disabled: isPending
    }
  };

  const phoneField: Field<TelFieldProps> = {
    id: 'phone',
    label: tSettings('profile.attributes.phone'),
    variant: FieldVariant.TEL,
    placeholder: '+216 98 765 432',
    props: {
      value: userManager.phone || '',
      onChange: (value) => userManager.set('phone', value),
      disabled: isPending
    }
  };

  const cinField: Field<TextFieldProps> = {
    id: 'cin',
    label: tSettings('profile.attributes.cin'),
    variant: FieldVariant.TEXT,
    placeholder: '12345678',
    props: {
      value: userManager.cin || '',
      onChange: (value) => userManager.set('cin', value),
      disabled: isPending
    }
  };

  const bioField: Field<TextareaFieldProps> = {
    id: 'bio',
    label: tSettings('profile.attributes.bio'),
    variant: FieldVariant.TEXTAREA,
    placeholder: tSettings('profile.placeholders.bio'),
    props: {
      value: userManager.bio || '',
      onChange: (value) => userManager.set('bio', value),
      disabled: isPending,
      rows: 3,
      resizable: false
    }
  };

  const genderField: Field<RadioFieldProps> = {
    id: 'gender',
    label: tSettings('profile.attributes.gender'),
    variant: FieldVariant.RADIO,
    props: {
      value: userManager.gender || '',
      onValueChange: (value) => userManager.set('gender', value as Gender),
      disabled: isPending,
      options: [
        { label: tSettings('profile.attributes.gender_male'), value: Gender.Male },
        { label: tSettings('profile.attributes.gender_female'), value: Gender.Female }
      ]
    }
  };

  const isPrivateField: Field<SwitchFieldProps> = {
    id: 'isPrivate',
    label: tSettings('profile.attributes.is_private'),
    description: tSettings('profile.attributes.is_private_description'),
    variant: FieldVariant.SWITCH,
    props: {
      checked: userManager.isPrivate ?? false,
      onCheckedChange: (value) => userManager.set('isPrivate', value),
      disabled: isPending
    }
  };

  const generalFormStructure: FormStructure = {
    orientation: 'vertical',
    fieldsets: [
      {
        rows: [
          { fields: [firstNameField, lastNameField] },
          { fields: [usernameField, emailField] },
          { fields: [dateOfBirthField] }
        ]
      }
    ]
  };

  const securityFormStructure: FormStructure = {
    orientation: 'vertical',
    layout: 'stacked',
    fieldsets: [
      {
        rows: [
          { fields: [currentPasswordField] },
          { fields: [passwordField] },
          { fields: [confirmPasswordField] }
        ]
      }
    ]
  };

  const profileFormStructure: FormStructure = {
    orientation: 'vertical',
    fieldsets: [
      {
        rows: [
          { fields: [phoneField, cinField] },
          { fields: [genderField] },
          { fields: [bioField] },
          { fields: [isPrivateField] }
        ]
      }
    ]
  };

  return { generalFormStructure, securityFormStructure, profileFormStructure };
};
