import { Injectable } from '@nestjs/common';
import { GoodsIssueNoteStockMovementRepository } from '../repositories/goods-issue-note-stock-movement.repository';
import { GoodsIssueNoteStockMovementEntity } from '../entities/goods-issue-note-stock-movement.entity';
import { GOODS_ISSUE_NOTE_STOCK_MOVEMENT_DIRECTION } from '../enums/goods-issue-note-stock-movement-direction.enum';

@Injectable()
export class GoodsIssueNoteStockMovementService {
  constructor(
    private readonly goodsIssueNoteStockMovementRepository: GoodsIssueNoteStockMovementRepository,
  ) {}

  async saveMany(
    data: Partial<GoodsIssueNoteStockMovementEntity>[],
  ): Promise<GoodsIssueNoteStockMovementEntity[]> {
    if (!data.length) {
      return [];
    }

    return this.goodsIssueNoteStockMovementRepository.saveMany(
      data.map((entry) => ({
        quantity: Number(entry.quantity ?? 0),
        articleId: entry.articleId,
        goodsIssueNoteId: entry.goodsIssueNoteId,
        direction:
          entry.direction ?? GOODS_ISSUE_NOTE_STOCK_MOVEMENT_DIRECTION.OUT,
      })),
    );
  }
}
