/**
 * Reset demo data — deletes only DEMO- prefixed rows in reverse insertion order.
 * Covers ALL modules: treasury, payments, credit notes, return notes, invoices,
 * delivery notes, goods issue notes, customer orders, quotations, articles, firms, etc.
 * NEVER does TRUNCATE. NEVER touches non-demo data.
 */

import { DataSource } from 'typeorm';
import { DEMO_PREFIX } from './demo-data';

export async function resetDemoData(ds: DataSource): Promise<void> {
  console.log('\n🗑  Resetting ERP demo data (DEMO- prefix only)...\n');

  const qr = ds.createQueryRunner();
  await qr.connect();
  let foreignKeyChecksDisabled = false;

  try {
    await qr.query('SET FOREIGN_KEY_CHECKS = 0');
    foreignKeyChecksDisabled = true;

    const steps: { label: string; sql: string }[] = [
      // ─── Document uploads ─────────────────────────────────────────────
      {
        label: 'Quotation uploads',
        sql: `DELETE qu FROM \`quotation-upload\` qu
              INNER JOIN quotation q ON qu.quotationId = q.id
              WHERE q.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Customer order uploads',
        sql: `DELETE cou FROM \`customer-order-upload\` cou
              INNER JOIN customer_order co ON cou.customerOrderId = co.id
              WHERE co.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Delivery note uploads',
        sql: `DELETE dnu FROM \`delivery-note-upload\` dnu
              INNER JOIN delivery_note dn ON dnu.deliveryNoteId = dn.id
              WHERE dn.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Goods issue note uploads',
        sql: `DELETE ginu FROM \`goods-issue-note-upload\` ginu
              INNER JOIN goods_issue_note gin ON ginu.goodsIssueNoteId = gin.id
              WHERE gin.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Invoice uploads',
        sql: `DELETE iu FROM \`invoice-upload\` iu
              INNER JOIN invoice inv ON iu.invoiceId = inv.id
              WHERE inv.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Credit note uploads',
        sql: `DELETE cnu FROM \`credit-note-upload\` cnu
              INNER JOIN credit_note cn ON cnu.creditNoteId = cn.id
              WHERE cn.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Return note uploads',
        sql: `DELETE rnu FROM \`return-note-upload\` rnu
              INNER JOIN return_note rn ON rnu.returnNoteId = rn.id
              WHERE rn.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      // ─── Treasury Movements ───────────────────────────────────────────
      {
        label: 'Treasury movements',
        sql: `DELETE FROM treasury_movement WHERE label LIKE '${DEMO_PREFIX}%'`,
      },
      // ─── Payment-Credit-Note entries ──────────────────────────────────
      {
        label: 'Payment-CreditNote entries (via payment reference)',
        sql: `DELETE pcne FROM payment_credit_note_entry pcne
              INNER JOIN payment p ON pcne.paymentId = p.id
              WHERE p.reference LIKE '${DEMO_PREFIX}%'`,
      },
      // ─── Payment-Invoice entries ──────────────────────────────────────
      {
        label: 'Payment-Invoice entries (via payment reference)',
        sql: `DELETE pie FROM \`payment-invoice_entry\` pie
              INNER JOIN payment p ON pie.paymentId = p.id
              WHERE p.reference LIKE '${DEMO_PREFIX}%'`,
      },
      // ─── Payments ─────────────────────────────────────────────────────
      {
        label: 'Payments',
        sql: `DELETE FROM payment WHERE reference LIKE '${DEMO_PREFIX}%'`,
      },
      // ─── Return Note entries ──────────────────────────────────────────
      {
        label: 'Article-Return-Note entry taxes',
        sql: `DELETE arnet FROM article_return_note_entry_tax arnet
              INNER JOIN article_return_note_entry arne ON arnet.articleReturnNoteEntryId = arne.id
              INNER JOIN return_note rn ON arne.returnNoteId = rn.id
              WHERE rn.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Article-Return-Note entries',
        sql: `DELETE arne FROM article_return_note_entry arne
              INNER JOIN return_note rn ON arne.returnNoteId = rn.id
              WHERE rn.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Return note meta data',
        sql: `DELETE rnmd FROM return_note_meta_data rnmd
              INNER JOIN return_note rn ON rn.returnNoteMetaDataId = rnmd.id
              WHERE rn.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Return notes',
        sql: `DELETE FROM return_note WHERE sequential LIKE '${DEMO_PREFIX}%'`,
      },
      // ─── Credit Note entries ──────────────────────────────────────────
      {
        label: 'Article-Credit-Note entry taxes',
        sql: `DELETE acnet FROM article_credit_note_entry_tax acnet
              INNER JOIN article_credit_note_entry acne ON acnet.articleCreditNoteEntryId = acne.id
              INNER JOIN credit_note cn ON acne.creditNoteId = cn.id
              WHERE cn.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Article-Credit-Note entries',
        sql: `DELETE acne FROM article_credit_note_entry acne
              INNER JOIN credit_note cn ON acne.creditNoteId = cn.id
              WHERE cn.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Credit note meta data',
        sql: `DELETE cnmd FROM credit_note_meta_data cnmd
              INNER JOIN credit_note cn ON cn.creditNoteMetaDataId = cnmd.id
              WHERE cn.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Credit notes',
        sql: `DELETE FROM credit_note WHERE sequential LIKE '${DEMO_PREFIX}%'`,
      },
      // ─── Invoice entries ──────────────────────────────────────────────
      {
        label: 'Article-Invoice entry taxes',
        sql: `DELETE aiet FROM \`article-invoice-entry-tax\` aiet
              INNER JOIN \`article-invoice-entry\` aie ON aiet.articleInvoiceEntryId = aie.id
              INNER JOIN invoice inv ON aie.invoiceId = inv.id
              WHERE inv.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Article-Invoice entries',
        sql: `DELETE aie FROM \`article-invoice-entry\` aie
              INNER JOIN invoice inv ON aie.invoiceId = inv.id
              WHERE inv.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Invoice meta data',
        sql: `DELETE imd FROM invoice_meta_data imd
              INNER JOIN invoice inv ON inv.invoiceMetaDataId = imd.id
              WHERE inv.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Invoices',
        sql: `DELETE FROM invoice WHERE sequential LIKE '${DEMO_PREFIX}%'`,
      },
      // ─── Goods Issue Note entries ─────────────────────────────────────
      {
        label: 'Article-GoodsIssueNote entry taxes',
        sql: `DELETE aginet FROM \`article-goods-issue-note-entry-tax\` aginet
              INNER JOIN \`article-goods-issue-note-entry\` agine ON aginet.articleGoodsIssueNoteEntryId = agine.id
              INNER JOIN goods_issue_note gin ON agine.goodsIssueNoteId = gin.id
              WHERE gin.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Article-GoodsIssueNote entries',
        sql: `DELETE agine FROM \`article-goods-issue-note-entry\` agine
              INNER JOIN goods_issue_note gin ON agine.goodsIssueNoteId = gin.id
              WHERE gin.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Goods issue note meta data',
        sql: `DELETE ginmd FROM goods_issue_note_meta_data ginmd
              INNER JOIN goods_issue_note gin ON gin.goodsIssueNoteMetaDataId = ginmd.id
              WHERE gin.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Goods issue notes',
        sql: `DELETE FROM goods_issue_note WHERE sequential LIKE '${DEMO_PREFIX}%'`,
      },
      // ─── Delivery Note entries ────────────────────────────────────────
      {
        label: 'Article-DeliveryNote entry taxes',
        sql: `DELETE adnet FROM \`article-delivery-note-entry-tax\` adnet
              INNER JOIN \`article-delivery-note-entry\` adne ON adnet.articleDeliveryNoteEntryId = adne.id
              INNER JOIN delivery_note dn ON adne.deliveryNoteId = dn.id
              WHERE dn.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Article-DeliveryNote entries',
        sql: `DELETE adne FROM \`article-delivery-note-entry\` adne
              INNER JOIN delivery_note dn ON adne.deliveryNoteId = dn.id
              WHERE dn.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Delivery note meta data',
        sql: `DELETE dnmd FROM delivery_note_meta_data dnmd
              INNER JOIN delivery_note dn ON dn.deliveryNoteMetaDataId = dnmd.id
              WHERE dn.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Delivery notes',
        sql: `DELETE FROM delivery_note WHERE sequential LIKE '${DEMO_PREFIX}%'`,
      },
      // ─── Customer Order entries ───────────────────────────────────────
      {
        label: 'Article-CustomerOrder entry taxes',
        sql: `DELETE acoet FROM \`article-customer-order-entry-tax\` acoet
              INNER JOIN \`article-customer-order-entry\` acoe ON acoet.articleCustomerOrderEntryId = acoe.id
              INNER JOIN customer_order co ON acoe.customerOrderId = co.id
              WHERE co.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Article-CustomerOrder entries',
        sql: `DELETE acoe FROM \`article-customer-order-entry\` acoe
              INNER JOIN customer_order co ON acoe.customerOrderId = co.id
              WHERE co.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Customer order meta data',
        sql: `DELETE comd FROM customer_order_meta_data comd
              INNER JOIN customer_order co ON co.customerOrderMetaDataId = comd.id
              WHERE co.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Customer orders',
        sql: `DELETE FROM customer_order WHERE sequential LIKE '${DEMO_PREFIX}%'`,
      },
      // ─── Quotation entries ────────────────────────────────────────────
      {
        label: 'Article-Quotation entry taxes',
        sql: `DELETE aqet FROM \`article-quotation-entry-tax\` aqet
              INNER JOIN \`article-quotation-entry\` aqe ON aqet.articleQuotationEntryId = aqe.id
              INNER JOIN quotation q ON aqe.quotationId = q.id
              WHERE q.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Article-Quotation entries',
        sql: `DELETE aqe FROM \`article-quotation-entry\` aqe
              INNER JOIN quotation q ON aqe.quotationId = q.id
              WHERE q.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Quotation meta data',
        sql: `DELETE qmd FROM quotation_meta_data qmd
              INNER JOIN quotation q ON q.quotationMetaDataId = qmd.id
              WHERE q.sequential LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Quotations',
        sql: `DELETE FROM quotation WHERE sequential LIKE '${DEMO_PREFIX}%'`,
      },
      // ─── Reference data ───────────────────────────────────────────────
      {
        label: 'Articles',
        sql: `DELETE FROM article WHERE reference LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Firm-Interlocutor entries (via firm name)',
        sql: `DELETE fie FROM firm_interlocutor_entry fie
              INNER JOIN firm f ON fie.firmId = f.id
              WHERE f.name LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Firms',
        sql: `DELETE FROM firm WHERE name LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Interlocutors',
        sql: `DELETE FROM interlocutor WHERE name LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Withholding taxes',
        sql: `DELETE FROM \`tax-withholding\` WHERE label LIKE '${DEMO_PREFIX}%'`,
      },
      {
        label: 'Bank accounts',
        sql: `DELETE FROM bank_account WHERE name LIKE '${DEMO_PREFIX}%'`,
      },
    ];

    for (const step of steps) {
      const result = await qr.query(step.sql);
      const affected = result?.affectedRows ?? result?.[0]?.affectedRows ?? '?';
      console.log(`  ✔ ${step.label}: ${affected} rows deleted`);
    }

    console.log('\n✔ ERP demo data reset complete.\n');
  } finally {
    if (foreignKeyChecksDisabled) {
      await qr.query('SET FOREIGN_KEY_CHECKS = 1');
    }
    await qr.release();
  }
}
