const isAlphabetic = (str: string) => {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(str);
};

const isAlphabeticOrSpace = (str: string) => {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(str);
};

const isValue = (str: string) => {
  return /^-?\d+(\.\d+)?$/.test(str);
};

const isEmail = (str: string): boolean => {
  // Simple email validation regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
};

const isUSTaxIdentificationNumber = (str: string) => {
  // TIN can be in the form of SSN (###-##-####) or EIN (##-#######)
  return /^(?:\d{3}-\d{2}-\d{4}|\d{2}-\d{7})$/.test(str);
};

export { isValue, isAlphabetic, isAlphabeticOrSpace, isEmail, isUSTaxIdentificationNumber };
