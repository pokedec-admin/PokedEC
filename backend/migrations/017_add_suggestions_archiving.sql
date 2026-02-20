-- Migration to add archiving to suggestions
ALTER TABLE suggestions ADD COLUMN archived_user BOOLEAN DEFAULT FALSE;
ALTER TABLE suggestions ADD COLUMN archived_admin BOOLEAN DEFAULT FALSE;
