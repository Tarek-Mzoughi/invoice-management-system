export function buildBusinessContextPrompt(context: {
  page?: string;
  entityType?: string;
  entityId?: number;
  cabinetName?: string;
  userName?: string;
}): string {
  const parts: string[] = [];

  if (context.userName) {
    parts.push(`L'utilisateur s'appelle ${context.userName}.`);
  }
  if (context.cabinetName) {
    parts.push(`Il travaille dans le cabinet "${context.cabinetName}".`);
  }
  if (context.page) {
    parts.push(`Il est actuellement sur la page "${context.page}".`);
  }
  if (context.entityType) {
    parts.push(
      `Le contexte concerne l'entité de type "${context.entityType}".`,
    );
  }
  if (context.entityId) {
    parts.push(`L'entité en cours a l'ID ${context.entityId}.`);
  }

  return parts.length ? `\n\nCONTEXTE UTILISATEUR :\n${parts.join('\n')}` : '';
}
