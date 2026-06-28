import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { PERMISSIONS } from './permission.constants';
import { hasDocumentTransformationPermissions } from './document-transformation-permissions';

describe('hasDocumentTransformationPermissions', () => {
  it('accepts buying create and update permissions for buying transformations', () => {
    expect(
      hasDocumentTransformationPermissions(ACTIVITY_TYPE.BUYING, [
        PERMISSIONS.BUYING_DOCUMENTS.CREATE,
        PERMISSIONS.BUYING_DOCUMENTS.UPDATE,
      ]),
    ).toBe(true);
  });

  it('rejects selling-only permissions for buying transformations', () => {
    expect(
      hasDocumentTransformationPermissions(ACTIVITY_TYPE.BUYING, [
        PERMISSIONS.SELLING_DOCUMENTS.CREATE,
        PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
      ]),
    ).toBe(false);
  });

  it('requires both create and update permissions', () => {
    expect(
      hasDocumentTransformationPermissions(ACTIVITY_TYPE.SELLING, [
        PERMISSIONS.SELLING_DOCUMENTS.UPDATE,
      ]),
    ).toBe(false);
  });

  it('requires only update permission when no document is created', () => {
    expect(
      hasDocumentTransformationPermissions(
        ACTIVITY_TYPE.BUYING,
        [PERMISSIONS.BUYING_DOCUMENTS.UPDATE],
        false,
      ),
    ).toBe(true);
  });
});
