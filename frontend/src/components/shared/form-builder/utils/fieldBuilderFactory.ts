import { EmptyFieldProps, Field, FieldVariant } from '../types';

export const fieldBuilderFactory = (): Field<EmptyFieldProps> => {
  return {
    id: new Date().getTime().toString(),
    label: '',
    variant: FieldVariant.EMPTY
  };
};
