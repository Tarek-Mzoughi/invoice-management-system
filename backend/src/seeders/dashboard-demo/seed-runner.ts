/**
 * Comprehensive ERP seed runner — creates all demo data covering ALL business modules.
 * Modules: Selling, Buying, Payments, Treasury, Withholding Tax, Reference data.
 */

import { DataSource } from 'typeorm';
import { addDays, subMonths, startOfMonth } from 'date-fns';

// Entities
import { BankAccountEntity } from 'src/modules/bank-account/entities/bank-account.entity';
import { InterlocutorEntity } from 'src/modules/interlocutor/entities/interlocutor.entity';
import { FirmEntity } from 'src/modules/firm/entities/firm.entity';
import { FirmInterlocutorEntryEntity } from 'src/modules/firm-interlocutor-entry/entities/firm-interlocutor-entry.entity';
import { ArticleEntity } from 'src/modules/article/entities/article.entity';
import { QuotationEntity } from 'src/modules/quotation/entities/quotation.entity';
import { QuotationMetaDataEntity } from 'src/modules/quotation/entities/quotation-meta-data.entity';
import { ArticleQuotationEntryEntity } from 'src/modules/quotation/entities/article-quotation-entry.entity';
import { CustomerOrderEntity } from 'src/modules/customer-order/entities/customer-order.entity';
import { CustomerOrderMetaDataEntity } from 'src/modules/customer-order/entities/customer-order-meta-data.entity';
import { ArticleCustomerOrderEntryEntity } from 'src/modules/customer-order/entities/article-customer-order-entry.entity';
import { DeliveryNoteEntity } from 'src/modules/delivery-note/entities/delivery-note.entity';
import { DeliveryNoteMetaDataEntity } from 'src/modules/delivery-note/entities/delivery-note-meta-data.entity';
import { ArticleDeliveryNoteEntryEntity } from 'src/modules/delivery-note/entities/article-delivery-note-entry.entity';
import { GoodsIssueNoteEntity } from 'src/modules/goods-issue-note/entities/goods-issue-note.entity';
import { GoodsIssueNoteMetaDataEntity } from 'src/modules/goods-issue-note/entities/goods-issue-note-meta-data.entity';
import { ArticleGoodsIssueNoteEntryEntity } from 'src/modules/goods-issue-note/entities/article-goods-issue-note-entry.entity';
import { InvoiceEntity } from 'src/modules/invoice/entities/invoice.entity';
import { InvoiceMetaDataEntity } from 'src/modules/invoice/entities/invoice-meta-data.entity';
import { ArticleInvoiceEntryEntity } from 'src/modules/invoice/entities/article-invoice-entry.entity';
import { CreditNoteEntity } from 'src/modules/credit-note/entities/credit-note.entity';
import { CreditNoteMetaDataEntity } from 'src/modules/credit-note/entities/credit-note-meta-data.entity';
import { ArticleCreditNoteEntryEntity } from 'src/modules/credit-note/entities/article-credit-note-entry.entity';
import { ReturnNoteEntity } from 'src/modules/return-note/entities/return-note.entity';
import { ReturnNoteMetaDataEntity } from 'src/modules/return-note/entities/return-note-meta-data.entity';
import { ArticleReturnNoteEntryEntity } from 'src/modules/return-note/entities/article-return-note-entry.entity';
import { PaymentEntity } from 'src/modules/payment/entities/payment.entity';
import { PaymentInvoiceEntryEntity } from 'src/modules/payment/entities/payment-invoice-entry.entity';
import { PaymentCreditNoteEntryEntity } from 'src/modules/payment/entities/payment-credit-note-entry.entity';
import { TreasuryMovementEntity } from 'src/modules/treasury-movement/entities/treasury-movement.entity';
import { TaxWithholdingEntity } from 'src/modules/tax-withholding/entities/tax-withholding.entity';
import { CurrencyEntity } from 'src/modules/currency/entities/currency.entity';
import { CabinetEntity } from 'src/modules/cabinet/entities/cabinet.entity';

// Enums
import { FIRM_ENTITY_TYPE } from 'src/modules/firm/enums/firm-entity-type.enum';
import { BANK_ACCOUNT_TYPE } from 'src/modules/bank-account/enums/bank-account-type.enum';
import { INVOICE_STATUS } from 'src/modules/invoice/enums/invoice-status.enum';
import { PAYMENT_MODE } from 'src/modules/payment/enums/payment-mode.enum';
import { PAYMENT_COLLECTION_STATUS } from 'src/modules/payment/enums/payment-collection-status.enum';
import { QUOTATION_STATUS } from 'src/modules/quotation/enums/quotation-status.enum';
import { CUSTOMER_ORDER_STATUS } from 'src/modules/customer-order/enums/customer-order-status.enum';
import { DELIVERY_NOTE_STATUS } from 'src/modules/delivery-note/enums/delivery-note-status.enum';
import { CREDIT_NOTE_STATUS } from 'src/modules/credit-note/enums/credit-note-status.enum';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';
import { TREASURY_MOVEMENT_KIND } from 'src/modules/treasury-movement/enums/treasury-movement-kind.enum';
import { TREASURY_MOVEMENT_DIRECTION } from 'src/modules/treasury-movement/enums/treasury-movement-direction.enum';

// Data
import {
  DEMO_PREFIX,
  DEMO_CLIENTS,
  DEMO_SUPPLIERS,
  DEMO_INTERLOCUTORS,
  DEMO_ARTICLES,
  DEMO_BANK_ACCOUNTS,
  DEMO_WITHHOLDING_TAXES,
} from './demo-data';
import { DEMO_DOCUMENT_STATUS_POOLS } from './seed-statuses';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function randomDate(start: Date, end: Date, seed: number): Date {
  const range = end.getTime() - start.getTime();
  const offset = Math.abs(Math.sin(seed * 9301 + 49297) * range) % range;
  return new Date(start.getTime() + offset);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(Math.floor(Math.sin(seed) * 10000)) % arr.length];
}

function pickN<T>(arr: T[], count: number, seed: number): T[] {
  const shuffled = [...arr].sort(
    (a, b) => Math.sin(seed + arr.indexOf(a)) - Math.sin(seed + arr.indexOf(b)),
  );
  return shuffled.slice(0, count);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function randomFloat(min: number, max: number, seed: number): number {
  return min + Math.abs(Math.sin(seed * 7919)) * (max - min);
}

function randomInt(min: number, max: number, seed: number): number {
  return Math.floor(randomFloat(min, max + 1, seed));
}

function nextRef(prefix: string, counter: { v: number }, pad = 4): string {
  counter.v++;
  return `${DEMO_PREFIX}${prefix}-${String(counter.v).padStart(pad, '0')}`;
}

const counters = {
  inv: { v: 0 },
  quo: { v: 0 },
  ord: { v: 0 },
  del: { v: 0 },
  gin: { v: 0 },
  crn: { v: 0 },
  rtn: { v: 0 },
  pay: { v: 0 },
};

// ─── Summary tracker ─────────────────────────────────────────────────────────
const summary = {
  bankAccounts: 0,
  clients: 0,
  suppliers: 0,
  interlocutors: 0,
  articles: 0,
  withholdingTaxes: 0,
  quotations: 0,
  customerOrders: 0,
  deliveryNotes: 0,
  goodsIssueNotes: 0,
  sellingInvoices: 0,
  buyingInvoices: 0,
  creditNotesSelling: 0,
  creditNotesBuying: 0,
  returnNotesSelling: 0,
  returnNotesBuying: 0,
  paymentsSelling: 0,
  paymentsBuying: 0,
  paymentInvoiceEntries: 0,
  paymentCreditNoteEntries: 0,
  treasuryMovements: 0,
  documentLines: 0,
  totalRevenue: 0,
  totalPurchases: 0,
  totalCollectedSelling: 0,
  totalCollectedBuying: 0,
};

function resetSummary(): void {
  for (const key of Object.keys(summary) as (keyof typeof summary)[]) {
    summary[key] = 0;
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function seedDashboardDemo(ds: DataSource): Promise<void> {
  console.log('\n🌱 Starting comprehensive ERP demo seed...\n');

  // Reset all counters
  Object.values(counters).forEach((c) => {
    c.v = 0;
  });
  resetSummary();

  // Resolve cabinet & currency
  const cabinetRepo = ds.getRepository(CabinetEntity);
  const currencyRepo = ds.getRepository(CurrencyEntity);

  const cabinet = await cabinetRepo.findOne({ where: { id: 1 } });
  if (!cabinet) {
    throw new Error('Cabinet id=1 not found. Ensure base data exists.');
  }
  const cabinetId = cabinet.id;

  let currency = await currencyRepo.findOne({ where: { code: 'TND' } });
  if (!currency) {
    currency = await currencyRepo.findOne({
      where: { id: cabinet.currencyId },
    });
  }
  if (!currency) {
    throw new Error('No TND currency found and cabinet has no currency.');
  }
  const currencyId = currency.id;

  if (cabinet.currencyId !== currencyId) {
    await cabinetRepo.update(cabinetId, { currencyId });
    console.log(`  ℹ Updated cabinet currency to TND (id=${currencyId})`);
  }

  // Time range: 15 months back from now
  const now = new Date();
  const seedStart = startOfMonth(subMonths(now, 15));
  const seedEnd = now;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Bank Accounts
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [1/14] Creating bank accounts...');
  const bankAccountRepo = ds.getRepository(BankAccountEntity);
  const bankAccounts: BankAccountEntity[] = [];
  for (const ba of DEMO_BANK_ACCOUNTS) {
    const saved = await bankAccountRepo.save(
      bankAccountRepo.create({
        name: ba.name,
        rib: ba.rib || undefined,
        iban: ba.iban || undefined,
        bic: ba.bic || undefined,
        agency: ba.agency || undefined,
        type:
          ba.type === 'cash' ? BANK_ACCOUNT_TYPE.CASH : BANK_ACCOUNT_TYPE.BANK,
        currencyId,
        cabinetId,
        isMain: ba.isMain,
      }),
    );
    bankAccounts.push(saved);
  }
  summary.bankAccounts = bankAccounts.length;

  const mainBankAccount = bankAccounts[0];

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Withholding Taxes
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [2/14] Creating withholding tax entries...');
  const taxWhRepo = ds.getRepository(TaxWithholdingEntity);
  const withholdingTaxes: TaxWithholdingEntity[] = [];
  for (const tw of DEMO_WITHHOLDING_TAXES) {
    const saved = await taxWhRepo.save(
      taxWhRepo.create({ label: tw.label, rate: tw.rate }),
    );
    withholdingTaxes.push(saved);
  }
  summary.withholdingTaxes = withholdingTaxes.length;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Interlocutors & Firms
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [3/14] Creating interlocutors & firms...');
  const interlocutorRepo = ds.getRepository(InterlocutorEntity);
  const firmRepo = ds.getRepository(FirmEntity);
  const firmInterlocutorRepo = ds.getRepository(FirmInterlocutorEntryEntity);

  const clientFirms: FirmEntity[] = [];
  const supplierFirms: FirmEntity[] = [];
  const allInterlocutors: InterlocutorEntity[] = [];

  // Create client firms
  for (let i = 0; i < DEMO_CLIENTS.length; i++) {
    const cl = DEMO_CLIENTS[i];
    const inter = DEMO_INTERLOCUTORS[i];
    const interlocutor = await interlocutorRepo.save(
      interlocutorRepo.create({
        title: inter.title,
        name: inter.name,
        surname: inter.surname,
        email: inter.email,
      }),
    );
    allInterlocutors.push(interlocutor);

    const firm = await firmRepo.save(
      firmRepo.create({
        name: cl.name,
        entityType: FIRM_ENTITY_TYPE.CLIENTS,
        isPerson: cl.isPerson,
        phone: cl.phone,
        taxIdNumber: cl.taxId || undefined,
        website: '',
        notes: '',
        currencyId,
        cabinetId,
      }),
    );
    clientFirms.push(firm);

    await firmInterlocutorRepo.save(
      firmInterlocutorRepo.create({
        firmId: firm.id,
        interlocutorId: interlocutor.id,
        isMain: true,
        position: 'Gérant',
      }),
    );
  }
  summary.clients = clientFirms.length;

  // Create supplier firms
  for (let i = 0; i < DEMO_SUPPLIERS.length; i++) {
    const sup = DEMO_SUPPLIERS[i];
    const inter = DEMO_INTERLOCUTORS[DEMO_CLIENTS.length + i];
    const interlocutor = await interlocutorRepo.save(
      interlocutorRepo.create({
        title: inter.title,
        name: inter.name,
        surname: inter.surname,
        email: inter.email,
      }),
    );
    allInterlocutors.push(interlocutor);

    const firm = await firmRepo.save(
      firmRepo.create({
        name: sup.name,
        entityType: FIRM_ENTITY_TYPE.SUPPLIERS,
        isPerson: sup.isPerson,
        phone: sup.phone,
        taxIdNumber: sup.taxId || undefined,
        website: '',
        notes: '',
        currencyId,
        cabinetId,
      }),
    );
    supplierFirms.push(firm);

    await firmInterlocutorRepo.save(
      firmInterlocutorRepo.create({
        firmId: firm.id,
        interlocutorId: interlocutor.id,
        isMain: true,
        position: 'Directeur',
      }),
    );
  }
  summary.suppliers = supplierFirms.length;
  summary.interlocutors = allInterlocutors.length;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Articles
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [4/14] Creating articles...');
  const articleRepo = ds.getRepository(ArticleEntity);
  const articles: ArticleEntity[] = [];
  for (const art of DEMO_ARTICLES) {
    const saved = await articleRepo.save(
      articleRepo.create({
        title: art.title,
        reference: art.reference,
        articleType: art.type,
        destination: art.destination,
        salePrice: art.salePrice,
        purchasePrice: art.purchasePrice,
        unit: art.unit,
        family: art.family,
        cabinetId,
        isService: art.type === 'service',
      }),
    );
    articles.push(saved);
  }
  summary.articles = articles.length;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: Quotations (40)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [5/14] Creating quotations...');
  const quotationRepo = ds.getRepository(QuotationEntity);
  const quotationMetaRepo = ds.getRepository(QuotationMetaDataEntity);
  const quotationEntryRepo = ds.getRepository(ArticleQuotationEntryEntity);
  const quotations: QuotationEntity[] = [];

  for (let i = 0; i < 40; i++) {
    const client = pick(clientFirms, i * 7 + 1);
    const interlocutor = allInterlocutors[clientFirms.indexOf(client)];
    const date = randomDate(seedStart, seedEnd, i * 13 + 5);
    const dueDate = addDays(date, randomInt(15, 60, i * 11));
    const status =
      DEMO_DOCUMENT_STATUS_POOLS.quotation[
        i % DEMO_DOCUMENT_STATUS_POOLS.quotation.length
      ];
    const lineCount = randomInt(1, 4, i * 3 + 7);
    let subTotal = 0;
    const meta = await quotationMetaRepo.save(quotationMetaRepo.create({}));

    const quotation = await quotationRepo.save(
      quotationRepo.create({
        sequential: nextRef('QUO', counters.quo),
        activityType: ACTIVITY_TYPE.SELLING,
        date,
        dueDate,
        status,
        currencyId,
        firmId: client.id,
        interlocutorId: interlocutor.id,
        cabinetId,
        bankAccountId: mainBankAccount.id,
        quotationMetaData: meta,
        object: `Devis ${counters.quo.v}`,
        notes: '',
      }),
    );

    const selectedArticles = pickN(articles.slice(0, 20), lineCount, i * 19);
    for (const art of selectedArticles) {
      const qty = randomInt(1, 10, i * 17 + articles.indexOf(art));
      const unitPrice = art.salePrice || 100;
      const lineTotal = round3(qty * unitPrice);
      subTotal += lineTotal;
      await quotationEntryRepo.save(
        quotationEntryRepo.create({
          quotationId: quotation.id,
          articleId: art.id,
          unit_price: unitPrice,
          quantity: qty,
          subTotal: lineTotal,
          total: lineTotal,
        }),
      );
      summary.documentLines++;
    }

    await quotationRepo.update(quotation.id, {
      subTotal: round3(subTotal),
      total: round3(subTotal),
    });
    quotations.push({
      ...quotation,
      total: round3(subTotal),
    } as QuotationEntity);
  }
  summary.quotations = quotations.length;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: Customer Orders (35)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [6/14] Creating customer orders...');
  const customerOrderRepo = ds.getRepository(CustomerOrderEntity);
  const customerOrderMetaRepo = ds.getRepository(CustomerOrderMetaDataEntity);
  const customerOrderEntryRepo = ds.getRepository(
    ArticleCustomerOrderEntryEntity,
  );
  const customerOrders: CustomerOrderEntity[] = [];

  // Link orders only to quotations in a frontend-visible accepted state.
  const quotationsForOrders = quotations.filter(
    (q) => q.status === QUOTATION_STATUS.Accepted,
  );

  for (let i = 0; i < 35; i++) {
    const linkedQuotation =
      i < quotationsForOrders.length ? quotationsForOrders[i] : null;
    const client = linkedQuotation
      ? clientFirms.find((f) => f.id === linkedQuotation.firmId) ||
        pick(clientFirms, i * 5)
      : pick(clientFirms, i * 5 + 3);
    const interlocutor = allInterlocutors[clientFirms.indexOf(client)];
    const date = linkedQuotation
      ? addDays(linkedQuotation.date!, randomInt(1, 10, i * 4))
      : randomDate(seedStart, seedEnd, i * 11 + 2);
    const dueDate = addDays(date, randomInt(15, 45, i * 9));

    const status =
      DEMO_DOCUMENT_STATUS_POOLS.customerOrder[
        i % DEMO_DOCUMENT_STATUS_POOLS.customerOrder.length
      ];

    let subTotal = 0;
    const lineCount = randomInt(1, 4, i * 6 + 1);
    const meta = await customerOrderMetaRepo.save(
      customerOrderMetaRepo.create({}),
    );

    const order = await customerOrderRepo.save(
      customerOrderRepo.create({
        sequential: nextRef('ORD', counters.ord),
        activityType: ACTIVITY_TYPE.SELLING,
        date,
        dueDate,
        status,
        currencyId,
        firmId: client.id,
        interlocutorId: interlocutor.id,
        cabinetId,
        bankAccountId: mainBankAccount.id,
        customerOrderMetaData: meta,
        quotationId: linkedQuotation?.id || undefined,
        object: `Commande ${counters.ord.v}`,
        notes: '',
      }),
    );

    const selectedArticles = pickN(
      articles.slice(0, 20),
      lineCount,
      i * 23 + 7,
    );
    for (const art of selectedArticles) {
      const qty = randomInt(1, 8, i * 14 + articles.indexOf(art));
      const unitPrice = art.salePrice || 100;
      const lineTotal = round3(qty * unitPrice);
      subTotal += lineTotal;
      await customerOrderEntryRepo.save(
        customerOrderEntryRepo.create({
          customerOrderId: order.id,
          articleId: art.id,
          unit_price: unitPrice,
          quantity: qty,
          subTotal: lineTotal,
          total: lineTotal,
        }),
      );
      summary.documentLines++;
    }

    await customerOrderRepo.update(order.id, {
      subTotal: round3(subTotal),
      total: round3(subTotal),
    });
    customerOrders.push({
      ...order,
      total: round3(subTotal),
      firmId: client.id,
    } as CustomerOrderEntity);
  }
  summary.customerOrders = customerOrders.length;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7: Delivery Notes (35)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [7/14] Creating delivery notes...');
  const deliveryNoteRepo = ds.getRepository(DeliveryNoteEntity);
  const deliveryNoteMetaRepo = ds.getRepository(DeliveryNoteMetaDataEntity);
  const deliveryNoteEntryRepo = ds.getRepository(
    ArticleDeliveryNoteEntryEntity,
  );
  const deliveryNotes: DeliveryNoteEntity[] = [];

  // Link some to customer orders
  const validatedOrders = customerOrders.filter(
    (o) =>
      o.status === CUSTOMER_ORDER_STATUS.Validated ||
      o.status === CUSTOMER_ORDER_STATUS.Created,
  );

  for (let i = 0; i < 35; i++) {
    const linkedOrder = i < validatedOrders.length ? validatedOrders[i] : null;
    const client = linkedOrder
      ? clientFirms.find((f) => f.id === linkedOrder.firmId) ||
        pick(clientFirms, i * 3)
      : pick(clientFirms, i * 7 + 2);
    const interlocutor = allInterlocutors[clientFirms.indexOf(client)];
    const date = linkedOrder
      ? addDays(linkedOrder.date!, randomInt(1, 7, i * 5))
      : randomDate(seedStart, seedEnd, i * 17 + 3);
    const status =
      DEMO_DOCUMENT_STATUS_POOLS.deliveryNote[
        i % DEMO_DOCUMENT_STATUS_POOLS.deliveryNote.length
      ];

    let subTotal = 0;
    const lineCount = randomInt(1, 3, i * 8 + 2);
    const meta = await deliveryNoteMetaRepo.save(
      deliveryNoteMetaRepo.create({}),
    );

    const dn = await deliveryNoteRepo.save(
      deliveryNoteRepo.create({
        sequential: nextRef('DEL', counters.del),
        activityType: ACTIVITY_TYPE.SELLING,
        date,
        status: status as any,
        currencyId,
        firmId: client.id,
        interlocutorId: interlocutor.id,
        cabinetId,
        bankAccountId: mainBankAccount.id,
        deliveryNoteMetaData: meta,
        customerOrderId: linkedOrder?.id || undefined,
        object: `Bon de livraison ${counters.del.v}`,
        notes: '',
      }),
    );

    const selectedArticles = pickN(
      articles.slice(0, 20),
      lineCount,
      i * 31 + 11,
    );
    for (const art of selectedArticles) {
      const qty = randomInt(1, 6, i * 12 + articles.indexOf(art));
      const unitPrice = art.salePrice || 100;
      const lineTotal = round3(qty * unitPrice);
      subTotal += lineTotal;
      await deliveryNoteEntryRepo.save(
        deliveryNoteEntryRepo.create({
          deliveryNoteId: dn.id,
          articleId: art.id,
          unit_price: unitPrice,
          quantity: qty,
          subTotal: lineTotal,
          total: lineTotal,
        }),
      );
      summary.documentLines++;
    }

    await deliveryNoteRepo.update(dn.id, {
      subTotal: round3(subTotal),
      total: round3(subTotal),
    });
    deliveryNotes.push({
      ...dn,
      total: round3(subTotal),
    } as DeliveryNoteEntity);
  }
  summary.deliveryNotes = deliveryNotes.length;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 8: Goods Issue Notes (25)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [8/14] Creating goods issue notes...');
  const goodsIssueNoteRepo = ds.getRepository(GoodsIssueNoteEntity);
  const goodsIssueNoteMetaRepo = ds.getRepository(GoodsIssueNoteMetaDataEntity);
  const goodsIssueNoteEntryRepo = ds.getRepository(
    ArticleGoodsIssueNoteEntryEntity,
  );
  const goodsIssueNotes: GoodsIssueNoteEntity[] = [];

  for (let i = 0; i < 25; i++) {
    const client = pick(clientFirms, i * 13 + 4);
    const interlocutor = allInterlocutors[clientFirms.indexOf(client)];
    const date = randomDate(seedStart, seedEnd, i * 19 + 7);
    const status =
      DEMO_DOCUMENT_STATUS_POOLS.goodsIssueNote[
        i % DEMO_DOCUMENT_STATUS_POOLS.goodsIssueNote.length
      ];

    let subTotal = 0;
    const lineCount = randomInt(1, 3, i * 9 + 5);
    const meta = await goodsIssueNoteMetaRepo.save(
      goodsIssueNoteMetaRepo.create({}),
    );

    const gin = await goodsIssueNoteRepo.save(
      goodsIssueNoteRepo.create({
        sequential: nextRef('GIN', counters.gin),
        activityType: ACTIVITY_TYPE.SELLING,
        date,
        status,
        currencyId,
        firmId: client.id,
        interlocutorId: interlocutor.id,
        cabinetId,
        bankAccountId: mainBankAccount.id,
        goodsIssueNoteMetaData: meta,
        object: `Bon de sortie ${counters.gin.v}`,
        notes: '',
      }),
    );

    const selectedArticles = pickN(
      articles.slice(0, 20),
      lineCount,
      i * 29 + 3,
    );
    for (const art of selectedArticles) {
      const qty = randomInt(1, 5, i * 15 + articles.indexOf(art));
      const unitPrice = art.salePrice || 100;
      const lineTotal = round3(qty * unitPrice);
      subTotal += lineTotal;
      await goodsIssueNoteEntryRepo.save(
        goodsIssueNoteEntryRepo.create({
          goodsIssueNoteId: gin.id,
          articleId: art.id,
          unit_price: unitPrice,
          quantity: qty,
          subTotal: lineTotal,
          total: lineTotal,
        }),
      );
      summary.documentLines++;
    }

    await goodsIssueNoteRepo.update(gin.id, {
      subTotal: round3(subTotal),
      total: round3(subTotal),
    });
    goodsIssueNotes.push({
      ...gin,
      total: round3(subTotal),
    } as GoodsIssueNoteEntity);
  }
  summary.goodsIssueNotes = goodsIssueNotes.length;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 9: Invoices — Selling (80) + Buying (45)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [9/14] Creating invoices (selling + buying)...');
  const invoiceRepo = ds.getRepository(InvoiceEntity);
  const invoiceMetaRepo = ds.getRepository(InvoiceMetaDataEntity);
  const invoiceEntryRepo = ds.getRepository(ArticleInvoiceEntryEntity);

  const sellingInvoices: InvoiceEntity[] = [];
  const buyingInvoices: InvoiceEntity[] = [];

  // Selling invoice status distribution
  const sellingStatuses = [
    ...Array(25).fill(INVOICE_STATUS.Paid),
    ...Array(15).fill(INVOICE_STATUS.Unpaid),
    ...Array(10).fill(INVOICE_STATUS.PartiallyPaid),
    ...Array(5).fill(INVOICE_STATUS.PartiallySettled),
    ...Array(5).fill(INVOICE_STATUS.Settled),
    ...Array(10).fill(INVOICE_STATUS.Expired),
    ...Array(10).fill(INVOICE_STATUS.Draft),
  ];

  for (let i = 0; i < 80; i++) {
    const client = pick(clientFirms, i * 11 + 3);
    const interlocutor = allInterlocutors[clientFirms.indexOf(client)];
    const date = randomDate(seedStart, seedEnd, i * 7 + 1);
    const dueDate = addDays(date, randomInt(15, 60, i * 13));
    const status = sellingStatuses[i] || INVOICE_STATUS.Draft;
    const lineCount = randomInt(1, 5, i * 4 + 9);
    let subTotal = 0;

    // Link some to delivery notes
    const linkedDN =
      i < 20 && i < deliveryNotes.length ? deliveryNotes[i] : null;
    // Link some to quotations
    const acceptedQuotations = quotations.filter(
      (q) => q.status === QUOTATION_STATUS.Accepted,
    );
    const linkedQuotation =
      i >= 20 && i < 30 && i - 20 < acceptedQuotations.length
        ? acceptedQuotations[i - 20]
        : null;

    // Apply withholding tax to some invoices
    const applyWithholding = i % 5 === 0 && withholdingTaxes.length > 0;
    const wht = applyWithholding ? pick(withholdingTaxes, i * 3) : null;

    const meta = await invoiceMetaRepo.save(invoiceMetaRepo.create({}));

    const invoice = await invoiceRepo.save(
      invoiceRepo.create({
        sequential: nextRef('INV', counters.inv),
        activityType: ACTIVITY_TYPE.SELLING,
        date,
        dueDate,
        status,
        currencyId,
        firmId: client.id,
        interlocutorId: interlocutor.id,
        cabinetId,
        bankAccountId: mainBankAccount.id,
        invoiceMetaData: meta,
        quotationId: linkedQuotation?.id || undefined,
        deliveryNoteId: linkedDN?.id || undefined,
        taxWithholdingId: wht?.id || undefined,
        object: `Facture vente ${counters.inv.v}`,
        notes: '',
      }),
    );

    const selectedArticles = pickN(
      articles.slice(0, 25),
      lineCount,
      i * 37 + 2,
    );
    for (const art of selectedArticles) {
      const qty = randomInt(1, 10, i * 21 + articles.indexOf(art));
      const unitPrice = art.salePrice || 500;
      const lineTotal = round3(qty * unitPrice);
      subTotal += lineTotal;
      await invoiceEntryRepo.save(
        invoiceEntryRepo.create({
          invoiceId: invoice.id,
          articleId: art.id,
          unit_price: unitPrice,
          quantity: qty,
          subTotal: lineTotal,
          total: lineTotal,
        }),
      );
      summary.documentLines++;
    }

    const total = round3(subTotal);
    const taxWithholdingAmount = wht ? round3((total * wht.rate) / 100) : null;

    // Calculate amountPaid based on status
    let amountPaid = 0;
    if (status === INVOICE_STATUS.Paid || status === INVOICE_STATUS.Settled) {
      amountPaid = total;
    } else if (
      status === INVOICE_STATUS.PartiallyPaid ||
      status === INVOICE_STATUS.PartiallySettled
    ) {
      amountPaid = round3(total * randomFloat(0.2, 0.7, i * 23));
    }

    await invoiceRepo.update(invoice.id, {
      subTotal: total,
      total,
      amountPaid,
      taxWithholdingAmount,
    });

    const invoiceWithTotals = {
      ...invoice,
      total,
      amountPaid,
      firmId: client.id,
      date,
      dueDate,
      status,
    } as InvoiceEntity;
    sellingInvoices.push(invoiceWithTotals);
    summary.totalRevenue += total;
  }
  summary.sellingInvoices = sellingInvoices.length;

  // Buying invoices (45)
  const buyingStatuses = [
    ...Array(15).fill(INVOICE_STATUS.Paid),
    ...Array(10).fill(INVOICE_STATUS.Unpaid),
    ...Array(5).fill(INVOICE_STATUS.PartiallyPaid),
    ...Array(3).fill(INVOICE_STATUS.PartiallySettled),
    ...Array(3).fill(INVOICE_STATUS.Settled),
    ...Array(5).fill(INVOICE_STATUS.Expired),
    ...Array(4).fill(INVOICE_STATUS.Draft),
  ];

  for (let i = 0; i < 45; i++) {
    const supplier = pick(supplierFirms, i * 9 + 2);
    const interlocutor =
      allInterlocutors[DEMO_CLIENTS.length + supplierFirms.indexOf(supplier)];
    const date = randomDate(seedStart, seedEnd, i * 11 + 100);
    const dueDate = addDays(date, randomInt(30, 90, i * 7 + 50));
    const status = buyingStatuses[i] || INVOICE_STATUS.Draft;
    const lineCount = randomInt(1, 4, i * 5 + 13);
    let subTotal = 0;

    const applyWithholding = i % 4 === 0 && withholdingTaxes.length > 0;
    const wht = applyWithholding ? pick(withholdingTaxes, i * 7 + 2) : null;

    const meta = await invoiceMetaRepo.save(invoiceMetaRepo.create({}));

    const invoice = await invoiceRepo.save(
      invoiceRepo.create({
        sequential: nextRef('INV', counters.inv),
        activityType: ACTIVITY_TYPE.BUYING,
        date,
        dueDate,
        status,
        currencyId,
        firmId: supplier.id,
        interlocutorId: interlocutor.id,
        cabinetId,
        bankAccountId: mainBankAccount.id,
        invoiceMetaData: meta,
        taxWithholdingId: wht?.id || undefined,
        object: `Facture achat ${counters.inv.v}`,
        notes: '',
      }),
    );

    const selectedArticles = pickN(
      articles.slice(0, 20),
      lineCount,
      i * 41 + 5,
    );
    for (const art of selectedArticles) {
      const qty = randomInt(5, 50, i * 18 + articles.indexOf(art));
      const unitPrice = art.purchasePrice || art.salePrice * 0.6 || 200;
      const lineTotal = round3(qty * unitPrice);
      subTotal += lineTotal;
      await invoiceEntryRepo.save(
        invoiceEntryRepo.create({
          invoiceId: invoice.id,
          articleId: art.id,
          unit_price: unitPrice,
          quantity: qty,
          subTotal: lineTotal,
          total: lineTotal,
        }),
      );
      summary.documentLines++;
    }

    const total = round3(subTotal);
    const taxWithholdingAmount = wht ? round3((total * wht.rate) / 100) : null;

    let amountPaid = 0;
    if (status === INVOICE_STATUS.Paid) {
      amountPaid = total;
    } else if (
      status === INVOICE_STATUS.PartiallyPaid ||
      status === INVOICE_STATUS.PartiallySettled
    ) {
      amountPaid = round3(total * randomFloat(0.3, 0.6, i * 29));
    }

    await invoiceRepo.update(invoice.id, {
      subTotal: total,
      total,
      amountPaid,
      taxWithholdingAmount,
    });

    buyingInvoices.push({
      ...invoice,
      total,
      amountPaid,
      firmId: supplier.id,
      date,
      dueDate,
      status,
    } as InvoiceEntity);
    summary.totalPurchases += total;
  }
  summary.buyingInvoices = buyingInvoices.length;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 10: Credit Notes — Selling (18) + Buying (12)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [10/14] Creating credit notes...');
  const creditNoteRepo = ds.getRepository(CreditNoteEntity);
  const creditNoteMetaRepo = ds.getRepository(CreditNoteMetaDataEntity);
  const creditNoteEntryRepo = ds.getRepository(ArticleCreditNoteEntryEntity);
  const creditNotes: CreditNoteEntity[] = [];

  // Selling credit notes (18)
  const paidSellingInvoices = sellingInvoices.filter(
    (inv) =>
      inv.status === INVOICE_STATUS.Paid ||
      inv.status === INVOICE_STATUS.PartiallyPaid,
  );

  for (let i = 0; i < 18; i++) {
    const sourceInvoice =
      i < paidSellingInvoices.length ? paidSellingInvoices[i] : null;
    const client = sourceInvoice
      ? clientFirms.find((f) => f.id === sourceInvoice.firmId) ||
        pick(clientFirms, i * 4)
      : pick(clientFirms, i * 7 + 5);
    const interlocutor = allInterlocutors[clientFirms.indexOf(client)];
    const date = sourceInvoice
      ? addDays(sourceInvoice.date!, randomInt(5, 30, i * 6))
      : randomDate(seedStart, seedEnd, i * 23 + 50);
    const status =
      DEMO_DOCUMENT_STATUS_POOLS.creditNote[
        i % DEMO_DOCUMENT_STATUS_POOLS.creditNote.length
      ];

    let subTotal = 0;
    const lineCount = randomInt(1, 2, i * 8 + 3);
    const meta = await creditNoteMetaRepo.save(creditNoteMetaRepo.create({}));

    const cn = await creditNoteRepo.save(
      creditNoteRepo.create({
        sequential: nextRef('CRN', counters.crn),
        activityType: ACTIVITY_TYPE.SELLING,
        date,
        status,
        currencyId,
        firmId: client.id,
        interlocutorId: interlocutor.id,
        cabinetId,
        bankAccountId: mainBankAccount.id,
        creditNoteMetaData: meta,
        sourceInvoiceId: sourceInvoice?.id || undefined,
        object: `Avoir client ${counters.crn.v}`,
        notes: '',
      }),
    );

    const selectedArticles = pickN(
      articles.slice(0, 15),
      lineCount,
      i * 33 + 9,
    );
    for (const art of selectedArticles) {
      const qty = randomInt(1, 3, i * 10 + articles.indexOf(art));
      const unitPrice = art.salePrice || 200;
      const lineTotal = round3(qty * unitPrice);
      subTotal += lineTotal;
      await creditNoteEntryRepo.save(
        creditNoteEntryRepo.create({
          creditNoteId: cn.id,
          articleId: art.id,
          unit_price: unitPrice,
          quantity: qty,
          subTotal: lineTotal,
          total: lineTotal,
        }),
      );
      summary.documentLines++;
    }

    const total = round3(subTotal);
    let amountPaid = 0;
    if (status === CREDIT_NOTE_STATUS.Paid) amountPaid = total;
    else if (status === CREDIT_NOTE_STATUS.PartiallyPaid)
      amountPaid = round3(total * 0.5);

    await creditNoteRepo.update(cn.id, { subTotal: total, total, amountPaid });
    creditNotes.push({
      ...cn,
      total,
      activityType: ACTIVITY_TYPE.SELLING,
    } as CreditNoteEntity);
  }
  summary.creditNotesSelling = 18;

  // Buying credit notes (12)
  for (let i = 0; i < 12; i++) {
    const supplier = pick(supplierFirms, i * 6 + 1);
    const interlocutor =
      allInterlocutors[DEMO_CLIENTS.length + supplierFirms.indexOf(supplier)];
    const date = randomDate(seedStart, seedEnd, i * 27 + 80);
    const status =
      DEMO_DOCUMENT_STATUS_POOLS.creditNote[
        i % DEMO_DOCUMENT_STATUS_POOLS.creditNote.length
      ];

    let subTotal = 0;
    const lineCount = randomInt(1, 2, i * 4 + 11);
    const meta = await creditNoteMetaRepo.save(creditNoteMetaRepo.create({}));

    const cn = await creditNoteRepo.save(
      creditNoteRepo.create({
        sequential: nextRef('CRN', counters.crn),
        activityType: ACTIVITY_TYPE.BUYING,
        date,
        status,
        currencyId,
        firmId: supplier.id,
        interlocutorId: interlocutor.id,
        cabinetId,
        bankAccountId: mainBankAccount.id,
        creditNoteMetaData: meta,
        object: `Avoir fournisseur ${counters.crn.v}`,
        notes: '',
      }),
    );

    const selectedArticles = pickN(
      articles.slice(0, 15),
      lineCount,
      i * 39 + 7,
    );
    for (const art of selectedArticles) {
      const qty = randomInt(2, 10, i * 14 + articles.indexOf(art));
      const unitPrice = art.purchasePrice || 150;
      const lineTotal = round3(qty * unitPrice);
      subTotal += lineTotal;
      await creditNoteEntryRepo.save(
        creditNoteEntryRepo.create({
          creditNoteId: cn.id,
          articleId: art.id,
          unit_price: unitPrice,
          quantity: qty,
          subTotal: lineTotal,
          total: lineTotal,
        }),
      );
      summary.documentLines++;
    }

    const total = round3(subTotal);
    await creditNoteRepo.update(cn.id, { subTotal: total, total });
    creditNotes.push({
      ...cn,
      total,
      activityType: ACTIVITY_TYPE.BUYING,
    } as CreditNoteEntity);
  }
  summary.creditNotesBuying = 12;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 11: Return Notes — Selling (15) + Buying (10)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [11/14] Creating return notes...');
  const returnNoteRepo = ds.getRepository(ReturnNoteEntity);
  const returnNoteMetaRepo = ds.getRepository(ReturnNoteMetaDataEntity);
  const returnNoteEntryRepo = ds.getRepository(ArticleReturnNoteEntryEntity);
  const returnNotes: ReturnNoteEntity[] = [];

  // Selling return notes (15)
  const deliveredNotes = deliveryNotes.filter(
    (dn) => dn.status === DELIVERY_NOTE_STATUS.Delivered,
  );

  for (let i = 0; i < 15; i++) {
    const sourceDN = i < deliveredNotes.length ? deliveredNotes[i] : null;
    const client = sourceDN
      ? clientFirms.find((f) => f.id === (sourceDN as any).firmId) ||
        pick(clientFirms, i * 3)
      : pick(clientFirms, i * 9 + 6);
    const interlocutor = allInterlocutors[clientFirms.indexOf(client)];
    const date = sourceDN
      ? addDays((sourceDN as any).date || new Date(), randomInt(3, 20, i * 5))
      : randomDate(seedStart, seedEnd, i * 31 + 60);
    const status =
      DEMO_DOCUMENT_STATUS_POOLS.returnNote[
        i % DEMO_DOCUMENT_STATUS_POOLS.returnNote.length
      ];

    let subTotal = 0;
    const lineCount = randomInt(1, 2, i * 6 + 4);
    const meta = await returnNoteMetaRepo.save(returnNoteMetaRepo.create({}));

    const rn = await returnNoteRepo.save(
      returnNoteRepo.create({
        sequential: nextRef('RTN', counters.rtn),
        activityType: ACTIVITY_TYPE.SELLING,
        date,
        status,
        currencyId,
        firmId: client.id,
        interlocutorId: interlocutor.id,
        cabinetId,
        bankAccountId: mainBankAccount.id,
        returnNoteMetaData: meta,
        sourceDeliveryNoteId: sourceDN?.id || undefined,
        object: `Retour client ${counters.rtn.v}`,
        notes: '',
      }),
    );

    const selectedArticles = pickN(
      articles.slice(0, 15),
      lineCount,
      i * 37 + 4,
    );
    for (const art of selectedArticles) {
      const qty = randomInt(1, 3, i * 11 + articles.indexOf(art));
      const unitPrice = art.salePrice || 200;
      const lineTotal = round3(qty * unitPrice);
      subTotal += lineTotal;
      await returnNoteEntryRepo.save(
        returnNoteEntryRepo.create({
          returnNoteId: rn.id,
          articleId: art.id,
          unit_price: unitPrice,
          quantity: qty,
          subTotal: lineTotal,
          total: lineTotal,
        }),
      );
      summary.documentLines++;
    }

    const total = round3(subTotal);
    await returnNoteRepo.update(rn.id, { subTotal: total, total });
    returnNotes.push({
      ...rn,
      total,
      activityType: ACTIVITY_TYPE.SELLING,
    } as ReturnNoteEntity);
  }
  summary.returnNotesSelling = 15;

  // Buying return notes (10)
  for (let i = 0; i < 10; i++) {
    const supplier = pick(supplierFirms, i * 8 + 3);
    const interlocutor =
      allInterlocutors[DEMO_CLIENTS.length + supplierFirms.indexOf(supplier)];
    const date = randomDate(seedStart, seedEnd, i * 29 + 90);
    const status =
      DEMO_DOCUMENT_STATUS_POOLS.returnNote[
        i % DEMO_DOCUMENT_STATUS_POOLS.returnNote.length
      ];

    let subTotal = 0;
    const lineCount = randomInt(1, 2, i * 7 + 6);
    const meta = await returnNoteMetaRepo.save(returnNoteMetaRepo.create({}));

    const rn = await returnNoteRepo.save(
      returnNoteRepo.create({
        sequential: nextRef('RTN', counters.rtn),
        activityType: ACTIVITY_TYPE.BUYING,
        date,
        status,
        currencyId,
        firmId: supplier.id,
        interlocutorId: interlocutor.id,
        cabinetId,
        bankAccountId: mainBankAccount.id,
        returnNoteMetaData: meta,
        object: `Retour fournisseur ${counters.rtn.v}`,
        notes: '',
      }),
    );

    const selectedArticles = pickN(
      articles.slice(0, 15),
      lineCount,
      i * 43 + 2,
    );
    for (const art of selectedArticles) {
      const qty = randomInt(2, 8, i * 13 + articles.indexOf(art));
      const unitPrice = art.purchasePrice || 150;
      const lineTotal = round3(qty * unitPrice);
      subTotal += lineTotal;
      await returnNoteEntryRepo.save(
        returnNoteEntryRepo.create({
          returnNoteId: rn.id,
          articleId: art.id,
          unit_price: unitPrice,
          quantity: qty,
          subTotal: lineTotal,
          total: lineTotal,
        }),
      );
      summary.documentLines++;
    }

    const total = round3(subTotal);
    await returnNoteRepo.update(rn.id, { subTotal: total, total });
    returnNotes.push({
      ...rn,
      total,
      activityType: ACTIVITY_TYPE.BUYING,
    } as ReturnNoteEntity);
  }
  summary.returnNotesBuying = 10;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 12: Payments — Selling (55) + Buying (30)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [12/14] Creating payments...');
  const paymentRepo = ds.getRepository(PaymentEntity);
  const paymentInvoiceEntryRepo = ds.getRepository(PaymentInvoiceEntryEntity);
  const paymentCreditNoteEntryRepo = ds.getRepository(
    PaymentCreditNoteEntryEntity,
  );

  const paymentModes = [
    PAYMENT_MODE.BankTransfer,
    PAYMENT_MODE.BankTransfer,
    PAYMENT_MODE.BankTransfer,
    PAYMENT_MODE.Check,
    PAYMENT_MODE.Check,
    PAYMENT_MODE.Check,
    PAYMENT_MODE.Cash,
    PAYMENT_MODE.Cash,
    PAYMENT_MODE.BillOfExchange,
    PAYMENT_MODE.BillOfExchange,
    PAYMENT_MODE.WireTransfer,
    PAYMENT_MODE.CreditCard,
  ];

  const collectionStatuses = [
    PAYMENT_COLLECTION_STATUS.PAID,
    PAYMENT_COLLECTION_STATUS.PAID,
    PAYMENT_COLLECTION_STATUS.PAID,
    PAYMENT_COLLECTION_STATUS.PAID,
    PAYMENT_COLLECTION_STATUS.DEPOSITED,
    PAYMENT_COLLECTION_STATUS.DEPOSITED,
    PAYMENT_COLLECTION_STATUS.PENDING,
    PAYMENT_COLLECTION_STATUS.PENDING,
    PAYMENT_COLLECTION_STATUS.PENDING,
    PAYMENT_COLLECTION_STATUS.REJECTED,
  ];

  // Selling payments (55)
  const payableSellingInvoices = sellingInvoices.filter(
    (inv) =>
      inv.status === INVOICE_STATUS.Paid ||
      inv.status === INVOICE_STATUS.PartiallyPaid ||
      inv.status === INVOICE_STATUS.Settled,
  );

  for (let i = 0; i < 55; i++) {
    const linkedInvoice =
      i < payableSellingInvoices.length ? payableSellingInvoices[i] : null;
    const mode = paymentModes[i % paymentModes.length];
    const collectionStatus = collectionStatuses[i % collectionStatuses.length];
    const date = linkedInvoice
      ? addDays(linkedInvoice.date!, randomInt(1, 30, i * 8))
      : randomDate(seedStart, seedEnd, i * 17 + 200);

    const amount = linkedInvoice
      ? round3(
          linkedInvoice.amountPaid ||
            linkedInvoice.total * randomFloat(0.3, 1, i * 5),
        )
      : round3(randomFloat(500, 15000, i * 19 + 3));

    // Due date for checks/bills of exchange
    const dueDate =
      mode === PAYMENT_MODE.Check || mode === PAYMENT_MODE.BillOfExchange
        ? addDays(date, randomInt(30, 90, i * 12))
        : undefined;

    const client = linkedInvoice
      ? clientFirms.find((f) => f.id === linkedInvoice.firmId) ||
        pick(clientFirms, i)
      : pick(clientFirms, i * 3 + 1);

    // Apply withholding tax to some payments
    const applyWht = i % 6 === 0 && withholdingTaxes.length > 0;
    const wht = applyWht ? pick(withholdingTaxes, i * 4) : null;

    const payment = await paymentRepo.save(
      paymentRepo.create({
        activityType: ACTIVITY_TYPE.SELLING,
        cabinetId,
        amount,
        date,
        dueDate,
        mode,
        collectionStatus,
        reference: nextRef('PAY', counters.pay),
        currencyId,
        firmId: client.id,
        treasuryAccountId: pick(bankAccounts, i * 7).id,
        taxWithholdingId: wht?.id || undefined,
        taxWithholdingAmount: wht
          ? round3((amount * wht.rate) / 100)
          : undefined,
        taxWithholdingDate: wht ? date : undefined,
        notes: '',
      }),
    );

    // Link to invoice
    if (linkedInvoice) {
      await paymentInvoiceEntryRepo.save(
        paymentInvoiceEntryRepo.create({
          paymentId: payment.id,
          invoiceId: linkedInvoice.id,
          amount,
        }),
      );
      summary.paymentInvoiceEntries++;
    }

    summary.totalCollectedSelling +=
      collectionStatus === PAYMENT_COLLECTION_STATUS.PAID ? amount : 0;
  }
  summary.paymentsSelling = 55;

  // Buying payments (30)
  const payableBuyingInvoices = buyingInvoices.filter(
    (inv) =>
      inv.status === INVOICE_STATUS.Paid ||
      inv.status === INVOICE_STATUS.PartiallyPaid,
  );

  for (let i = 0; i < 30; i++) {
    const linkedInvoice =
      i < payableBuyingInvoices.length ? payableBuyingInvoices[i] : null;
    const mode = paymentModes[i % paymentModes.length];
    const collectionStatus = [
      PAYMENT_COLLECTION_STATUS.PAID_SUPPLIER,
      PAYMENT_COLLECTION_STATUS.PAID_SUPPLIER,
      PAYMENT_COLLECTION_STATUS.DEPOSITED_SUPPLIER,
      PAYMENT_COLLECTION_STATUS.PENDING,
    ][i % 4];
    const date = linkedInvoice
      ? addDays(linkedInvoice.date!, randomInt(5, 45, i * 6))
      : randomDate(seedStart, seedEnd, i * 13 + 300);

    const amount = linkedInvoice
      ? round3(linkedInvoice.amountPaid || linkedInvoice.total * 0.5)
      : round3(randomFloat(1000, 30000, i * 23 + 7));

    const dueDate =
      mode === PAYMENT_MODE.Check || mode === PAYMENT_MODE.BillOfExchange
        ? addDays(date, randomInt(30, 90, i * 15))
        : undefined;

    const supplier = linkedInvoice
      ? supplierFirms.find((f) => f.id === linkedInvoice.firmId) ||
        pick(supplierFirms, i)
      : pick(supplierFirms, i * 5 + 2);

    const payment = await paymentRepo.save(
      paymentRepo.create({
        activityType: ACTIVITY_TYPE.BUYING,
        cabinetId,
        amount,
        date,
        dueDate,
        mode,
        collectionStatus,
        reference: nextRef('PAY', counters.pay),
        currencyId,
        firmId: supplier.id,
        treasuryAccountId: pick(bankAccounts, i * 9 + 1).id,
        notes: '',
      }),
    );

    if (linkedInvoice) {
      await paymentInvoiceEntryRepo.save(
        paymentInvoiceEntryRepo.create({
          paymentId: payment.id,
          invoiceId: linkedInvoice.id,
          amount,
        }),
      );
      summary.paymentInvoiceEntries++;
    }

    summary.totalCollectedBuying +=
      collectionStatus === PAYMENT_COLLECTION_STATUS.PAID_SUPPLIER ||
      collectionStatus === PAYMENT_COLLECTION_STATUS.DEPOSITED_SUPPLIER
        ? amount
        : 0;
  }
  summary.paymentsBuying = 30;

  // Link some payments to credit notes
  const paidCreditNotes = creditNotes
    .filter((cn) => (cn as any).activityType === ACTIVITY_TYPE.SELLING)
    .slice(0, 5);
  for (let i = 0; i < paidCreditNotes.length; i++) {
    const cn = paidCreditNotes[i];
    // Create a payment specifically for credit note settlement
    const payment = await paymentRepo.save(
      paymentRepo.create({
        activityType: ACTIVITY_TYPE.SELLING,
        cabinetId,
        amount: round3((cn.total || 500) * 0.8),
        date: addDays(cn.date || new Date(), 10),
        mode: PAYMENT_MODE.CreditNoteSettlement,
        collectionStatus: PAYMENT_COLLECTION_STATUS.PAID,
        reference: nextRef('PAY', counters.pay),
        currencyId,
        firmId: cn.firmId,
        treasuryAccountId: mainBankAccount.id,
        notes: '',
      }),
    );
    await paymentCreditNoteEntryRepo.save(
      paymentCreditNoteEntryRepo.create({
        paymentId: payment.id,
        creditNoteId: cn.id,
        amount: round3((cn.total || 500) * 0.8),
      }),
    );
    summary.paymentCreditNoteEntries++;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 13: Treasury Movements (80)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [13/14] Creating treasury movements...');
  const treasuryRepo = ds.getRepository(TreasuryMovementEntity);

  const movementLabels = {
    income: [
      'Encaissement client',
      'Virement reçu',
      'Remise chèque',
      'Encaissement traite',
      'Dépôt espèces',
    ],
    expense: [
      'Paiement fournisseur',
      'Virement émis',
      'Frais bancaires',
      'Salaires',
      'Loyer',
      'Charges sociales',
    ],
    adjustment: ['Ajustement comptable', 'Régularisation'],
    transfer: ['Transfert interne'],
  };

  for (let i = 0; i < 80; i++) {
    const kindIdx = i % 10;
    let kind: TREASURY_MOVEMENT_KIND;
    let direction: TREASURY_MOVEMENT_DIRECTION;

    if (kindIdx < 4) {
      kind = TREASURY_MOVEMENT_KIND.INCOME;
      direction = TREASURY_MOVEMENT_DIRECTION.IN;
    } else if (kindIdx < 7) {
      kind = TREASURY_MOVEMENT_KIND.EXPENSE;
      direction = TREASURY_MOVEMENT_DIRECTION.OUT;
    } else if (kindIdx < 9) {
      kind = TREASURY_MOVEMENT_KIND.ADJUSTMENT;
      direction =
        i % 2 === 0
          ? TREASURY_MOVEMENT_DIRECTION.IN
          : TREASURY_MOVEMENT_DIRECTION.OUT;
    } else {
      kind = TREASURY_MOVEMENT_KIND.TRANSFER;
      direction = TREASURY_MOVEMENT_DIRECTION.OUT;
    }

    const labels = movementLabels[kind];
    const label = `DEMO-${labels[i % labels.length]} #${i + 1}`;
    const amount = round3(randomFloat(200, 25000, i * 31 + 11));
    const movementDate = randomDate(seedStart, seedEnd, i * 19 + 5);
    const account = pick(bankAccounts, i * 7 + 3);

    await treasuryRepo.save(
      treasuryRepo.create({
        accountId: account.id,
        currencyId,
        kind,
        direction,
        amount,
        label,
        notes: '',
        movementDate,
      }),
    );
  }
  summary.treasuryMovements = 80;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 14: Summary
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  [14/14] Seed complete!\n');
  console.log('  ╔══════════════════════════════════════════════════════╗');
  console.log('  ║         ERP DEMO SEED SUMMARY                       ║');
  console.log('  ╠══════════════════════════════════════════════════════╣');
  console.log(
    `  ║ Bank accounts:        ${String(summary.bankAccounts).padStart(5)} ║`,
  );
  console.log(
    `  ║ Withholding taxes:    ${String(summary.withholdingTaxes).padStart(5)} ║`,
  );
  console.log(
    `  ║ Clients:              ${String(summary.clients).padStart(5)} ║`,
  );
  console.log(
    `  ║ Suppliers:            ${String(summary.suppliers).padStart(5)} ║`,
  );
  console.log(
    `  ║ Interlocutors:        ${String(summary.interlocutors).padStart(5)} ║`,
  );
  console.log(
    `  ║ Articles:             ${String(summary.articles).padStart(5)} ║`,
  );
  console.log(
    `  ║ Quotations:           ${String(summary.quotations).padStart(5)} ║`,
  );
  console.log(
    `  ║ Customer orders:      ${String(summary.customerOrders).padStart(5)} ║`,
  );
  console.log(
    `  ║ Delivery notes:       ${String(summary.deliveryNotes).padStart(5)} ║`,
  );
  console.log(
    `  ║ Goods issue notes:    ${String(summary.goodsIssueNotes).padStart(5)} ║`,
  );
  console.log(
    `  ║ Selling invoices:     ${String(summary.sellingInvoices).padStart(5)} ║`,
  );
  console.log(
    `  ║ Buying invoices:      ${String(summary.buyingInvoices).padStart(5)} ║`,
  );
  console.log(
    `  ║ Credit notes (sell):  ${String(summary.creditNotesSelling).padStart(5)} ║`,
  );
  console.log(
    `  ║ Credit notes (buy):   ${String(summary.creditNotesBuying).padStart(5)} ║`,
  );
  console.log(
    `  ║ Return notes (sell):  ${String(summary.returnNotesSelling).padStart(5)} ║`,
  );
  console.log(
    `  ║ Return notes (buy):   ${String(summary.returnNotesBuying).padStart(5)} ║`,
  );
  console.log(
    `  ║ Payments (selling):   ${String(summary.paymentsSelling).padStart(5)} ║`,
  );
  console.log(
    `  ║ Payments (buying):    ${String(summary.paymentsBuying).padStart(5)} ║`,
  );
  console.log(
    `  ║ Payment-invoice links:${String(summary.paymentInvoiceEntries).padStart(5)} ║`,
  );
  console.log(
    `  ║ Payment-CN links:     ${String(summary.paymentCreditNoteEntries).padStart(5)} ║`,
  );
  console.log(
    `  ║ Treasury movements:   ${String(summary.treasuryMovements).padStart(5)} ║`,
  );
  console.log(
    `  ║ Document lines total: ${String(summary.documentLines).padStart(5)} ║`,
  );
  console.log('  ╠══════════════════════════════════════════════════════╣');
  console.log(
    `  ║ Total Revenue (sell): ${String(Math.round(summary.totalRevenue)).padStart(12)} TND ║`,
  );
  console.log(
    `  ║ Total Purchases:      ${String(Math.round(summary.totalPurchases)).padStart(12)} TND ║`,
  );
  console.log(
    `  ║ Collected (sell):     ${String(Math.round(summary.totalCollectedSelling)).padStart(12)} TND ║`,
  );
  console.log(
    `  ║ Paid out (buy):       ${String(Math.round(summary.totalCollectedBuying)).padStart(12)} TND ║`,
  );
  console.log('  ╚══════════════════════════════════════════════════════╝\n');
}
