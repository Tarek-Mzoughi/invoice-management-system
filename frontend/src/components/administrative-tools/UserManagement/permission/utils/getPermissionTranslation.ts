export const getPermissionTranslation = (label?: string) => {
  const [_, ...entity] = label?.split('_') || ['None', 'None'];
  return `${entity.join('_')}.${label}`;
};
