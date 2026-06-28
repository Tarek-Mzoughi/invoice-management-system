import { BadRequestException, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { DeliveryNoteEntity } from '../entities/delivery-note.entity';
import { DELIVERY_NOTE_STATUS } from '../enums/delivery-note-status.enum';
import { DeliveryNoteRepository } from '../repositories/delivery-note.repository';

type DeliveryNoteWithLinkedDocuments = Partial<
  Pick<DeliveryNoteEntity, 'status' | 'invoices' | 'returnNotes'>
>;

@Injectable()
export class DeliveryNoteLifecycleService {
  constructor(
    private readonly deliveryNoteRepository: DeliveryNoteRepository,
  ) {}

  private hasInvoices(
    deliveryNote?: DeliveryNoteWithLinkedDocuments | null,
  ): boolean {
    return (deliveryNote?.invoices?.length ?? 0) > 0;
  }

  private hasReturnNotes(
    deliveryNote?: DeliveryNoteWithLinkedDocuments | null,
  ): boolean {
    return (deliveryNote?.returnNotes?.length ?? 0) > 0;
  }

  hasTransformedDocuments(
    deliveryNote?: DeliveryNoteWithLinkedDocuments | null,
  ): boolean {
    if (!deliveryNote) return false;

    return this.hasInvoices(deliveryNote) || this.hasReturnNotes(deliveryNote);
  }

  normalizeStatus(
    status?: DELIVERY_NOTE_STATUS | string | null,
    hasTransformedDocuments: boolean = false,
  ): DELIVERY_NOTE_STATUS {
    void hasTransformedDocuments;

    switch (status) {
      case DELIVERY_NOTE_STATUS.Draft:
      case 'draft':
        return DELIVERY_NOTE_STATUS.Draft;
      case DELIVERY_NOTE_STATUS.Created:
      case 'created':
      case 'deliveryNote.status.created':
      case 'deliveryNote.status.sent':
      case 'sent':
      case 'deliveryNote.status.accepted':
      case 'accepted':
        return DELIVERY_NOTE_STATUS.Created;
      case DELIVERY_NOTE_STATUS.Delivered:
      case 'delivered':
      case 'deliveryNote.status.delivered':
      case 'deliveryNote.status.validated':
      case 'validated':
      case 'deliveryNote.status.invoiced':
      case 'invoiced':
        return DELIVERY_NOTE_STATUS.Delivered;
      case DELIVERY_NOTE_STATUS.Cancelled:
      case 'cancelled':
      case 'canceled':
      case 'deliveryNote.status.cancelled':
      case 'deliveryNote.status.rejected':
      case 'rejected':
      case 'deliveryNote.status.expired':
      case 'expired':
      case 'deliveryNote.status.archived':
      case 'archived':
        return DELIVERY_NOTE_STATUS.Cancelled;
      case 'deliveryNote.status.non_existent':
      case 'nonexistent':
      case undefined:
      case null:
      default:
        return DELIVERY_NOTE_STATUS.Draft;
    }
  }

  toPersistenceStatus(
    status?: DELIVERY_NOTE_STATUS | string | null,
  ): DELIVERY_NOTE_STATUS {
    return this.normalizeStatus(status);
  }

  normalizeDeliveryNoteStatus<T extends DeliveryNoteWithLinkedDocuments>(
    deliveryNote: T | null,
  ): T | null {
    if (!deliveryNote) return null;

    return {
      ...deliveryNote,
      status: this.normalizeStatus(
        deliveryNote.status,
        this.hasTransformedDocuments(deliveryNote),
      ),
    };
  }

  normalizeDeliveryNotesStatus<T extends DeliveryNoteWithLinkedDocuments>(
    deliveryNotes: T[],
  ): T[] {
    return deliveryNotes.map(
      (deliveryNote) => this.normalizeDeliveryNoteStatus(deliveryNote) as T,
    );
  }

  resolveCreateStatus(
    requestedStatus?: DELIVERY_NOTE_STATUS,
  ): DELIVERY_NOTE_STATUS {
    const nextStatus = requestedStatus ?? DELIVERY_NOTE_STATUS.Draft;

    if (
      nextStatus !== DELIVERY_NOTE_STATUS.Draft &&
      nextStatus !== DELIVERY_NOTE_STATUS.Created
    ) {
      throw new BadRequestException('deliveryNote.errors.invalid_save_status');
    }

    return nextStatus;
  }

  resolveUpdateStatus(
    deliveryNote: DeliveryNoteWithLinkedDocuments,
    requestedStatus?: DELIVERY_NOTE_STATUS,
  ): DELIVERY_NOTE_STATUS {
    const currentStatus = this.normalizeStatus(
      deliveryNote.status,
      this.hasTransformedDocuments(deliveryNote),
    );

    if (
      currentStatus === DELIVERY_NOTE_STATUS.Delivered ||
      currentStatus === DELIVERY_NOTE_STATUS.Cancelled
    ) {
      throw new BadRequestException('deliveryNote.errors.cannot_modify_locked');
    }

    const nextStatus = requestedStatus ?? currentStatus;

    if (
      nextStatus !== DELIVERY_NOTE_STATUS.Draft &&
      nextStatus !== DELIVERY_NOTE_STATUS.Created
    ) {
      throw new BadRequestException('deliveryNote.errors.invalid_save_status');
    }

    if (
      currentStatus === DELIVERY_NOTE_STATUS.Created &&
      nextStatus !== DELIVERY_NOTE_STATUS.Created
    ) {
      throw new BadRequestException('deliveryNote.errors.invalid_transition');
    }

    return nextStatus;
  }

  assertCanCreateInvoice(deliveryNote: DeliveryNoteWithLinkedDocuments | null) {
    if (!deliveryNote) {
      throw new BadRequestException('deliveryNote.errors.not_found');
    }

    const normalizedStatus = this.normalizeStatus(
      deliveryNote.status,
      this.hasTransformedDocuments(deliveryNote),
    );

    if (normalizedStatus === DELIVERY_NOTE_STATUS.Cancelled) {
      throw new BadRequestException(
        'deliveryNote.errors.cannot_transform_cancelled',
      );
    }

    if (this.hasInvoices(deliveryNote)) {
      throw new BadRequestException(
        'deliveryNote.errors.invoice_already_exists',
      );
    }

    if (
      normalizedStatus !== DELIVERY_NOTE_STATUS.Draft &&
      normalizedStatus !== DELIVERY_NOTE_STATUS.Created &&
      normalizedStatus !== DELIVERY_NOTE_STATUS.Delivered
    ) {
      throw new BadRequestException('deliveryNote.errors.invalid_transition');
    }
  }

  @Transactional()
  async validate(id: number): Promise<DeliveryNoteEntity> {
    const deliveryNote = await this.deliveryNoteRepository.findOne({
      where: { id },
      relations: ['invoices', 'returnNotes'],
    });
    if (!deliveryNote) {
      throw new BadRequestException('deliveryNote.errors.not_found');
    }

    const normalizedStatus = this.normalizeStatus(
      deliveryNote.status,
      this.hasTransformedDocuments(deliveryNote),
    );

    if (normalizedStatus === DELIVERY_NOTE_STATUS.Cancelled) {
      throw new BadRequestException(
        'deliveryNote.errors.cannot_validate_cancelled',
      );
    }

    if (normalizedStatus === DELIVERY_NOTE_STATUS.Delivered) {
      throw new BadRequestException(
        'deliveryNote.errors.cannot_validate_delivered',
      );
    }

    if (normalizedStatus !== DELIVERY_NOTE_STATUS.Draft) {
      throw new BadRequestException(
        'deliveryNote.errors.validate_only_from_draft',
      );
    }

    return this.deliveryNoteRepository.save({
      id,
      status: this.toPersistenceStatus(
        DELIVERY_NOTE_STATUS.Created,
      ) as DELIVERY_NOTE_STATUS,
    });
  }

  @Transactional()
  async cancel(id: number): Promise<DeliveryNoteEntity> {
    const deliveryNote = await this.deliveryNoteRepository.findOne({
      where: { id },
      relations: ['invoices', 'returnNotes'],
    });
    if (!deliveryNote) {
      throw new BadRequestException('deliveryNote.errors.not_found');
    }

    const normalizedStatus = this.normalizeStatus(
      deliveryNote.status,
      this.hasTransformedDocuments(deliveryNote),
    );

    if (normalizedStatus === DELIVERY_NOTE_STATUS.Delivered) {
      throw new BadRequestException(
        'deliveryNote.errors.cannot_cancel_delivered',
      );
    }

    if (normalizedStatus === DELIVERY_NOTE_STATUS.Cancelled) {
      throw new BadRequestException(
        'deliveryNote.errors.cannot_cancel_cancelled',
      );
    }

    if (
      normalizedStatus !== DELIVERY_NOTE_STATUS.Draft &&
      normalizedStatus !== DELIVERY_NOTE_STATUS.Created
    ) {
      throw new BadRequestException('deliveryNote.errors.invalid_transition');
    }

    return this.deliveryNoteRepository.save({
      id,
      status: this.toPersistenceStatus(
        DELIVERY_NOTE_STATUS.Cancelled,
      ) as DELIVERY_NOTE_STATUS,
    });
  }

  @Transactional()
  async deliver(id: number): Promise<DeliveryNoteEntity> {
    const deliveryNote = await this.deliveryNoteRepository.findOne({
      where: { id },
      relations: ['invoices', 'returnNotes'],
    });
    if (!deliveryNote) {
      throw new BadRequestException('deliveryNote.errors.not_found');
    }

    const normalizedStatus = this.normalizeStatus(
      deliveryNote.status,
      this.hasTransformedDocuments(deliveryNote),
    );

    if (normalizedStatus === DELIVERY_NOTE_STATUS.Cancelled) {
      throw new BadRequestException(
        'deliveryNote.errors.cannot_deliver_cancelled',
      );
    }

    if (normalizedStatus === DELIVERY_NOTE_STATUS.Delivered) {
      throw new BadRequestException(
        'deliveryNote.errors.cannot_deliver_delivered',
      );
    }

    if (normalizedStatus !== DELIVERY_NOTE_STATUS.Created) {
      throw new BadRequestException(
        'deliveryNote.errors.deliver_only_from_created',
      );
    }

    return this.deliveryNoteRepository.save({
      id,
      status: this.toPersistenceStatus(
        DELIVERY_NOTE_STATUS.Delivered,
      ) as DELIVERY_NOTE_STATUS,
    });
  }

  @Transactional()
  async markDeliveredByTransformation(id: number): Promise<DeliveryNoteEntity> {
    const deliveryNote = await this.deliveryNoteRepository.findOne({
      where: { id },
      relations: ['invoices', 'returnNotes'],
    });
    if (!deliveryNote) {
      throw new BadRequestException('deliveryNote.errors.not_found');
    }

    const normalizedStatus = this.normalizeStatus(
      deliveryNote.status,
      this.hasTransformedDocuments(deliveryNote),
    );

    if (normalizedStatus === DELIVERY_NOTE_STATUS.Cancelled) {
      throw new BadRequestException('deliveryNote.errors.invalid_transition');
    }

    if (normalizedStatus === DELIVERY_NOTE_STATUS.Delivered) {
      return deliveryNote;
    }

    if (
      normalizedStatus !== DELIVERY_NOTE_STATUS.Draft &&
      normalizedStatus !== DELIVERY_NOTE_STATUS.Created
    ) {
      throw new BadRequestException('deliveryNote.errors.invalid_transition');
    }

    return this.deliveryNoteRepository.save({
      id,
      status: this.toPersistenceStatus(
        DELIVERY_NOTE_STATUS.Delivered,
      ) as DELIVERY_NOTE_STATUS,
    });
  }

  @Transactional()
  async updateStatus(
    id: number,
    status: DELIVERY_NOTE_STATUS,
  ): Promise<DeliveryNoteEntity> {
    const deliveryNote = await this.deliveryNoteRepository.findOne({
      where: { id },
    });
    if (!deliveryNote) {
      throw new BadRequestException('deliveryNote.errors.not_found');
    }

    const normalizedStatus = this.normalizeStatus(status, false);

    return this.deliveryNoteRepository.save({
      id,
      status: this.toPersistenceStatus(
        normalizedStatus,
      ) as DELIVERY_NOTE_STATUS,
    });
  }
}
