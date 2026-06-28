export type PasswordValidationKey =
  | 'password_min_length'
  | 'password_max_length'
  | 'password_strength';

export const getPasswordValidationKey = (
  password: string
): PasswordValidationKey | null => {
  if (password.length < 8) return 'password_min_length';
  if (password.length > 64) return 'password_max_length';

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z\d]/.test(password);

  if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecial) {
    return 'password_strength';
  }

  return null;
};
