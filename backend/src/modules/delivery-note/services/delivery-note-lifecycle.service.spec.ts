import { DELIVERY_NOTE_STATUS } from '../enums/delivery-note-status.enum';
import { DeliveryNoteLifecycleService } from './delivery-note-lifecycle.service';

describe('DeliveryNoteLifecycleService', () => {
  const service = new DeliveryNoteLifecycleService({} as never);

  describe('toPersistenceStatus', () => {
    it.each([
      [DELIVERY_NOTE_STATUS.Draft, DELIVERY_NOTE_STATUS.Draft],
      [DELIVERY_NOTE_STATUS.Created, DELIVERY_NOTE_STATUS.Created],
      [DELIVERY_NOTE_STATUS.Delivered, DELIVERY_NOTE_STATUS.Delivered],
      [DELIVERY_NOTE_STATUS.Cancelled, DELIVERY_NOTE_STATUS.Cancelled],
    ])('persists %s as its canonical value', (status, expected) => {
      expect(service.toPersistenceStatus(status)).toBe(expected);
    });

    it.each([
      ['deliveryNote.status.sent', DELIVERY_NOTE_STATUS.Created],
      ['deliveryNote.status.validated', DELIVERY_NOTE_STATUS.Delivered],
      ['deliveryNote.status.rejected', DELIVERY_NOTE_STATUS.Cancelled],
    ])('normalizes legacy value %s before persistence', (status, expected) => {
      expect(service.toPersistenceStatus(status)).toBe(expected);
    });
  });
});
