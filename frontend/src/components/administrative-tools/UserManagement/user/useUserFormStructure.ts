import {
  Field,
  FieldVariant,
  FormStructure,
  SelectFieldProps,
  TextFieldProps,
  DateFieldProps,
  PasswordFieldProps,
  CheckboxFieldProps
} from '@/components/shared/form-builder/types';
import { useTranslation } from 'react-i18next';
import { Role } from '@/types/role';

interface UseUserFormStructureProps {
  userManager: any;
  roles?: Role[];
  forceShowPasswordInputs?: boolean;
  showPasswordInputs: boolean;
  handleShowPasswordInputs: (checked: any) => void;
  loading?: boolean;
}

export const useUserFormStructure = ({
  userManager,
  roles = [],
  forceShowPasswordInputs = true,
  showPasswordInputs,
  handleShowPasswordInputs
}: UseUserFormStructureProps) => {
  const { t: tSettings } = useTranslation('settings');

  const firstNameField: Field<TextFieldProps> = {
    id: 'firstName',
    label: tSettings('users.attributes.first_name'),
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. John',
    props: {
      value: userManager.firstName,
      onChange: (value) => userManager.set('firstName', value)
    }
  };

  const lastNameField: Field<TextFieldProps> = {
    id: 'lastName',
    label: tSettings('users.attributes.last_name'),
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. Doe',
    props: {
      value: userManager.lastName,
      onChange: (value) => userManager.set('lastName', value)
    }
  };

  const emailField: Field<TextFieldProps> = {
    id: 'email',
    label: `${tSettings('users.attributes.email')} (*)`,
    variant: FieldVariant.EMAIL,
    placeholder: 'Ex. This is awesome!',
    props: {
      value: userManager.email,
      onChange: (value) => userManager.set('email', value)
    }
  };

  const dateOfBirthField: Field<DateFieldProps> = {
    id: 'dateOfBirth',
    label: tSettings('users.attributes.date_of_birth'),
    variant: FieldVariant.DATE,
    props: {
      value: userManager.dateOfBirth,
      onDateChange: (value) => userManager.set('dateOfBirth', value)
    }
  };

  const usernameField: Field<TextFieldProps> = {
    id: 'username',
    label: `${tSettings('users.attributes.username')} (*)`,
    variant: FieldVariant.TEXT,
    placeholder: 'Ex. Awesome Administrator',
    props: {
      value: userManager.username,
      onChange: (value) => userManager.set('username', value)
    }
  };

  const updatePasswordCheckbox: Field<CheckboxFieldProps> = {
    id: 'show-password-inputs',
    label: tSettings('users.update_password'),
    variant: FieldVariant.CHECKBOX,
    description: tSettings('users.hints.update_password_hint', {
      name: userManager.lastName,
      surname: userManager.firstName
    }),
    hidden: forceShowPasswordInputs,
    props: {
      checked: showPasswordInputs,
      onCheckedChange: handleShowPasswordInputs
    }
  };

  const passwordField: Field<PasswordFieldProps> = {
    id: 'password',
    label: tSettings('users.attributes.password'),
    variant: FieldVariant.PASSWORD,
    hidden: !(forceShowPasswordInputs || showPasswordInputs),
    props: {
      value: userManager.password,
      onChange: (value) => userManager.set('password', value)
    }
  };

  const confirmPasswordField: Field<PasswordFieldProps> = {
    id: 'confirmPassword',
    label: tSettings('users.attributes.confirm_password'),
    variant: FieldVariant.PASSWORD,
    hidden: !(forceShowPasswordInputs || showPasswordInputs),
    props: {
      value: userManager.confirmPassword,
      onChange: (value) => userManager.set('confirmPassword', value)
    }
  };

  const roleField: Field<SelectFieldProps> = {
    id: 'roleId',
    label: `${tSettings('users.attributes.role')} (*)`,
    variant: FieldVariant.SELECT,
    placeholder: 'Role...',
    props: {
      value: userManager.roleId?.toString(),
      onValueChange: (value) => userManager.set('roleId', parseInt(value)),
      options: roles.map((role) => ({
        label: role.label || '',
        value: role.id?.toString() || ''
      }))
    }
  };

  const requirePasswordCheckbox: Field<CheckboxFieldProps> = {
    id: 'force-password-change',
    label: tSettings('users.require_password'),
    variant: FieldVariant.CHECKBOX,
    description: tSettings('users.require_password_hint'),
    props: {
      // Note: userManager currently doesn't have a field for this in the provided snippet
      // but let's keep it for UI consistency if needed
    }
  };

  const userFormStructure: FormStructure = {
    orientation: 'vertical',
    fieldsets: [
      {
        title: tSettings('users.attributes.general'),
        includeHeader: true,
        rows: [
          {
            fields: [firstNameField, lastNameField]
          },
          {
            fields: [emailField]
          },
          {
            fields: [dateOfBirthField]
          }
        ]
      },
      {
        title: tSettings('users.attributes.account'),
        includeHeader: true,
        rows: [
          {
            fields: [usernameField]
          },
          {
            fields: [updatePasswordCheckbox]
          },
          {
            fields: [passwordField]
          },
          {
            fields: [confirmPasswordField]
          },
          {
            fields: [roleField]
          },
          {
            fields: [requirePasswordCheckbox]
          }
        ]
      }
    ]
  };

  return { userFormStructure };
};
