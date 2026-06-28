SET @legacy_tva19_id = (
    SELECT `id`
    FROM `tax`
    WHERE `cabinetId` IS NULL
      AND `deletedAt` IS NULL
      AND `isRate` = TRUE
      AND `isSpecial` = FALSE
      AND ABS(COALESCE(`value`, -999999) - 19) < 0.000001
      AND LOWER(COALESCE(`label`, '')) IN ('tva', 'vat', 'tva 19%', 'vat 19%')
    ORDER BY `id`
    LIMIT 1
);

UPDATE `tax`
SET
    `label` = 'TVA 19%',
    `value` = 19,
    `isRate` = TRUE,
    `isSpecial` = FALSE,
    `updatedAt` = CURRENT_TIMESTAMP(6)
WHERE `id` = @legacy_tva19_id;

SET @canonical_fodec_id = (
    SELECT `id`
    FROM `tax`
    WHERE `cabinetId` IS NULL
      AND `deletedAt` IS NULL
      AND LOWER(COALESCE(`label`, '')) = 'fodec 1%'
    ORDER BY `id`
    LIMIT 1
);

SET @legacy_fodec_id = (
    SELECT `id`
    FROM `tax`
    WHERE `cabinetId` IS NULL
      AND `deletedAt` IS NULL
      AND LOWER(COALESCE(`label`, '')) = 'fodec'
    ORDER BY `id`
    LIMIT 1
);

UPDATE `tax`
SET
    `label` = 'FODEC 1%',
    `value` = 1,
    `isRate` = TRUE,
    `isSpecial` = TRUE,
    `updatedAt` = CURRENT_TIMESTAMP(6)
WHERE @canonical_fodec_id IS NULL
  AND `id` = @legacy_fodec_id;

UPDATE `tax`
SET
    `deletedAt` = CURRENT_TIMESTAMP(6),
    `updatedAt` = CURRENT_TIMESTAMP(6)
WHERE @canonical_fodec_id IS NOT NULL
  AND `id` = @legacy_fodec_id;

SET @canonical_timbre_id = (
    SELECT `id`
    FROM `tax`
    WHERE `cabinetId` IS NULL
      AND `deletedAt` IS NULL
      AND LOWER(COALESCE(`label`, '')) = 'timbre fiscal'
    ORDER BY `id`
    LIMIT 1
);

SET @legacy_timbre_id = (
    SELECT `id`
    FROM `tax`
    WHERE `cabinetId` IS NULL
      AND `deletedAt` IS NULL
      AND LOWER(COALESCE(`label`, '')) IN ('fodec2', 'timbre')
    ORDER BY `id`
    LIMIT 1
);

UPDATE `tax`
SET
    `label` = 'Timbre fiscal',
    `value` = 1,
    `isRate` = FALSE,
    `isSpecial` = TRUE,
    `updatedAt` = CURRENT_TIMESTAMP(6)
WHERE @canonical_timbre_id IS NULL
  AND `id` = @legacy_timbre_id;

UPDATE `tax`
SET
    `deletedAt` = CURRENT_TIMESTAMP(6),
    `updatedAt` = CURRENT_TIMESTAMP(6)
WHERE @canonical_timbre_id IS NOT NULL
  AND `id` = @legacy_timbre_id;

INSERT INTO `tax` (`label`, `value`, `isRate`, `isSpecial`, `cabinetId`, `isDeletionRestricted`)
SELECT seed.`label`, seed.`value`, seed.`isRate`, seed.`isSpecial`, NULL, FALSE
FROM (
    SELECT 'TVA 0%' AS `label`, 0 AS `value`, TRUE AS `isRate`, FALSE AS `isSpecial`
    UNION ALL SELECT 'TVA 7%', 7, TRUE, FALSE
    UNION ALL SELECT 'TVA 13%', 13, TRUE, FALSE
    UNION ALL SELECT 'TVA 19%', 19, TRUE, FALSE
    UNION ALL SELECT 'Timbre fiscal', 1, FALSE, TRUE
    UNION ALL SELECT 'FODEC 1%', 1, TRUE, TRUE
) seed
WHERE NOT EXISTS (
    SELECT 1
    FROM `tax` existing
    WHERE existing.`cabinetId` IS NULL
      AND existing.`deletedAt` IS NULL
      AND (
        (
          seed.`isRate` = TRUE
          AND seed.`isSpecial` = FALSE
          AND existing.`isRate` = TRUE
          AND existing.`isSpecial` = FALSE
          AND ABS(COALESCE(existing.`value`, -999999) - seed.`value`) < 0.000001
        )
        OR LOWER(COALESCE(existing.`label`, '')) = LOWER(seed.`label`)
      )
);

INSERT INTO `cabinet_tax_configuration`
    (`cabinetId`, `taxId`, `isActive`, `createdAt`, `updatedAt`, `isDeletionRestricted`)
SELECT
    cabinet.`id`,
    tax.`id`,
    CASE
        WHEN cabinet.`onboardingCompleted` = TRUE
          AND JSON_CONTAINS_PATH(cabinet.`taxSettings`, 'one', '$.selectedTaxTemplateIds')
        THEN FALSE
        WHEN cabinet.`onboardingCompleted` = TRUE THEN TRUE
        ELSE FALSE
    END,
    CURRENT_TIMESTAMP(6),
    CURRENT_TIMESTAMP(6),
    FALSE
FROM `cabinet` cabinet
JOIN `tax` tax
  ON tax.`cabinetId` IS NULL
 AND tax.`deletedAt` IS NULL
 AND (
      (
        tax.`isRate` = TRUE
        AND tax.`isSpecial` = FALSE
        AND tax.`value` IN (0, 7, 13, 19)
      )
      OR LOWER(COALESCE(tax.`label`, '')) IN ('timbre fiscal', 'fodec 1%')
 )
WHERE cabinet.`deletedAt` IS NULL
ON DUPLICATE KEY UPDATE
    `isActive` = `cabinet_tax_configuration`.`isActive`;
