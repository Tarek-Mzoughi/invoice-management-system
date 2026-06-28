UPDATE `users`
SET `emailVerified` = NOW()
WHERE `mustChangePassword` = TRUE
  AND `emailVerified` IS NULL;
