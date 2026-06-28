import { validate } from 'class-validator';
import { CreateGoodsIssueNoteDto } from './goods-issue-note.create.dto';
import { UpdateGoodsIssueNoteDto } from './goods-issue-note.update.dto';
import { GOODS_ISSUE_NOTE_STATUS } from '../enums/goods-issue-note-status.enum';

const EXPECTED_STATUSES = [
  GOODS_ISSUE_NOTE_STATUS.Nonexistent,
  GOODS_ISSUE_NOTE_STATUS.Expired,
  GOODS_ISSUE_NOTE_STATUS.Draft,
  GOODS_ISSUE_NOTE_STATUS.Created,
  GOODS_ISSUE_NOTE_STATUS.Validated,
  GOODS_ISSUE_NOTE_STATUS.Sent,
  GOODS_ISSUE_NOTE_STATUS.Issued,
  GOODS_ISSUE_NOTE_STATUS.Accepted,
  GOODS_ISSUE_NOTE_STATUS.Rejected,
  GOODS_ISSUE_NOTE_STATUS.Cancelled,
  GOODS_ISSUE_NOTE_STATUS.Invoiced,
];

describe('Goods issue note status DTO validation', () => {
  it('keeps the backend status enum aligned with the public API', () => {
    expect(Object.values(GOODS_ISSUE_NOTE_STATUS)).toEqual(EXPECTED_STATUSES);
    expect(Object.values(GOODS_ISSUE_NOTE_STATUS)).not.toContain(
      'goodsIssueNote.status.archived',
    );
  });

  it.each(EXPECTED_STATUSES)(
    'accepts %s when creating a goods issue note',
    async (status) => {
      const dto = Object.assign(new CreateGoodsIssueNoteDto(), { status });

      await expect(validate(dto)).resolves.toEqual([]);
    },
  );

  it.each([
    GOODS_ISSUE_NOTE_STATUS.Draft,
    GOODS_ISSUE_NOTE_STATUS.Created,
    GOODS_ISSUE_NOTE_STATUS.Issued,
    GOODS_ISSUE_NOTE_STATUS.Cancelled,
  ])(
    'accepts lifecycle status %s when updating a goods issue note',
    async (status) => {
      const dto = Object.assign(new UpdateGoodsIssueNoteDto(), {
        id: 26,
        status,
      });

      await expect(validate(dto)).resolves.toEqual([]);
    },
  );

  it('rejects the removed archived status', async () => {
    const dto = Object.assign(new UpdateGoodsIssueNoteDto(), {
      id: 26,
      status: 'goodsIssueNote.status.archived',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('status');
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });
});
