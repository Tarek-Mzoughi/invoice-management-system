import { BadRequestException, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CustomerOrderEntity } from '../entities/customer-order.entity';
import { CUSTOMER_ORDER_STATUS } from '../enums/customer-order-status.enum';
import { CustomerOrderRepository } from '../repositories/customer-order.repository';
import { DELIVERY_NOTE_STATUS } from 'src/modules/delivery-note/enums/delivery-note-status.enum';

type CustomerOrderWithLinkedDocuments = Partial<
  Pick<
    CustomerOrderEntity,
    'status' | 'invoices' | 'deliveryNotes' | 'goodsIssueNotes'
  >
>;

@Injectable()
export class CustomerOrderLifecycleService {
  constructor(
    private readonly customerOrderRepository: CustomerOrderRepository,
  ) {}

  private hasInvoices(
    customerOrder?: CustomerOrderWithLinkedDocuments | null,
  ): boolean {
    return (customerOrder?.invoices?.length ?? 0) > 0;
  }

  private hasDeliveryNotes(
    customerOrder?: CustomerOrderWithLinkedDocuments | null,
  ): boolean {
    return (customerOrder?.deliveryNotes?.length ?? 0) > 0;
  }

  private hasGoodsIssueNotes(
    customerOrder?: CustomerOrderWithLinkedDocuments | null,
  ): boolean {
    return (customerOrder?.goodsIssueNotes?.length ?? 0) > 0;
  }

  hasTransformedDocuments(
    customerOrder?: CustomerOrderWithLinkedDocuments | null,
  ): boolean {
    if (!customerOrder) return false;

    return Boolean(
      this.hasInvoices(customerOrder) ||
        this.hasDeliveryNotes(customerOrder) ||
        this.hasGoodsIssueNotes(customerOrder),
    );
  }

  normalizeStatus(
    status?: CUSTOMER_ORDER_STATUS | string | null,
    hasTransformedDocuments: boolean = false,
  ): CUSTOMER_ORDER_STATUS {
    switch (status) {
      case CUSTOMER_ORDER_STATUS.Draft:
      case 'draft':
        return CUSTOMER_ORDER_STATUS.Draft;
      case CUSTOMER_ORDER_STATUS.Created:
      case 'created':
      case 'customerOrder.status.created':
      case 'customerOrder.status.sent':
      case 'sent':
        return CUSTOMER_ORDER_STATUS.Created;
      case CUSTOMER_ORDER_STATUS.Validated:
      case 'validated':
      case 'customerOrder.status.validated':
        return CUSTOMER_ORDER_STATUS.Validated;
      case 'customerOrder.status.accepted':
      case 'accepted':
      case 'customerOrder.status.invoiced':
      case 'invoiced':
        return hasTransformedDocuments
          ? CUSTOMER_ORDER_STATUS.Validated
          : CUSTOMER_ORDER_STATUS.Created;
      case CUSTOMER_ORDER_STATUS.Cancelled:
      case 'cancelled':
      case 'canceled':
      case 'customerOrder.status.cancelled':
      case 'customerOrder.status.rejected':
      case 'rejected':
      case 'customerOrder.status.expired':
      case 'expired':
      case 'customerOrder.status.archived':
      case 'archived':
        return CUSTOMER_ORDER_STATUS.Cancelled;
      case 'customerOrder.status.non_existent':
      case 'nonexistent':
      case undefined:
      case null:
      default:
        return CUSTOMER_ORDER_STATUS.Draft;
    }
  }

  normalizeCustomerOrderStatus<T extends CustomerOrderWithLinkedDocuments>(
    customerOrder: T | null,
  ): T | null {
    if (!customerOrder) return null;

    return {
      ...customerOrder,
      status: this.normalizeStatus(
        customerOrder.status,
        this.hasTransformedDocuments(customerOrder),
      ),
      deliveryNotes: customerOrder.deliveryNotes
        ? this.normalizeLinkedDeliveryNotesStatus(customerOrder.deliveryNotes)
        : customerOrder.deliveryNotes,
    };
  }

  private normalizeLinkedDeliveryNoteStatus(
    status?: DELIVERY_NOTE_STATUS | string | null,
  ): DELIVERY_NOTE_STATUS {
    switch (status) {
      case DELIVERY_NOTE_STATUS.Draft:
      case 'draft':
      case 'deliveryNote.status.draft':
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

  private normalizeLinkedDeliveryNotesStatus<
    T extends { status?: string | null },
  >(deliveryNotes: T[]): T[] {
    return deliveryNotes.map((deliveryNote) => ({
      ...deliveryNote,
      status: this.normalizeLinkedDeliveryNoteStatus(deliveryNote.status),
    }));
  }

  normalizeCustomerOrdersStatus<T extends CustomerOrderWithLinkedDocuments>(
    customerOrders: T[],
  ): T[] {
    return customerOrders.map(
      (customerOrder) => this.normalizeCustomerOrderStatus(customerOrder) as T,
    );
  }

  resolveCreateStatus(
    requestedStatus?: CUSTOMER_ORDER_STATUS,
  ): CUSTOMER_ORDER_STATUS {
    const nextStatus = requestedStatus ?? CUSTOMER_ORDER_STATUS.Draft;

    if (
      nextStatus !== CUSTOMER_ORDER_STATUS.Draft &&
      nextStatus !== CUSTOMER_ORDER_STATUS.Created
    ) {
      throw new BadRequestException('customerOrder.errors.invalid_save_status');
    }

    return nextStatus;
  }

  resolveUpdateStatus(
    customerOrder: CustomerOrderWithLinkedDocuments,
    requestedStatus?: CUSTOMER_ORDER_STATUS,
  ): CUSTOMER_ORDER_STATUS {
    const currentStatus = this.normalizeStatus(
      customerOrder.status,
      this.hasTransformedDocuments(customerOrder),
    );

    if (
      currentStatus === CUSTOMER_ORDER_STATUS.Validated ||
      currentStatus === CUSTOMER_ORDER_STATUS.Cancelled
    ) {
      throw new BadRequestException(
        'customerOrder.errors.cannot_modify_locked',
      );
    }

    const nextStatus = requestedStatus ?? currentStatus;

    if (
      nextStatus !== CUSTOMER_ORDER_STATUS.Draft &&
      nextStatus !== CUSTOMER_ORDER_STATUS.Created
    ) {
      throw new BadRequestException('customerOrder.errors.invalid_save_status');
    }

    if (
      currentStatus === CUSTOMER_ORDER_STATUS.Created &&
      nextStatus !== CUSTOMER_ORDER_STATUS.Created
    ) {
      throw new BadRequestException('customerOrder.errors.invalid_transition');
    }

    return nextStatus;
  }

  assertCanTransformToDeliveryNote(
    customerOrder: CustomerOrderWithLinkedDocuments | null,
  ) {
    if (!customerOrder) {
      throw new BadRequestException('customerOrder.errors.not_found');
    }

    const normalizedStatus = this.normalizeStatus(
      customerOrder.status,
      this.hasTransformedDocuments(customerOrder),
    );

    if (normalizedStatus === CUSTOMER_ORDER_STATUS.Cancelled) {
      throw new BadRequestException(
        'customerOrder.errors.cannot_transform_cancelled',
      );
    }

    if (normalizedStatus === CUSTOMER_ORDER_STATUS.Validated) {
      throw new BadRequestException(
        'customerOrder.errors.cannot_transform_validated',
      );
    }

    if (this.hasDeliveryNotes(customerOrder)) {
      throw new BadRequestException(
        'customerOrder.errors.delivery_note_already_exists',
      );
    }

    if (this.hasInvoices(customerOrder)) {
      throw new BadRequestException('customerOrder.errors.already_transformed');
    }

    if (this.hasGoodsIssueNotes(customerOrder)) {
      throw new BadRequestException(
        'customerOrder.errors.goods_issue_note_not_supported',
      );
    }

    if (
      normalizedStatus !== CUSTOMER_ORDER_STATUS.Draft &&
      normalizedStatus !== CUSTOMER_ORDER_STATUS.Created
    ) {
      throw new BadRequestException('customerOrder.errors.invalid_transition');
    }
  }

  assertCanTransformToInvoice(
    customerOrder: CustomerOrderWithLinkedDocuments | null,
  ) {
    if (!customerOrder) {
      throw new BadRequestException('customerOrder.errors.not_found');
    }

    const normalizedStatus = this.normalizeStatus(
      customerOrder.status,
      this.hasTransformedDocuments(customerOrder),
    );

    if (normalizedStatus === CUSTOMER_ORDER_STATUS.Cancelled) {
      throw new BadRequestException(
        'customerOrder.errors.cannot_transform_cancelled',
      );
    }

    if (this.hasInvoices(customerOrder)) {
      throw new BadRequestException(
        'customerOrder.errors.invoice_already_exists',
      );
    }

    if (this.hasGoodsIssueNotes(customerOrder)) {
      throw new BadRequestException(
        'customerOrder.errors.goods_issue_note_not_supported',
      );
    }

    if (
      normalizedStatus !== CUSTOMER_ORDER_STATUS.Draft &&
      normalizedStatus !== CUSTOMER_ORDER_STATUS.Created &&
      normalizedStatus !== CUSTOMER_ORDER_STATUS.Validated
    ) {
      throw new BadRequestException('customerOrder.errors.invalid_transition');
    }
  }

  @Transactional()
  async validate(id: number): Promise<CustomerOrderEntity> {
    const customerOrder = await this.customerOrderRepository.findOne({
      where: { id },
      relations: ['invoices', 'deliveryNotes', 'goodsIssueNotes'],
    });
    if (!customerOrder) {
      throw new BadRequestException('customerOrder.errors.not_found');
    }

    const normalizedStatus = this.normalizeStatus(
      customerOrder.status,
      this.hasTransformedDocuments(customerOrder),
    );

    if (normalizedStatus === CUSTOMER_ORDER_STATUS.Cancelled) {
      throw new BadRequestException(
        'customerOrder.errors.cannot_validate_cancelled',
      );
    }

    if (normalizedStatus === CUSTOMER_ORDER_STATUS.Validated) {
      throw new BadRequestException(
        'customerOrder.errors.cannot_validate_validated',
      );
    }

    if (normalizedStatus !== CUSTOMER_ORDER_STATUS.Draft) {
      throw new BadRequestException(
        'customerOrder.errors.validate_only_from_draft',
      );
    }

    return this.customerOrderRepository.save({
      id,
      status: CUSTOMER_ORDER_STATUS.Created,
    });
  }

  @Transactional()
  async cancel(id: number): Promise<CustomerOrderEntity> {
    const customerOrder = await this.customerOrderRepository.findOne({
      where: { id },
      relations: ['invoices', 'deliveryNotes', 'goodsIssueNotes'],
    });
    if (!customerOrder) {
      throw new BadRequestException('customerOrder.errors.not_found');
    }

    const normalizedStatus = this.normalizeStatus(
      customerOrder.status,
      this.hasTransformedDocuments(customerOrder),
    );

    if (normalizedStatus === CUSTOMER_ORDER_STATUS.Validated) {
      throw new BadRequestException(
        'customerOrder.errors.cannot_cancel_validated',
      );
    }

    if (normalizedStatus === CUSTOMER_ORDER_STATUS.Cancelled) {
      throw new BadRequestException(
        'customerOrder.errors.cannot_cancel_cancelled',
      );
    }

    if (
      normalizedStatus !== CUSTOMER_ORDER_STATUS.Draft &&
      normalizedStatus !== CUSTOMER_ORDER_STATUS.Created
    ) {
      throw new BadRequestException('customerOrder.errors.invalid_transition');
    }

    return this.customerOrderRepository.save({
      id,
      status: CUSTOMER_ORDER_STATUS.Cancelled,
    });
  }

  @Transactional()
  async markValidatedByTransformation(
    id: number,
  ): Promise<CustomerOrderEntity> {
    const customerOrder = await this.customerOrderRepository.findOne({
      where: { id },
      relations: ['invoices', 'deliveryNotes', 'goodsIssueNotes'],
    });
    if (!customerOrder) {
      throw new BadRequestException('customerOrder.errors.not_found');
    }

    const normalizedStatus = this.normalizeStatus(
      customerOrder.status,
      this.hasTransformedDocuments(customerOrder),
    );

    if (normalizedStatus === CUSTOMER_ORDER_STATUS.Cancelled) {
      throw new BadRequestException('customerOrder.errors.invalid_transition');
    }

    return this.customerOrderRepository.save({
      id,
      status: CUSTOMER_ORDER_STATUS.Validated,
    });
  }

  @Transactional()
  async updateStatus(
    id: number,
    status: CUSTOMER_ORDER_STATUS,
  ): Promise<CustomerOrderEntity> {
    const customerOrder = await this.customerOrderRepository.findOne({
      where: { id },
    });
    if (!customerOrder) {
      throw new BadRequestException('customerOrder.errors.not_found');
    }

    const normalizedStatus = this.normalizeStatus(status, false);

    return this.customerOrderRepository.save({
      id,
      status: normalizedStatus,
    });
  }
}
