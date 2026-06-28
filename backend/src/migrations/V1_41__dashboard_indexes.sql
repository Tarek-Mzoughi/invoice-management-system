SET @schema_name = DATABASE();

SET @invoice_dashboard_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'invoice'
    AND INDEX_NAME = 'IDX_invoice_dashboard_scope'
);
SET @invoice_dashboard_index_sql = IF(
  @invoice_dashboard_index = 0,
  'CREATE INDEX `IDX_invoice_dashboard_scope` ON `invoice` (`cabinetId`, `currencyId`, `activityType`, `date`, `status`)',
  'SELECT 1'
);
PREPARE invoice_dashboard_index_stmt FROM @invoice_dashboard_index_sql;
EXECUTE invoice_dashboard_index_stmt;
DEALLOCATE PREPARE invoice_dashboard_index_stmt;

SET @invoice_due_dashboard_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'invoice'
    AND INDEX_NAME = 'IDX_invoice_dashboard_due'
);
SET @invoice_due_dashboard_index_sql = IF(
  @invoice_due_dashboard_index = 0,
  'CREATE INDEX `IDX_invoice_dashboard_due` ON `invoice` (`cabinetId`, `currencyId`, `activityType`, `dueDate`, `status`)',
  'SELECT 1'
);
PREPARE invoice_due_dashboard_index_stmt FROM @invoice_due_dashboard_index_sql;
EXECUTE invoice_due_dashboard_index_stmt;
DEALLOCATE PREPARE invoice_due_dashboard_index_stmt;

SET @payment_dashboard_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'payment'
    AND INDEX_NAME = 'IDX_payment_dashboard_scope'
);
SET @payment_dashboard_index_sql = IF(
  @payment_dashboard_index = 0,
  'CREATE INDEX `IDX_payment_dashboard_scope` ON `payment` (`cabinetId`, `currencyId`, `activityType`, `date`, `mode`, `collectionStatus`)',
  'SELECT 1'
);
PREPARE payment_dashboard_index_stmt FROM @payment_dashboard_index_sql;
EXECUTE payment_dashboard_index_stmt;
DEALLOCATE PREPARE payment_dashboard_index_stmt;

SET @payment_due_dashboard_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'payment'
    AND INDEX_NAME = 'IDX_payment_dashboard_due'
);
SET @payment_due_dashboard_index_sql = IF(
  @payment_due_dashboard_index = 0,
  'CREATE INDEX `IDX_payment_dashboard_due` ON `payment` (`cabinetId`, `currencyId`, `activityType`, `dueDate`, `mode`, `collectionStatus`)',
  'SELECT 1'
);
PREPARE payment_due_dashboard_index_stmt FROM @payment_due_dashboard_index_sql;
EXECUTE payment_due_dashboard_index_stmt;
DEALLOCATE PREPARE payment_due_dashboard_index_stmt;

SET @quotation_dashboard_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'quotation'
    AND INDEX_NAME = 'IDX_quotation_dashboard_scope'
);
SET @quotation_dashboard_index_sql = IF(
  @quotation_dashboard_index = 0,
  'CREATE INDEX `IDX_quotation_dashboard_scope` ON `quotation` (`cabinetId`, `currencyId`, `activityType`, `date`, `status`)',
  'SELECT 1'
);
PREPARE quotation_dashboard_index_stmt FROM @quotation_dashboard_index_sql;
EXECUTE quotation_dashboard_index_stmt;
DEALLOCATE PREPARE quotation_dashboard_index_stmt;

SET @customer_order_dashboard_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'customer_order'
    AND INDEX_NAME = 'IDX_customer_order_dashboard_scope'
);
SET @customer_order_dashboard_index_sql = IF(
  @customer_order_dashboard_index = 0,
  'CREATE INDEX `IDX_customer_order_dashboard_scope` ON `customer_order` (`cabinetId`, `currencyId`, `activityType`, `date`, `status`)',
  'SELECT 1'
);
PREPARE customer_order_dashboard_index_stmt FROM @customer_order_dashboard_index_sql;
EXECUTE customer_order_dashboard_index_stmt;
DEALLOCATE PREPARE customer_order_dashboard_index_stmt;

SET @firm_dashboard_index = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @schema_name
    AND TABLE_NAME = 'firm'
    AND INDEX_NAME = 'IDX_firm_dashboard_scope'
);
SET @firm_dashboard_index_sql = IF(
  @firm_dashboard_index = 0,
  'CREATE INDEX `IDX_firm_dashboard_scope` ON `firm` (`cabinetId`, `entityType`, `currencyId`)',
  'SELECT 1'
);
PREPARE firm_dashboard_index_stmt FROM @firm_dashboard_index_sql;
EXECUTE firm_dashboard_index_stmt;
DEALLOCATE PREPARE firm_dashboard_index_stmt;
