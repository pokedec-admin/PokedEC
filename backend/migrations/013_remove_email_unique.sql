-- Remove unique constraint on email to allow multiple accounts per email
ALTER TABLE trainers DROP CONSTRAINT users_email_key;
