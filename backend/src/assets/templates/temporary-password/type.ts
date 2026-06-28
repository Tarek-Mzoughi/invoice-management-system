export interface TemporaryPasswordTemplateProps {
  // core
  logo?: string;
  name: string;
  address: string;
  support: string;

  // payload
  client: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}
