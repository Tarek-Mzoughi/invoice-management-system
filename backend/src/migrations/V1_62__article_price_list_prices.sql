-- Add priceListPrices JSON column to article table for storing multiple price list pricing
ALTER TABLE `article` ADD COLUMN `priceListPrices` JSON DEFAULT NULL;
