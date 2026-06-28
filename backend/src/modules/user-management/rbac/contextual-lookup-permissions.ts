export type FirmDocumentChoiceEntityType = 'clients' | 'suppliers';
export type ArticleDocumentChoiceActivityType = 'selling' | 'buying';

export const canAccessFirmDocumentChoices = (
  entityType: FirmDocumentChoiceEntityType | string,
  permissionIds: string[],
) => {
  void entityType;
  void permissionIds;
  return true;
};

export const canAccessArticleDocumentChoices = (
  activityType: ArticleDocumentChoiceActivityType | string,
  permissionIds: string[],
) => {
  void activityType;
  void permissionIds;
  return true;
};

export const canAccessDocumentByActivityType = (
  activityType: ArticleDocumentChoiceActivityType | string | undefined | null,
  permissionIds: string[],
) => {
  void activityType;
  void permissionIds;
  return true;
};
