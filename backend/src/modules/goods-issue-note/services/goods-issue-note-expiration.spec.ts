import { GOODS_ISSUE_NOTE_STATUS } from '../enums/goods-issue-note-status.enum';
import { GoodsIssueNoteService } from './goods-issue-note.service';

jest.mock('@nestjs-cls/transactional', () => ({
  Transactional:
    () =>
    (_target: object, _propertyKey: string, descriptor: PropertyDescriptor) =>
      descriptor,
}));

describe('GoodsIssueNoteService expiration', () => {
  it('moves overdue sent notes to expired and leaves other statuses untouched', async () => {
    const overdueSent = {
      id: 1,
      dueDate: new Date(Date.now() - 86_400_000),
      status: GOODS_ISSUE_NOTE_STATUS.Sent,
    };
    const repository = {
      findAll: jest.fn().mockResolvedValue([overdueSent]),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };
    const service = Object.create(
      GoodsIssueNoteService.prototype,
    ) as GoodsIssueNoteService;
    Object.assign(service, { goodsIssueNoteRepository: repository });

    await service.checkExpiredGoodsIssueNotes();

    expect(repository.findAll).toHaveBeenCalledWith({
      where: { status: GOODS_ISSUE_NOTE_STATUS.Sent },
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        status: GOODS_ISSUE_NOTE_STATUS.Expired,
      }),
    );
  });
});
