import 'dotenv/config';
import { createConnection, RowDataPacket } from 'mysql2/promise';
import {
  createDocumentSequenceRepairPlan,
  DOCUMENT_SEQUENCE_SOURCES,
  DocumentSequenceRow,
  SequenceConfigRow,
} from './document-sequence-repair';

const isApply = process.argv.includes('--apply');

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Document sequence repair is disabled in production');
  }

  const connection = await createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USERNAME || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'invoicing',
  });

  try {
    const [sequenceRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, label, prefix, dateFormat, next FROM sequences',
    );
    const documentsByTable: Record<string, DocumentSequenceRow[]> = {};

    for (const source of DOCUMENT_SEQUENCE_SOURCES) {
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT id, sequential, date, activityType FROM \`${source.table}\``,
      );
      documentsByTable[source.table] = rows as DocumentSequenceRow[];
    }

    const plan = createDocumentSequenceRepairPlan(
      sequenceRows as SequenceConfigRow[],
      documentsByTable,
    );

    console.log(
      `Document changes: ${plan.documentChanges.length}, sequence counters: ${plan.sequenceChanges.length}`,
    );
    for (const change of plan.documentChanges) {
      console.log(
        `${change.table}#${change.id}: ${change.previous} -> ${change.next}`,
      );
    }
    for (const change of plan.sequenceChanges) {
      console.log(
        `sequences.${change.label}: ${change.previous} -> ${change.next}`,
      );
    }

    if (plan.errors.length) {
      for (const error of plan.errors) console.error(`ERROR: ${error}`);
      throw new Error('Repair plan contains errors; no changes were applied');
    }

    if (!isApply) {
      console.log(
        'Preview only. Re-run with --apply to persist these changes.',
      );
      return;
    }

    await connection.beginTransaction();
    try {
      for (let index = 0; index < plan.documentChanges.length; index += 1) {
        const change = plan.documentChanges[index];
        const temporary = `RPR-${index}-${change.id}`;
        await connection.execute(
          `UPDATE \`${change.table}\` SET sequential = ? WHERE id = ?`,
          [temporary, change.id],
        );
      }
      for (const change of plan.documentChanges) {
        await connection.execute(
          `UPDATE \`${change.table}\` SET sequential = ? WHERE id = ?`,
          [change.next, change.id],
        );
      }
      for (const change of plan.sequenceChanges) {
        await connection.execute('UPDATE sequences SET next = ? WHERE id = ?', [
          change.next,
          change.id,
        ]);
      }
      await connection.commit();
      console.log('Document sequences repaired successfully.');
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    await connection.end();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
