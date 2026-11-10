-- 002: English becomes the default language (customer decision after Round 3).
-- Existing users are switched to English too; anyone can still be set to Albanian or Macedonian.
ALTER TABLE managers  ALTER COLUMN language SET DEFAULT 'en';
ALTER TABLE residents ALTER COLUMN language SET DEFAULT 'en';
UPDATE managers  SET language = 'en' WHERE language = 'sq';
UPDATE residents SET language = 'en' WHERE language = 'sq';
