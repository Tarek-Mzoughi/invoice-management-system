import { Injectable } from '@nestjs/common';
import { ReturnNoteStockMovementRepository } from '../repositories/return-note-stock-movement.repository';
import { ReturnNoteStockMovementEntity } from '../entities/return-note-stock-movement.entity';
import { RETURN_NOTE_STOCK_MOVEMENT_DIRECTION } from '../enums/return-note-stock-movement-direction.enum';

@Injectable()
export class ReturnNoteStockMovementService {
  constructor(
    private readonly returnNoteStockMovementRepository: ReturnNoteStockMovementRepository,
  ) {}

  async saveMany(
    data: Partial<ReturnNoteStockMovementEntity>[],
  ): Promise<ReturnNoteStockMovementEntity[]> {
    if (!data.length) {
      return [];
    }

    return this.returnNoteStockMovementRepository.saveMany(
      data.map((entry) => ({
        quantity: Number(entry.quantity ?? 0),
        articleId: entry.articleId,
        returnNoteId: entry.returnNoteId,
        direction: entry.direction ?? RETURN_NOTE_STOCK_MOVEMENT_DIRECTION.OUT,
      })),
    );
  }
}
