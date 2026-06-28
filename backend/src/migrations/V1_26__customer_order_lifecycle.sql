ALTER TABLE `customer_order`
MODIFY COLUMN `status` ENUM (
    'draft',
    'validated',
    'canceled',
    'created',
    'cancelled',
    'customerOrder.status.draft',
    'customerOrder.status.created',
    'customerOrder.status.validated',
    'customerOrder.status.cancelled',
    'customerOrder.status.sent',
    'customerOrder.status.accepted',
    'customerOrder.status.rejected',
    'customerOrder.status.invoiced',
    'customerOrder.status.expired',
    'customerOrder.status.archived',
    'customerOrder.status.non_existent'
) DEFAULT 'customerOrder.status.draft';

UPDATE `customer_order` co
LEFT JOIN `invoice` i ON i.`customerOrderId` = co.`id` AND i.`deletedAt` IS NULL
LEFT JOIN `delivery_note` dn ON dn.`customerOrderId` = co.`id` AND dn.`deletedAt` IS NULL
LEFT JOIN `goods_issue_note` gin ON gin.`customerOrderId` = co.`id` AND gin.`deletedAt` IS NULL
SET co.`status` = CASE
    WHEN co.`status` IN ('draft', 'customerOrder.status.draft', 'customerOrder.status.non_existent')
        THEN 'customerOrder.status.draft'
    WHEN co.`status` IN ('created', 'customerOrder.status.created')
        THEN 'customerOrder.status.created'
    WHEN co.`status` IN (
        'validated',
        'customerOrder.status.validated',
        'customerOrder.status.sent',
        'customerOrder.status.accepted',
        'customerOrder.status.invoiced'
    )
        THEN CASE
            WHEN i.`id` IS NOT NULL OR dn.`id` IS NOT NULL OR gin.`id` IS NOT NULL
                THEN 'customerOrder.status.validated'
            ELSE 'customerOrder.status.created'
        END
    WHEN co.`status` IN (
        'canceled',
        'cancelled',
        'customerOrder.status.cancelled',
        'customerOrder.status.rejected',
        'customerOrder.status.expired',
        'customerOrder.status.archived'
    )
        THEN 'customerOrder.status.cancelled'
    ELSE 'customerOrder.status.draft'
END;

ALTER TABLE `customer_order`
MODIFY COLUMN `status` ENUM (
    'customerOrder.status.draft',
    'customerOrder.status.created',
    'customerOrder.status.validated',
    'customerOrder.status.cancelled',
    'customerOrder.status.invoiced',
    'customerOrder.status.delivered'
) NOT NULL DEFAULT 'customerOrder.status.draft';
