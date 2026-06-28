export interface EmailVerificationTemplateProps {
  //core
  logo?: string;
  name: string;
  address: string;
  support: string;

  //payload
  client: string;
  email: string;
  url: string;
  expiresIn?: string;
}
